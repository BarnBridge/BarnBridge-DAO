// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./interfaces/IBarn.sol";
import "./Bridge.sol";

contract Governance is Bridge {

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
    IBarn barn;
    address public guardian;
    bool isInitialized;


    // executed only once.
    function initialize (address barnAddr, address guardianAddress) public {
        require (isInitialized == false, 'Contract already initialized.');
        barn = IBarn(barnAddr);
        guardian = guardianAddress;
        isInitialized = true;
    }



    function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description, string memory title) public returns (uint) {

        // requires for the user
        // check voting power
        require(barn.votingPowerAtTs(msg.sender, block.timestamp - 1) >= barn.bondCirculatingSupply() / 100, "User must own at least 1%");
        require(targets.length == values.length && targets.length == signatures.length && targets.length == calldatas.length, "Proposal function information arity mismatch");
        require(targets.length != 0, "Must provide actions");
        require(targets.length <= proposalMaxOperations(), "Too many actions on a vote");

        // check if user has another running vote
        uint latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposersLatestProposalState = state(latestProposalId);
            require(proposersLatestProposalState != ProposalState.Active, "One live proposal per proposer, found an already active proposal");
            require(proposersLatestProposalState != ProposalState.ReadyForActivation, "One live proposal per proposer, found an already ReadyForActivation proposal");
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
        barn.lockCreatorBalance(msg.sender, WARM_UP);

        // emit here

        // @TODO Emit

        // return result
        return newProposalId;
    }

    function startVote (uint proposalId) public {
        _startVote(proposalId);
    }


    function castVote(uint proposalId, bool support) public {
        if (state(proposalId) == ProposalState.ReadyForActivation) {
            _startVote(proposalId);
        }
        return _castVote(msg.sender, proposalId, support);
    }

    function cancelVote(uint proposalId) public {
        return _cancelVote(msg.sender, proposalId);
    }



    function queue(uint proposalId) public {
        require(state(proposalId) == ProposalState.Accepted, "Proposal can only be queued if it is succeeded");
        Proposal storage proposal = proposals[proposalId];
        require (proposal.canceled == false, "Cannot queue a canceled proposal");

        uint eta = proposal.startTime + ACTIVE + QUEUE;

        for (uint i = 0; i < proposal.targets.length; i++) {
            require(!queuedTransactions[keccak256(abi.encode(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta))], "proposal action already queued at eta");
            queueTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta);
        }
        proposal.eta = eta;
        // @TODO Emit
    }

    function execute(uint proposalId) public payable {
        require(state(proposalId) == ProposalState.Grace, "Proposal can only be executed if it is in grace period");
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        for (uint i = 0; i < proposal.targets.length; i++) {
            executeTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }
        // @TODO Emit
    }

    function cancel(uint proposalId) public {
        ProposalState state = state(proposalId);
        require(state != ProposalState.Executed, "Cannot cancel executed proposal");
        require(state != ProposalState.Failed, "Cannot cancel failed proposal");
        require(state != ProposalState.Expired, "Cannot cancel expired proposal");

        Proposal storage proposal = proposals[proposalId];
        require (_canCancel(proposalId), "Only the proposal creator or guardian can cancel a proposal");
        proposal.canceled = true;
        for (uint i = 0; i < proposal.targets.length; i++) {
            cancelTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }
        // @TODO Emit
    }
    function abdicate () external {
        require (msg.sender == guardian, 'Must be gov guardian');
        _abdicate();
    }

    function anoint (address newGuardian) public {
        require(msg.sender == address(this), 'Only the gov contract');
        _anoint(newGuardian);
    }

    // views

    function state(uint proposalId) public view returns (ProposalState) {
        require(lastProposalId >= proposalId && proposalId > 0, "invalid proposal id");
        Proposal storage proposal = proposals[proposalId];

        // compute state by time
        if (proposal.canceled || block.timestamp > proposal.createTime + WARM_UP + ACTIVE && proposal.startTime == 0) {
            return ProposalState.Canceled;
        }
        if (block.timestamp <= proposal.createTime + WARM_UP) {
            return ProposalState.WarmUp;
        }
        if (block.timestamp > proposal.createTime + WARM_UP && proposal.startTime == 0) {
            return ProposalState.ReadyForActivation;
        }
        if (block.timestamp <= proposal.startTime + ACTIVE) {
            return ProposalState.Active;
        }

        // compute state by votes
        if (proposal.forVotes <= ((proposal.forVotes + proposal.againstVotes) * MINIMUM_FOR_VOTES_THRESHOLD) / 100 || (proposal.forVotes + proposal.againstVotes) < proposal.quorum) {
            return ProposalState.Failed;
        }
        // vote is accepted

        // vote is accepted but not sent to be executed
        if (proposal.eta == 0) {
            return ProposalState.Accepted;
        }

        // vote sent to be executed
        if (block.timestamp < proposal.eta) {
            return ProposalState.Queued;
        }
        // vote can be executed
        if (block.timestamp <= proposal.eta + GRACE_PERIOD && proposal.executed == false) {
            return ProposalState.Grace;
        }
        // vote is executed
        if (proposal.executed == true) {
            return ProposalState.Executed;
        }

        // return expired for votes not executed in grace period
        return ProposalState.Expired;

    }

    function getReceipt(uint proposalId, address voter) public view returns (Receipt memory) {
        return proposals[proposalId].receipts[voter];
    }

    function getActions(uint proposalId) public view returns (address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas) {
        Proposal storage p = proposals[proposalId];
        return (p.targets, p.values, p.signatures, p.calldatas);
    }

    // internal

    function _abdicate () internal {
        guardian = address(0);
    }

    // callable only by a proposal
    function _anoint (address newGuardian) internal {
        guardian = newGuardian;
    }

    function _startVote (uint proposalId) internal {
        require(state(proposalId) == ProposalState.ReadyForActivation, 'Proposal needs to be in RedyForActivation state');
        Proposal storage proposal = proposals[proposalId];
        proposal.startTime = block.timestamp;
        proposal.quorum = (barn.bondCirculatingSupply() * MINIMUM_QUORUM) / 100;
    }

    function _castVote(address voter, uint proposalId, bool support) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        // exit if user already voted
        require(receipt.hasVoted == false || receipt.hasVoted && receipt.support != support, "Already voted this option");

        uint votes = barn.votingPowerAtTs(voter, proposal.startTime);

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
        uint votes = barn.votingPowerAtTs(voter, proposal.startTime);

        // exit if user didn't vote
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

    function _canCancel(uint proposalId) internal view returns (bool){
        Proposal storage proposal = proposals[proposalId];

        if (msg.sender == proposal.proposer || guardian == msg.sender) {
            return true;
        }
        return false;
    }


    // pure functions
    function proposalMaxOperations() public pure returns (uint) { return 10; } // 10 actions

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
