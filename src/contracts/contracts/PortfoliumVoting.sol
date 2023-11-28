// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IGuard.sol";
import "./PortfoliumRoles.sol";

contract PortfoliumVoting is PortfoliumRoles {
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
    }

    IGuard private _guard;
    IERC20 private _token;
    mapping(uint256 => mapping(address => bool)) private _voters;

    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 amount,
        bool inFavor
    );

    constructor(address guard, address tokenAddress) {
        _guard = IGuard(guard);
        _token = IERC20(tokenAddress);
    }

    modifier onlyAdmin() {
        require(
            _guard.hasPortfoliumRole(ADMIN_ROLE, msg.sender),
            "PortfoliumVoting: caller must be an admin"
        );
        _;
    }

    function createProposal(
        string memory description,
        uint256 duration
    ) public onlyAdmin {
        uint256 proposalId = proposals.length;
        uint256 deadline = block.timestamp + duration;
        proposals.push(
            Proposal({
                description: description,
                votesFor: 0,
                votesAgainst: 0,
                deadline: deadline
            })
        );
        emit ProposalCreated(proposalId, description);
    }

    function vote(uint256 proposalId, uint256 amount, bool inFavor) public {
        require(
            proposalId < proposals.length,
            "PortfoliumVoting: proposal does not exist"
        );
        Proposal storage proposal = proposals[proposalId];
        require(
            block.timestamp <= proposal.deadline,
            "PortfoliumVoting: voting has ended"
        );
        require(
            !_voters[proposalId][msg.sender],
            "PortfoliumVoting: already voted"
        );
        require(
            _token.balanceOf(msg.sender) >= amount,
            "PortfoliumVoting: not enough tokens"
        );

        _voters[proposalId][msg.sender] = true;
        if (inFavor) {
            proposal.votesFor += amount;
        } else {
            proposal.votesAgainst += amount;
        }

        emit Voted(proposalId, msg.sender, amount, inFavor);
    }

    function getProposalVoteCount(
        uint256 proposalId
    ) public view returns (uint256, uint256) {
        require(
            proposalId < proposals.length,
            "PortfoliumVoting: proposal does not exist"
        );
        Proposal storage proposal = proposals[proposalId];
        return (proposal.votesFor, proposal.votesAgainst);
    }
}
