// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./interfaces/IBarn.sol";
import "./Bridge.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Governance is Bridge {
    using SafeMath for uint256;

    enum ProposalState {
        WarmUp,
        ReadyForActivation,
        Active,
        Canceled,
        Failed,
        Accepted,
        Queued,
        Grace,
        Expired,
        Executed
    }

    struct Receipt {
        // Whether or not a vote has been cast
        bool hasVoted;
        // The number of votes the voter had, which were cast
        uint256 votes;
        // support
        bool support;
    }

    struct Proposal {
        // proposal identifiers
        // unique id
        uint256 id;
        // Creator of the proposal
        address proposer;
        // proposal description
        string description;
        string title;

        // proposal technical details
        // ordered list of target addresses to be made
        address[] targets;
        // The ordered list of values (i.e. msg.value) to be passed to the calls to be made
        uint[] values;
        // The ordered list of function signatures to be called
        string[] signatures;
        // The ordered list of calldata to be passed to each call
        bytes[] calldatas;

        // proposal creation time - 1
        uint256 createTime;
        // proposal actual vote start time
        uint256 startTime;

        // votes status
        // Minimum amount of vBond votes for this proposal to be considered
        uint256 quorum;
        // The timestamp that the proposal will be available for execution, set once the vote succeeds
        uint256 eta;
        // Current number of votes in favor of this proposal
        uint256 forVotes;
        // Current number of votes in opposition to this proposal
        uint256 againstVotes;

        bool canceled;
        bool executed;

        // Receipts of ballots for the entire set of voters
        mapping(address => Receipt) receipts;
    }

    uint256 public lastProposalId;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public latestProposalIds;
    IBarn barn;
    bool isInitialized;
    bool isActive;

    event ProposalCreated(uint256 indexed proposalId);
    event VotingStarted(uint256 indexed proposalId);
    event Vote(uint256 indexed proposalId, address indexed user, bool support, uint256 power);
    event VoteCanceled(uint256 indexed proposalId, address indexed user);
    event ProposalQueued(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // executed only once.
    function initialize(address barnAddr) public {
        require(isInitialized == false, 'Contract already initialized.');
        barn = IBarn(barnAddr);
        isInitialized = true;
    }

    function propose(
        address[] memory targets,
        uint[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description,
        string memory title
    )
    public returns (uint256)
    {
        if (!isActive) {
            require(barn.bondStaked() >= ACTIVATION_THRESHOLD, "DAO not yet active");
            isActive = true;
        }

        require(
            barn.votingPowerAtTs(msg.sender, block.timestamp - 1) >= getCreationThreshold(),
            "User must own at least 1%"
        );
        require(
            targets.length == values.length && targets.length == signatures.length && targets.length == calldatas.length,
            "Proposal function information arity mismatch"
        );
        require(targets.length != 0, "Must provide actions");
        require(targets.length <= PROPOSAL_MAX_ACTIONS, "Too many actions on a vote");

        // check if user has another running vote
        uint256 previousProposalId = latestProposalIds[msg.sender];
        if (previousProposalId != 0) {
            ProposalState s = state(previousProposalId);
            require(
                s == ProposalState.Executed || s == ProposalState.Canceled || s == ProposalState.Expired,
                "one live proposal per proposer"
            );
        }

        uint256 newProposalId = lastProposalId + 1;
        Proposal storage newProposal = proposals[newProposalId];
        newProposal.id = newProposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.title = title;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.signatures = signatures;
        newProposal.calldatas = calldatas;
        newProposal.createTime = block.timestamp - 1;

        lastProposalId = newProposalId;
        latestProposalIds[msg.sender] = newProposalId;

        emit ProposalCreated(newProposalId);

        return newProposalId;
    }

    function queue(uint256 proposalId) public {
        require(state(proposalId) == ProposalState.Accepted, "Proposal can only be queued if it is succeeded");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.canceled == false, "Cannot queue a canceled proposal");

        uint256 eta = proposal.startTime + activeDuration + queueDuration;
        proposal.eta = eta;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            require(!queuedTransactions[_getTxHash(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta)], "proposal action already queued at eta");
            queueTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta);
        }

        emit ProposalQueued(proposalId);
    }

    function execute(uint256 proposalId) public payable {
        require(_canBeExecuted(proposalId), "Cannot be executed");

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            executeTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }

        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) public {
        ProposalState state = state(proposalId);

        require(state != ProposalState.Executed, "Cannot cancel executed proposal");
        require(state != ProposalState.Failed, "Cannot cancel failed proposal");
        require(state != ProposalState.Expired, "Cannot cancel expired proposal");

        require(_canCancelProposal(proposalId), "Only the proposal creator can cancel a proposal");
        Proposal storage proposal = proposals[proposalId];
        proposal.canceled = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            cancelTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }

        emit ProposalCanceled(proposalId);
    }

    function castVote(uint256 proposalId, bool support) public {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");

        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];

        // exit if user already voted
        require(receipt.hasVoted == false || receipt.hasVoted && receipt.support != support, "Already voted this option");

        uint256 votes = barn.votingPowerAtTs(msg.sender, proposal.startTime);

        // means it changed its vote
        if (receipt.hasVoted) {
            if (receipt.support) {
                proposal.forVotes = proposal.forVotes.sub(receipt.votes);
            } else {
                proposal.againstVotes = proposal.againstVotes.sub(receipt.votes);
            }
        }

        if (support) {
            proposal.forVotes = proposal.forVotes.add(votes);
        } else {
            proposal.againstVotes = proposal.againstVotes.add(votes);
        }

        receipt.hasVoted = true;
        receipt.votes = votes;
        receipt.support = support;

        emit Vote(proposalId, msg.sender, support, votes);
    }

    function cancelVote(uint256 proposalId) public {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");

        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];

        uint256 votes = barn.votingPowerAtTs(msg.sender, proposal.startTime);

        require(receipt.hasVoted, "Cannot cancel if not voted yet");

        if (receipt.support) {
            proposal.forVotes = proposal.forVotes.sub(votes);
        } else {
            proposal.againstVotes = proposal.againstVotes.sub(votes);
        }

        receipt.hasVoted = false;
        receipt.votes = 0;
        receipt.support = false;

        emit VoteCanceled(proposalId, msg.sender);
    }

    // views
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(0 < proposalId && proposalId <= lastProposalId, "invalid proposal id");

        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.timestamp <= proposal.createTime + warmUpDuration) {
            return ProposalState.WarmUp;
        }

        if (block.timestamp <= proposal.createTime + warmUpDuration + activeDuration) {
            return ProposalState.Active;
        }

        if (block.timestamp <= proposal.startTime + activeDuration) {
            return ProposalState.Active;
        }

        if ((proposal.forVotes + proposal.againstVotes) < proposal.quorum ||
            (proposal.forVotes <= _getMinForVotes(proposal))) {
            return ProposalState.Failed;
        }

        if (proposal.eta == 0) {
            return ProposalState.Accepted;
        }

        if (block.timestamp < proposal.eta) {
            return ProposalState.Queued;
        }

        if (block.timestamp <= proposal.eta + gracePeriodDuration) {
            return ProposalState.Grace;
        }

        return ProposalState.Expired;
    }

    function getReceipt(uint256 proposalId, address voter) public view returns (Receipt memory) {
        return proposals[proposalId].receipts[voter];
    }

    function getActions(uint256 proposalId) public view returns (
        address[] memory targets,
        uint[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas
    ) {
        Proposal storage p = proposals[proposalId];
        return (p.targets, p.values, p.signatures, p.calldatas);
    }

    // internal

    function _canCancelProposal(uint256 proposalId) internal view returns (bool){
        Proposal storage proposal = proposals[proposalId];

        if (msg.sender == proposal.proposer ||
            barn.votingPower(proposal.proposer) < getCreationThreshold()
        ) {
            return true;
        }

        return false;
    }

    function _canBeExecuted(uint256 proposalId) internal view returns (bool) {
        return state(proposalId) == ProposalState.Grace;
    }

    function _getMinForVotes(Proposal storage proposal) internal view returns (uint256) {
        return (proposal.forVotes + proposal.againstVotes).mul(acceptanceThreshold).div(100);
    }

    function getCreationThreshold() internal view returns (uint256) {
        return barn.bondStaked().div(100);
    }
}
