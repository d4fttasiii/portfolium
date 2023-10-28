// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

/**
 * @title Treasury Interface
 * @dev This interface represents the methods exposed by the PortfoliumTreasury contract.
 */
interface ITreasury {
    event TokenSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    /**
     * @dev Emitted when funds are withdrawn.
     * @param recipient The address receiving the funds.
     * @param amount The amount withdrawn.
     */
    event Withdrawn(address indexed recipient, uint256 amount);

    function deposit() external payable;

    function withdraw(address recipient, uint256 amount) external payable;

    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external returns (uint256);
}
