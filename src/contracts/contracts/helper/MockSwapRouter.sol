// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockSwapRouter is ISwapRouter {
    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable override returns (uint256 amountOut) {
        IERC20 tokenInContract = IERC20(params.tokenIn);
        IERC20 tokenOutContract = IERC20(params.tokenOut);

        // The caller must approve the router to spend the input tokens
        require(
            tokenInContract.transferFrom(msg.sender, address(this), params.amountIn),
            "MockSwapRouter: transferFrom failed"
        );

        // Perform the swap logic here
        // For simplicity, we're just transferring the output tokens to the recipient
        // In a real swap, there would be some logic to determine the amount of output tokens
        require(
            tokenOutContract.transfer(msg.sender, params.amountOutMinimum),
            "MockSwapRouter: transfer failed"
        );

        return params.amountOutMinimum;
    }

    function exactInput(
        ExactInputParams calldata params
    ) external payable override returns (uint256 amountOut) {
        revert("Not implemented");
    }

    function exactOutputSingle(
        ExactOutputSingleParams calldata params
    ) external payable returns (uint256 amountIn) {
        revert("Not implemented");
    }

    function exactOutput(
        ExactOutputParams calldata params
    ) external payable returns (uint256 amountIn) {
        revert("Not implemented");
    }

    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        revert("Not implemented");
    }
}
