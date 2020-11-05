// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./interfaces/IVoteLock.sol";
import "./interfaces/ITimeLock.sol";

contract VotingProposal {

    uint constant WARM_UP = 2 days;
    uint constant ACTIVE = 2 days;
    uint constant QUEUE = 2 days;
    uint constant GRACE_PERIOD = 2 days;


    enum ProposalState {
        WarmUp,
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
        uint votes;

        // support
        bool support;
    }

    struct Proposal {

        // proposal identifiers
        // unique id
        uint id;
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

        // proposal proposal creation time - 1
        uint createTime;
        // proposal actual vote start time
        uint startTime;

        // votes status

        // Minimum amount of vBond votes for this proposal to be considered
        uint quorum;

        // The timestamp that the proposal will be available for execution, set once the vote succeeds
        uint eta;

        // Current number of votes in favor of this proposal
        uint forVotes;

        // Current number of votes in opposition to this proposal
        uint againstVotes;


        // canceled by owner or Guardian
        // Flag marking whether the proposal has been canceled
        bool canceled;
        // flag for proposal was executed
        bool executed;
        // Receipts of ballots for the entire set of voters
        mapping (address => Receipt) receipts;
    }

    uint public lastProposalId;
    mapping (uint => Proposal) public proposals;
    mapping (address => uint) public latestProposalIds;
    IVoteLock voteLock;
    ITimeLock timeLock;

    constructor (address vl, address tl) {
        voteLock = IVoteLock(vl);
        timeLock = ITimeLock(tl);
    }

    function proposalMaxOperations() public pure returns (uint) { return 10; } // 10 actions

    function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description, string memory title) public returns (uint) {

        // requires for the user
        // check voting power
        require(voteLock.votingPowerAtTs(msg.sender, block.timestamp - 1) >= voteLock.bondCirculatingSupply() / 100, "User must own at least 1%");
        require(targets.length == values.length && targets.length == signatures.length && targets.length == calldatas.length, "Proposal function information arity mismatch");
        require(targets.length != 0, "Must provide actions");
        require(targets.length <= proposalMaxOperations(), "Too many actions on a vote");


        // get storage

        // check if user has another running vote
        uint latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposersLatestProposalState = state(latestProposalId);
            require(proposersLatestProposalState != ProposalState.Active, "One live proposal per proposer, found an already active proposal");
            require(proposersLatestProposalState != ProposalState.WarmUp, "One live proposal per proposer, found an already warmup proposal");
        }

        uint newProposalId = lastProposalId + 1;
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

        // lock user tokens
        voteLock.lockCreatorBalance(msg.sender, WARM_UP + ACTIVE);

        // emit here

        // @TODO Emit

        // return result
        return lastProposalId;
    }

    function queue(uint proposalId) public {
        require(state(proposalId) == ProposalState.Accepted, "Proposal can only be queued if it is succeeded");
        Proposal storage proposal = proposals[proposalId];
        require (proposal.canceled == false, "Cannot queue a canceled proposal");

        uint eta = proposal.startTime + ACTIVE + QUEUE;

        for (uint i = 0; i < proposal.targets.length; i++) {
            _queueOrRevert(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta);
        }
        proposal.eta = eta;
        // @TODO Emit
    }

    function _queueOrRevert(address target, uint value, string memory signature, bytes memory data, uint eta) internal {
        require(!timeLock.queuedTransactions(keccak256(abi.encode(target, value, signature, data, eta))), "proposal action already queued at eta");
        timeLock.queueTransaction(target, value, signature, data, eta);
    }

    function execute(uint proposalId) public payable {
        require(state(proposalId) == ProposalState.Queued, "Proposal can only be executed if it is queued");
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        for (uint i = 0; i < proposal.targets.length; i++) {
            timeLock.executeTransaction{value: proposal.values[i]}(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }
        // @TODO Emit
    }

    function cancel(uint proposalId) public {
        ProposalState state = state(proposalId);
        require(state != ProposalState.Executed, "Cannot cancel executed proposal");
        require(state != ProposalState.Expired, "Cannot cancel expired proposal");

        Proposal storage proposal = proposals[proposalId];
        require (proposal.proposer == msg.sender, "Only the proposal creator can cancel a proposal");
        proposal.canceled = true;
        for (uint i = 0; i < proposal.targets.length; i++) {
            timeLock.cancelTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }
        // @TODO Emit
    }



    function state(uint proposalId) public view returns (ProposalState) {
        require(lastProposalId >= proposalId && proposalId > 0, "invalid proposal id");
        Proposal storage proposal = proposals[proposalId];
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.startTime == 0) {
            return ProposalState.WarmUp;
        } else if (block.timestamp - 1 < proposal.startTime + ACTIVE) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < proposal.quorum) {
            return ProposalState.Failed;
        } else if (proposal.eta == 0) {
            return ProposalState.Accepted;
        } else if (block.timestamp - 1 < proposal.eta) {
            return ProposalState.Queued;
        } else if (block.timestamp - 1 >= proposal.eta && block.timestamp - 1 <= proposal.eta + GRACE_PERIOD && proposal.executed == false) {
            return ProposalState.Grace;
        } else if (block.timestamp - 1 >= proposal.eta && block.timestamp - 1 <= proposal.eta + GRACE_PERIOD && proposal.executed == true) {
            return ProposalState.Executed;
        } else {
            return ProposalState.Expired;
        }
    }

    function castVote(uint proposalId, bool support) public {
        return _castVote(msg.sender, proposalId, support);
    }

    function cancelVote(uint proposalId) public {
        return _cancelVote(msg.sender, proposalId);
    }

    // internal

    function _castVote(address voter, uint proposalId, bool support) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        // exit if user already voted
        require(receipt.hasVoted && receipt.support != support, "Already voted this option");

        uint votes = voteLock.votingPowerAtTs(voter, proposal.startTime);

        // reset votes if user changed his vote
        if (receipt.hasVoted) {
            _cancelVote(voter, proposalId);
        }

        if (support) {
            proposal.forVotes = add256(proposal.forVotes, votes);
        } else {
            proposal.againstVotes = add256(proposal.againstVotes, votes);
        }

        receipt.hasVoted = true;
        receipt.votes = votes;
        receipt.support = support;
        // @TODO Emit
    }

    function _cancelVote(address voter, uint proposalId) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        uint votes = voteLock.votingPowerAtTs(voter, proposal.startTime);

        // exit if user already voted
        require(receipt.hasVoted, "Cannot cancel if not voted yet");
        if (receipt.support) {
            proposal.forVotes = sub256(proposal.forVotes, votes);
        } else {
            proposal.againstVotes = sub256(proposal.againstVotes, votes);
        }
        receipt.hasVoted = false;
        receipt.votes = 0;
        receipt.support = false;
    }


    // pure functions

    function add256(uint256 a, uint256 b) internal pure returns (uint) {
        uint c = a + b;
        require(c >= a, "addition overflow");
        return c;
    }

    function sub256(uint256 a, uint256 b) internal pure returns (uint) {
        require(b <= a, "subtraction underflow");
        return a - b;
    }

}
