// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ITokenStore.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IGuard.sol";
import "./PortfoliumRoles.sol";

contract Portfolium is Pausable, ReentrancyGuard, PortfoliumRoles {
    struct AssetWeightInput {
        address assetAddress;
        uint16 weight;
    }

    IGuard private _guard;
    ITokenStore private _tokenStore;
    ITreasury private _treasury;
    IOracle private _oracle;
    address private _weth;

    uint24 public rebalancingTolerance;
    uint256 public minimumInvestment;
    mapping(address => uint24) public allocationWeights;

    constructor(
        address guard,
        address tokenStore,
        address oracle,
        address treasury,
        address token,
        address weth
    ) {
        _oracle = IOracle(oracle);
        _tokenStore = ITokenStore(tokenStore);
        _treasury = ITreasury(treasury);
        _guard = IGuard(guard);
        _weth = weth;
        rebalancingTolerance = 5_000; // 0.5%
        minimumInvestment = 1 ether;
    }

    // ---------- EVENTS ----------

    event InvestmentDeposited(address caller, uint256 amount);
    event InvestmentWithdrawn(address caller, uint256 amount);
    event TokenAdded(address indexed tokenAddress);
    event AllocationsUpdated(address indexed tokenAddress, uint256 newBalance);
    event TokenWeightUpdated(address indexed tokenAddress, uint24 newWeight);
    event RebalancingToleranceUpdated(uint24 newRebalancingTolerance);
    event MinimumInvestmentAmountUpdated(
        address admin,
        uint256 newMinimumInvestmentAmount
    );

    // ---------- MODIFIERS ----------

    modifier onlyAdmin() {
        require(
            _guard.hasPortfoliumRole(ADMIN_ROLE, msg.sender),
            "Portfolium: caller must be an admin"
        );
        _;
    }

    modifier onlyUser() {
        require(
            _guard.hasPortfoliumRole(USER_ROLE, msg.sender),
            "Portfolium: caller must be a shareholder"
        );
        _;
    }

    modifier onlyRebalancer() {
        require(
            _guard.hasPortfoliumRole(REBALANCER_ROLE, msg.sender),
            "Portfolium: caller must be a fund balancer"
        );
        _;
    }

    // --- MANAGEMENT ---

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function updateMinimumInvestment(
        uint256 newMinimumInvestment
    ) external onlyAdmin {
        minimumInvestment = newMinimumInvestment;
        emit MinimumInvestmentAmountUpdated(msg.sender, newMinimumInvestment);
    }

    // ---------- MUTABLE PROPERTIES ----------

    function updateRebalancingTolerance(
        uint24 newRebalancingTolerance
    ) external onlyAdmin {
        rebalancingTolerance = newRebalancingTolerance;
        emit RebalancingToleranceUpdated(newRebalancingTolerance);
    }

    // ---------- ASSETS ----------

    function addToken(address tokenAddress) external onlyAdmin {
        _addToken(tokenAddress);
    }

    function updateWeights(
        AssetWeightInput[] memory newAssetWeights
    ) external onlyAdmin {
        uint24 sum = 0;
        for (uint256 i = 0; i < newAssetWeights.length; i++) {
            sum += newAssetWeights[i].weight;
        }
        require(
            sum == 1_000_000,
            "Portfolium: Sum of weights has to be 1.000.000"
        );

        for (uint256 i = 0; i < newAssetWeights.length; i++) {
            allocationWeights[
                newAssetWeights[i].assetAddress
            ] = newAssetWeights[i].weight;
            emit TokenWeightUpdated(
                newAssetWeights[i].assetAddress,
                newAssetWeights[i].weight
            );
        }
    }

    // ---------- INVESTMENTS ----------

    function invest() external payable onlyUser {
        require(
            msg.value >= minimumInvestment,
            "Portfolium: Insufficient amount transferred"
        );
        _treasury.deposit();
        address[] memory tokenAddresses = _tokenStore.getTokenAddresses();
        for (uint i; i < tokenAddresses.length; i++) {
            ITokenStore.Token memory token = _tokenStore.getToken(
                tokenAddresses[i]
            );
            uint24 allocation = allocationWeights[token.tokenAddress];
            if (allocation > 0) {
                uint256 amountIn = (msg.value * allocation) / 1_000_000;
                // TODO: calculate amountOut
                uint256 amountOutMin = _oracle.getNativePrice(
                    token.tokenAddress
                );
                _treasury.swapTokens(
                    _weth,
                    token.tokenAddress,
                    amountIn,
                    amountOutMin
                );
            }
        }
    }

    // ---------- HELPERS ----------

    function _addToken(address tokenAddress) private {
        _tokenStore.addToken(tokenAddress, ITokenStore.TokenTypes.ERC20);
        emit TokenAdded(tokenAddress);
    }
}
