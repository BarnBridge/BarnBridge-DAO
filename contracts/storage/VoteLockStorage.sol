// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract VoteLockStorage {
    bytes32 constant VOTELOCK_STORAGE_POSITION = keccak256("com.barnbridge.dao.votelock");

    struct VoteLockStorage {
        mapping(address => uint256) balances;
    }

    function voteLockStorage() internal pure returns(VoteLockStorage storage ds) {
        bytes32 position = VOTELOCK_STORAGE_POSITION;
        assembly { ds.slot := position }
    }
}
