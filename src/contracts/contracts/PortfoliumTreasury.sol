// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ITokenStore.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IGuard.sol";
import "./interfaces/IWETH.sol";
import "./PortfoliumRoles.sol";

contract PortfoliumTreasury is PortfoliumRoles, ITreasury {
    IGuard private _guard;
    ITokenStore private _tokenStore;
    ISwapRouter private _uniswapRouter;
    IWETH private _weth;

    constructor(
        address guard,
        address tokenStore,
        address uniswapRouter,
        address weth
    ) {
        _guard = IGuard(guard);
        _tokenStore = ITokenStore(tokenStore);
        _uniswapRouter = ISwapRouter(uniswapRouter);
        _weth = IWETH(weth);
    }

    modifier onlyPortfolium() {
        require(
            _guard.hasPortfoliumRole(PORTFOLIUM_ROLE, msg.sender),
            "PortfoliumTreasury: Caller must be the portfolium contract"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            _guard.hasPortfoliumRole(ADMIN_ROLE, msg.sender),
            "PortfoliumTreasury: Caller must be an admin"
        );
        _;
    }

    // ---------- SWAP ----------

    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external onlyPortfolium returns (uint256) {
        require(
            _tokenStore.tokenExists(tokenIn),
            "PortfoliumTreasury: tokenIn is unknown"
        );
        require(
            _tokenStore.tokenExists(tokenOut),
            "PortfoliumTreasury: tokenOut is unknown"
        );

        // Approve the router to spend the tokens
        TransferHelper.safeApprove(tokenIn, address(_uniswapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 3000,
                recipient: msg.sender,
                deadline: block.timestamp + 30,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        // Execute the swap
        uint256 amountOut = _uniswapRouter.exactInputSingle(params);
        emit TokenSwapped(tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    function deposit() external payable onlyPortfolium {
        _weth.deposit{value: msg.value}();
    }

    function withdraw(
        address recipient,
        uint256 amount
    ) external payable onlyPortfolium {
        _weth.withdraw(amount);
        payable(recipient).transfer(amount);
        emit Withdrawn(recipient, amount);
    }

    receive() external payable {}

    // ---------- GETTERS ----------

    function getBalanceOf(address assetAddress) public view returns (uint256) {
        if (assetAddress == address(1)) {
            return address(this).balance;
        }

        IERC20 token = IERC20(assetAddress);
        return token.balanceOf(address(this));
    }
}
