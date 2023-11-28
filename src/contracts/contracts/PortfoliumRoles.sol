// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

abstract contract PortfoliumRoles {
    // ---------- USER ROLES ----------
    bytes32 public constant ADMIN_ROLE = keccak256("PORTFOLIUM_ADMINS");
    bytes32 public constant USER_ROLE = keccak256("PORTFOLIUM_USERS");

    // ---------- CONTRACTS ROLES ----------
    bytes32 public constant TREASURY_ROLE = keccak256("PORTFOLIUM_TREASURY");
    bytes32 public constant PORTFOLIUM_ROLE = keccak256("PORTFOLIUM");

    // ---------- OPERATORS ROLES ----------
    bytes32 public constant REBALANCER_ROLE =
        keccak256("PORTFOLIUM_FUND_BALANCER");
    bytes32 public constant MINTER_ROLE = keccak256("PORTFOLIUM_MINTER");
}
