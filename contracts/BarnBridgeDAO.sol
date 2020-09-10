// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/utils/Address.sol";

contract BarnBridgeDAO {
    event Proposal(

    );

    function newProposal(
        address _proposal,
        uint _votingBlocksDuration,
        uint _challengeBlocksDuration
    )
        public
    {
        require(Address.isContract(_proposal), "BarnBridgeDAO: Proposal needs to be a contract.");

        emit Proposal();
    }
}
