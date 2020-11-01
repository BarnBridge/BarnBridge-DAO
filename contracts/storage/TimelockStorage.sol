// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

contract TimelockStorageContract {

    bytes32 constant TIMELOCK_STORAGE = keccak256("diamond.standard.timelock.storage");




  struct TimelockStorage {
      mapping (bytes32 => bool) queuedTransactions;
  }

    function timelockStorage() internal pure returns(TimelockStorage storage ts) {
        bytes32 position = TIMELOCK_STORAGE;
        assembly { ts.slot := position }
    }
}
