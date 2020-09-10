// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.12;

import "../IProposal.sol";

contract ProposalMock is IProposal {
    // constructor(
    //     string memory _name,
    //     string memory _description,
    //     s
    // ) public {}

    function name()
        public
        override(IProposal)
        pure
        returns (string memory)
    {
        return "Kill James Bond";
    }

    function description()
        public
        override(IProposal)
        pure
        returns (string memory)
    {
        return "Reward 1 BILLION DOLLARS!";
    }

    function execute()
        public
        override(IProposal)
    {

    }
}
