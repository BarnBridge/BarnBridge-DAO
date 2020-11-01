// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "../storage/VotingProposalStorage.sol";
import "../interfaces/ITimeLock.sol";

contract VotingProposalFacet is VotingProposalStorageContract {


    function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description, string memory title) public returns (uint) {

        // requires for the user


        // get storage
        VotingProposalStorage storage vs = votingProposalStorage();
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
}
