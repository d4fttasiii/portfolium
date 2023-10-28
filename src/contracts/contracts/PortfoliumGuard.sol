// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IGuard.sol";
import "./PortfoliumRoles.sol";

contract PortfoliumGuard is AccessControl, PortfoliumRoles, IGuard {
    struct Request {
        address account;
        bytes32 role;
        uint256 approvalCount;
        uint256 createdAt;
        bool executed;
        bool rejected;
    }

    mapping(uint256 => Request) public requests;
    mapping(uint256 => mapping(address => bool)) public approvals;
    uint256 public quorum;

    constructor(address[] memory initialSigners, uint256 initialQuorum) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        for (uint256 i = 0; i < initialSigners.length; i++) {
            _grantRole(ADMIN_ROLE, initialSigners[i]);
        }
        _grantRole(ADMIN_ROLE, msg.sender);
        quorum = initialQuorum;
    }

    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "PortfoliumGuard: caller must be an admin"
        );
        _;
    }

    modifier onlyPortfolium() {
        require(
            hasRole(PORTFOLIUM_ROLE, msg.sender),
            "PortfoliumGuard: caller must be the portfolium contract"
        );
        _;
    }

    // ---------- CHANGE MANAGEMENT ----------

    function createRequest(
        address account,
        bytes32 role
    ) external onlyAdmin returns (uint256) {
        uint256 requestId = uint256(
            keccak256(abi.encodePacked(account, role, block.timestamp))
        );
        Request storage r = requests[requestId];
        require(r.createdAt == 0, "Portfolium:  Request already exists");

        r.account = account;
        r.role = role;
        r.approvalCount = 1;
        r.createdAt = block.timestamp;
        r.executed = false;
        r.rejected = false;

        approvals[requestId][msg.sender] = true;
        emit RequestCreated(requestId, account, role);
        _tryRequestExecution(requestId);

        return requestId;
    }

    function approveRequest(uint256 requestId) external onlyAdmin {
        require(
            requests[requestId].createdAt > 0,
            "Portfolium:  Request does not exist"
        );
        require(
            !requests[requestId].rejected,
            "Portfolium:  Request already rejected"
        );
        require(
            !requests[requestId].executed,
            "Portfolium:  Request already executed"
        );
        require(
            !approvals[requestId][msg.sender],
            "Portfolium:  Approval already granted"
        );

        approvals[requestId][msg.sender] = true;
        requests[requestId].approvalCount++;

        emit ApprovalGranted(requestId, msg.sender);
        _tryRequestExecution(requestId);
    }

    function rejectRequest(uint256 requestId) external onlyAdmin {
        require(
            requests[requestId].createdAt > 0,
            "Portfolium:  Request does not exist"
        );
        require(
            !requests[requestId].executed,
            "Portfolium:  Request already executed"
        );
        require(
            !requests[requestId].rejected,
            "Portfolium:  Request already rejected"
        );

        requests[requestId].rejected = true;
        emit RequestRejected(requestId, msg.sender);
    }

    // ---------- USER ----------

    function addUser(address account) external onlyPortfolium {
        require(
            !hasRole(USER_ROLE, account),
            "Portfolium: Account is already a user!"
        );
        _grantRole(USER_ROLE, account);
        emit RoleGranted(USER_ROLE, account, msg.sender);
    }

    // ---------- GENERIC ----------

    function removeRole(address account, bytes32 role) external onlyAdmin {
        _revokeRole(role, account);
        emit RoleRevoked(role, account, msg.sender);
    }

    // ---------- GETTERS ----------

    function hasPortfoliumRole(
        bytes32 role,
        address account
    ) external view returns (bool) {
        return super.hasRole(role, account);
    }

    // ---------- HELPERS ----------

    function _tryRequestExecution(uint256 requestId) private {
        if (requests[requestId].approvalCount >= quorum) {
            _grantRole(requests[requestId].role, requests[requestId].account);
            requests[requestId].executed = true;

            emit RoleGranted(
                requests[requestId].role,
                requests[requestId].account,
                msg.sender
            );
        }
    }
}
