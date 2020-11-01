// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

contract VotingProposalStorageContract {

    bytes32 constant VOTING_PROPOSAL_STORAGE = keccak256("diamond.standard.voting.proposal.storage");
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
    struct VotingProposalStorage {
        uint lastProposalId;
        mapping (uint => Proposal) proposals;
        mapping (address => uint) latestProposalIds;
    }

    function votingProposalStorage() internal pure returns(VotingProposalStorage storage vs) {
        bytes32 position = VOTING_PROPOSAL_STORAGE;
        assembly { vs.slot := position }
    }
}
