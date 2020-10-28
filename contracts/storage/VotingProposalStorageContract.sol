// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract VotingProposalStorageContract {

    bytes32 constant VOTING_PROPOSAL_STORAGE = keccak256("diamond.standard.voting.proposal.storage");

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
        // proposal startTime
        uint startTime;
        ProposalState state;

        // votes status
        /// @notice Current number of votes in favor of this proposal
        uint forVotes;

        /// @notice Current number of votes in opposition to this proposal
        uint againstVotes;


        // canceled by owner or Guardian
        /// @notice Flag marking whether the proposal has been canceled
        bool canceled;

    }
    struct VotingProposalStorage {
        uint lastProposalId;
        mapping (uint => Proposal) votingProposals;
    }

    function votingProposalStorage() internal pure returns(VotingProposalStorage storage vs) {
        bytes32 position = VOTING_PROPOSAL_STORAGE;
        assembly { vs.slot := position }
    }
}
