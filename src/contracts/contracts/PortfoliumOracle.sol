// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import "./interfaces/ITokenStore.sol";
import "./interfaces/IGuard.sol";
import "./interfaces/IOracle.sol";
import "./PortfoliumRoles.sol";

contract PortfoliumOracle is PortfoliumRoles, IOracle {
    IGuard private _guard;
    ITokenStore private _tokenStore;
    IUniswapV3Factory private _uniswapFactory;
    uint24[3] private _feeTiers = [3000, 500, 10000];

    constructor(address guard, address tokenStore, address uniswapFactory) {
        _guard = IGuard(guard);
        _tokenStore = ITokenStore(tokenStore);
        _uniswapFactory = IUniswapV3Factory(uniswapFactory);
    }

    // ---------- MODIFIERS ----------

    modifier onlyAdmin() {
        require(
            _guard.hasPortfoliumRole(ADMIN_ROLE, msg.sender),
            "PortfoliumOracle: caller must be an admin"
        );
        _;
    }

    // ---------- MANAGEMENT ----------

    function updateFeeTiers(uint24[3] memory feeTiers) external onlyAdmin {
        _feeTiers = feeTiers;
    }

    // ---------- GETTERS ----------

    function getNativePrice(
        address tokenAddress
    ) external view returns (uint256) {
        return _getPrice(tokenAddress, address(1));
    }

    function getConversionRate(
        address tokenA,
        address tokenB
    ) external view returns (uint256) {
        return _getPrice(tokenA, tokenB);
    }

    // function getBuyingCost(
    //     address assetAddress,
    //     uint256 amount
    // ) external view returns (uint256) {
    //     AssetTypes assetType = assetProperties[assetAddress].assetType;
    //     (uint256 price, ) = _getPrice(assetAddress, true);
    //     uint256 cost = price * amount;

    //     if (assetType == AssetTypes.Synthetic) {
    //         uint256 commission = ISynthetic(assetAddress).getCommission();
    //         cost = cost.mul(commission.add(10_000)).div(10_000);
    //     }

    //     return cost;
    // }

    // function getPayoutAmount(
    //     address assetAddress,
    //     uint256 amount
    // ) external view returns (uint256) {
    //     AssetTypes assetType = assetProperties[assetAddress].assetType;
    //     (uint256 price, ) = _getPrice(assetAddress, true);
    //     uint256 payoutAmount = price * amount;

    //     if (assetType == AssetTypes.Synthetic) {
    //         uint256 commission = ISynthetic(assetAddress).getCommission();
    //         payoutAmount = payoutAmount.mul(10_000).div(commission.add(10_000));
    //     }

    //     return payoutAmount;
    // }

    // ---------- HELPERS ----------

    function _getPrice(
        address tokenA,
        address tokenB
    ) private view returns (uint256) {
        if (tokenA == tokenB) {
            return 1;
        }

        ITokenStore.Token memory propA = _tokenStore.getToken(tokenA);
        ITokenStore.Token memory propB = _tokenStore.getToken(tokenB);
        
        for (uint8 i = 0; i < _feeTiers.length; i++) {
            address poolAddress = _uniswapFactory.getPool(
                propA.tokenAddress,
                propB.tokenAddress,
                _feeTiers[i]
            );

            if (poolAddress != address(0)) {
                return
                    _getUniswapPrice(
                        poolAddress,
                        propA.decimals,
                        propB.decimals
                    );
            }
        }

        return 0;
    }

    function _getUniswapPrice(
        address poolAddress,
        uint8 decimalsA,
        uint8 decimalsB
    ) private view returns (uint256) {
        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);
        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();
        uint256 price = (uint256(sqrtPriceX96) *
            uint256(sqrtPriceX96) *
            10 ** (decimalsA + 18)) / (10 ** decimalsB * 2 ** 192);

        return price;
    }
}
