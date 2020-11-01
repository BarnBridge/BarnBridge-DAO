// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "../storage/VotingProposalStorage.sol";
import "../interfaces/ITimeLock.sol";
import "../interfaces/IVoteLock.sol";

contract VotingProposalFacet is VotingProposalStorageContract {

    function proposalMaxOperations() public pure returns (uint) { return 10; } // 10 actions

    function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description, string memory title) public returns (uint) {

        // requires for the user
        // check voting power
        IVoteLock voteLock = IVoteLock(address(this));
        require(voteLock.votingPowerAtTs(msg.sender, block.timestamp - 1) >= voteLock.bondCirculatingSupply() / 100, "User must own at least 1%");
        require(targets.length == values.length && targets.length == signatures.length && targets.length == calldatas.length, "Proposal function information arity mismatch");
        require(targets.length != 0, "Must provide actions");
        require(targets.length <= proposalMaxOperations(), "Too many actions on a vote");


        // get storage
        VotingProposalStorage storage vs = votingProposalStorage();

        // check if user has another running vote
        uint latestProposalId = vs.latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposersLatestProposalState = state(latestProposalId);
            require(proposersLatestProposalState != ProposalState.Active, "One live proposal per proposer, found an already active proposal");
            require(proposersLatestProposalState != ProposalState.WarmUp, "One live proposal per proposer, found an already warmup proposal");
        }

        uint newProposalId = vs.lastProposalId + 1;
        Proposal storage newProposal = vs.proposals[newProposalId];
        newProposal.id = newProposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.title = title;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.signatures = signatures;
        newProposal.calldatas = calldatas;
        newProposal.createTime = block.timestamp - 1;

        vs.lastProposalId = newProposalId;
        vs.latestProposalIds[msg.sender] = newProposalId;

        // lock user tokens
        voteLock.lockCreatorBalance(msg.sender, WARM_UP + ACTIVE);

        // emit here

        // return result
        return vs.lastProposalId;
    }

    function queue(uint proposalId) public {
        require(state(proposalId) == ProposalState.Accepted, "Proposal can only be queued if it is succeeded");
        VotingProposalStorage storage vs = votingProposalStorage();
        Proposal storage proposal = vs.proposals[proposalId];

        uint eta = proposal.startTime + ACTIVE + QUEUE;

        for (uint i = 0; i < proposal.targets.length; i++) {
            _queueOrRevert(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta);
        }
        proposal.eta = eta;
    }

    function _queueOrRevert(address target, uint value, string memory signature, bytes memory data, uint eta) internal {
        require(!ITimeLock(address(this)).queuedTransactions(keccak256(abi.encode(target, value, signature, data, eta))), "proposal action already queued at eta");
        ITimeLock(address(this)).queueTransaction(target, value, signature, data, eta);
    }

    function execute(uint proposalId) public payable {
        require(state(proposalId) == ProposalState.Queued, "Proposal can only be executed if it is queued");
        VotingProposalStorage storage vs = votingProposalStorage();
        Proposal storage proposal = vs.proposals[proposalId];
        proposal.executed = true;
        for (uint i = 0; i < proposal.targets.length; i++) {
            ITimeLock(address(this)).executeTransaction{value: proposal.values[i]}(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }
    }

    function cancel(uint proposalId) public {
        ProposalState state = state(proposalId);
        require(state != ProposalState.Executed, "GovernorAlpha::cancel: cannot cancel executed proposal");
        VotingProposalStorage storage vs = votingProposalStorage();

        Proposal storage proposal = vs.proposals[proposalId];

        proposal.canceled = true;
        for (uint i = 0; i < proposal.targets.length; i++) {
            ITimeLock(address(this)).cancelTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
        }

//        emit ProposalCanceled(proposalId);
    }



    function state(uint proposalId) public view returns (ProposalState) {
        VotingProposalStorage storage vs = votingProposalStorage();
        require(vs.lastProposalId >= proposalId && proposalId > 0, "invalid proposal id");
        Proposal storage proposal = vs.proposals[proposalId];
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

    function lastProposalId() public view returns (uint) {
        VotingProposalStorage storage vs = votingProposalStorage();
        return vs.lastProposalId;
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
        VotingProposalStorage storage vs = votingProposalStorage();
        IVoteLock voteLock = IVoteLock(address(this));
        Proposal storage proposal = vs.proposals[proposalId];
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
        // emit
    }

    function _cancelVote(address voter, uint proposalId) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        VotingProposalStorage storage vs = votingProposalStorage();
        Proposal storage proposal = vs.proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        IVoteLock voteLock = IVoteLock(address(this));
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
