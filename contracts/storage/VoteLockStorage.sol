// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VoteLockStorageContract {
    bytes32 constant VOTELOCK_STORAGE_POSITION = keccak256("com.barnbridge.dao.votelock");

    struct Stake {
        uint256 timestamp;
        uint256 amount;
        uint256 expiryTimestamp;
    }

    struct VoteLockStorage {
        IERC20 bond;
        mapping(address => Stake[]) balances;
    }

    function voteLockStorage() internal pure returns(VoteLockStorage storage ds) {
        bytes32 position = VOTELOCK_STORAGE_POSITION;
        assembly { ds.slot := position }
    }
}
