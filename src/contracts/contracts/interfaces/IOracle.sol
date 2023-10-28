// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

/**
 * @title IOracle Interface
 * @notice This interface outlines the essential methods for price-related queries and updates.
 * Oracle implementers should adhere to this interface.
 */
interface IOracle {
    // /**
    //  * @notice Calculate the buying cost of a given amount of an token.
    //  * @param tokenAddress The address of the token for which the cost is to be calculated.
    //  * @param amount The amount of the token to be bought.
    //  * @return The total cost of buying the given amount of the token.
    //  */
    // function getBuyingCost(
    //     address tokenAddress,
    //     uint256 amount
    // ) external view returns (uint256);

    // /**
    //  * @notice Calculate the payout amount for a given amount of an token.
    //  * @param tokenAddress The address of the token for which the payout amount is to be calculated.
    //  * @param amount The amount of the token to be used for the payout.
    //  * @return The total amount to be paid out for the given amount of the token.
    //  */
    // function getPayoutAmount(
    //     address tokenAddress,
    //     uint256 amount
    // ) external view returns (uint256);

    /**
     * @notice Get the current price of an token and the timestamp at which the price was last updated.
     * @param tokenAddress The address of the token for which to get the price.
     * @return price The current price of the token.
     */
    function getNativePrice(
        address tokenAddress
    ) external view returns (uint256 price);

    function getConversionRate(
        address tokenA,
        address tokenB
    ) external view returns (uint256 price);
}
