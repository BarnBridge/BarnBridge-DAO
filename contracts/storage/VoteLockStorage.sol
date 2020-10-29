// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract VoteLockStorage {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("com.barnbridge.dao.votelock");

    struct VoteLockStorage {
        mapping(address => uint256) balances;

        mapping(bytes4 => bool) supportedInterfaces;
    }

    function voteLockStorage() internal pure returns(VoteLockStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly { ds.slot := position }
    }
}
