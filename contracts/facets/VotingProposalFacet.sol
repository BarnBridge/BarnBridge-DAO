// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

import "../storage/VotingProposalStorage.sol";

contract VotingProposalFacet is VotingProposalStorage {


    function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description, string memory title) public returns (uint) {

        // requires for the user


        // get storage
        VotingProposalStorage vs = votingProposalStorage();
        vs.lastProposalId += 1;
        Proposal memory proposal = ({
            id = vs.lastProposalId,
            proposer: msg.sender,
            description: description,
            title: title,
            targets: targets,
            values: values,
            signatures: signatures,
            calldatas: calldatas,
            creationTime: block.timestamp -1
        });

        vs.votingProposals[vs.lastProposalId] = proposal;

        return vs.lastProposalId;
    }




    function state(uint proposalId) public view returns (ProposalState) {
        VotingProposalStorage vs = votingProposalStorage();
        require(vs.lastProposalId >= proposalId && proposalId > 0, "invalid proposal id");
        Proposal storage proposal = vs.votingProposals[proposalId];
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.startTime == 0) {
            return ProposalState.WarmUp;
        } else if (block.timestamp - 1 < proposal.startTime + ACTIVE) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < proposal.quorum) {
            return ProposalState.Defeated;
        } else if (proposal.eta == 0) {
            return ProposalState.Succeeded;
        } else if (block.timestamp - 1 < proposal.eta) {
            return ProposalState.Queued;
        } else if (block.timestamp - 1 >= proposal.eta && block.timestamp - 1 <= proposal.eta + GRACE && proposal.executed == false) {
            return ProposalState.Grace;
        } else if (block.timestamp - 1 >= proposal.eta && block.timestamp - 1 <= proposal.eta + GRACE && proposal.executed == true) {
            return ProposalState.Executed;
        } else {
            return ProposalState.Expired;
        }
    }



}
