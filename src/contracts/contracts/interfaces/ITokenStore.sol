// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITokenStore {
    enum TokenTypes {
        Native,
        ERC20
    }

    struct Token {
        address tokenAddress;
        TokenTypes tokenType;
        string name;
        string symbol;
        uint8 decimals;
    }

    /// @notice Emitted when a new token is added
    event TokenAdded(address indexed tokenAddress, string name, uint256 timestamp);

    /// @notice Emitted when a token is removed
    event TokenRemoved(address indexed tokenAddress, string name, uint256 timestamp);

    function addToken(address tokenAddress, TokenTypes tokenType) external;

    function removeToken(address tokenAddress) external;

    function tokenExists(address tokenAddress) external returns (bool);

    function getToken(
        address tokenAddress
    ) external view returns (Token memory);
}
