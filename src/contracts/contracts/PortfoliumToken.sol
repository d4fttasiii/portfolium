// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IGuard.sol";
import "./interfaces/IToken.sol";
import "./PortfoliumRoles.sol";

contract PortfoliumToken is IToken, ERC20, PortfoliumRoles {
    IGuard private _guard;
    uint256 private _maximumSupply;

    constructor(
        address guard,
        uint256 maximumSupply,
        address initialTokenHolder
    ) ERC20("Portfolium", "PT") {
        _guard = IGuard(guard);
        _maximumSupply = maximumSupply; 
    }

    modifier onlyMinter() {
        require(
            _guard.hasPortfoliumRole(MINTER_ROLE, msg.sender),
            "PortfoliumToken: caller must be a minter"
        );
        _;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        if (_maximumSupply >= amount + totalSupply()) {
            _mint(to, amount);
        }
    }
}
