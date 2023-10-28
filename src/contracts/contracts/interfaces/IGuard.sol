// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

/// @title IGuard
/// @notice Interface for the PortfoliumGuard contract.
/// @dev This interface defines the functions and events of the PortfoliumGuard contract.
interface IGuard {
    event RequestCreated(
        uint256 requestId,
        address indexed account,
        bytes32 role
    );
    event RequestRejected(uint256 requestId, address indexed signer);
    event ApprovalGranted(uint256 requestId, address indexed signer);
    
    /// @notice Checks if an account has a certain role.
    /// @param role The role to check for, passed as a string.
    /// @param account The address to check for the given role.
    /// @return True if the account has the role, otherwise false.
    function hasPortfoliumRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}
