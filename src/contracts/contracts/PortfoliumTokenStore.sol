// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import "./interfaces/ITokenStore.sol";
import "./interfaces/IGuard.sol";
import "./PortfoliumRoles.sol";

contract PortfoliumTokenStore is PortfoliumRoles, ITokenStore {
    IGuard private _guard;
    mapping(address => Token) private _tokens;
    address[] private _tokenAddresses;

    constructor(address guard, address weth) {
        _guard = IGuard(guard);
        _addToken(weth, TokenTypes.Native);
    }

    // ---------- MODIFIERS ----------

    modifier onlyPortfolium() {
        require(
            _guard.hasPortfoliumRole(PORTFOLIUM_ROLE, msg.sender),
            "PortfoliumTokenStore: Caller must be the portfolium contract"
        );
        _;
    }

    // ---------- MANAGEMENT ----------

    function addToken(
        address tokenAddress,
        TokenTypes tokenType
    ) external onlyPortfolium {
        _addToken(tokenAddress, tokenType);
    }

    function removeToken(address tokenAddress) external onlyPortfolium {
        require(
            _tokenExists(tokenAddress),
            "PortfoliumTokenStore: Token already removed!"
        );

        string memory name = _tokens[tokenAddress].name;
        _tokens[tokenAddress] = Token(address(0), TokenTypes.Native, "", "", 0);

        emit TokenRemoved(tokenAddress, name, block.timestamp);
    }

    // ---------- GETTERS ----------

    function tokenExists(address tokenAddress) external view returns (bool) {
        return _tokenExists(tokenAddress);
    }

    function getToken(
        address tokenAddress
    ) external view returns (Token memory) {
        if (_tokenExists(tokenAddress)) {
            return _tokens[tokenAddress];
        }

        revert("PortfoliumTokenStore: Token not found!");
    }

    function getTokenAddresses() external view returns (address[] memory) {
        return _tokenAddresses;
    }

    // ---------- HELPERS ----------

    function _tokenExists(address tokenAddress) private view returns (bool) {
        return _tokens[tokenAddress].tokenAddress != address(0);
    }

    function _addToken(address tokenAddress, TokenTypes tokenType) private {
        require(
            !_tokenExists(tokenAddress),
            "PortfoliumTokenStore: Token already exists!"
        );
        IERC20Metadata metadata = IERC20Metadata(tokenAddress);
        string memory name = metadata.name();

        _tokens[tokenAddress] = Token(
            tokenAddress,
            tokenType,
            name,
            metadata.symbol(),
            metadata.decimals()
        );
        _tokenAddresses.push(tokenAddress);

        emit TokenAdded(tokenAddress, name, block.timestamp);
    }
}
