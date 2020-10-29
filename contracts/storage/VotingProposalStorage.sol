// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

contract VotingProposalStorage {

    bytes32 constant VOTING_PROPOSAL_STORAGE = keccak256("diamond.standard.voting.proposal.storage");
    uint constant WARMUP = 1000;
    uint constant ACTIVE = 2000;


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
        /// @notice Whether or not a vote has been cast
        bool hasVoted;

        /// @notice The number of votes the voter had, which were cast
        uint96 votes;
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

        // @notice Minimum amount of vBond votes for this proposal to be considered
        uint quorum;

        /// @notice Current number of votes in favor of this proposal
        uint forVotes;

        /// @notice Current number of votes in opposition to this proposal
        uint againstVotes;


        // canceled by owner or Guardian
        /// @notice Flag marking whether the proposal has been canceled
        bool canceled;
        /// @notice Receipts of ballots for the entire set of voters
        mapping (address => Receipt) receipts;
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
