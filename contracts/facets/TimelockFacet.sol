// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

import "../storage/TimelockStorage.sol";

contract TimelockFacet is TimelockStorageContract {
    uint constant GRACE_PERIOD = 2 days;


    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        TimelockStorage storage ts = timelockStorage();

        ts.queuedTransactions[txHash] = true;
        return txHash;
    }

    function queuedTransactions (bytes32 txHash) public view returns (bool) {
        TimelockStorage storage ts = timelockStorage();
        return ts.queuedTransactions[txHash];
    }

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        TimelockStorage storage ts = timelockStorage();
        ts.queuedTransactions[txHash] = false;
    }


    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public payable returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(getBlockTimestamp() >= eta, "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        require(getBlockTimestamp() <= eta + GRACE_PERIOD, "Timelock::executeTransaction: Transaction is stale.");
        TimelockStorage storage ts = timelockStorage();

        ts.queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        require(success, "Timelock::executeTransaction: Transaction execution reverted.");

//        emit ExecuteTransaction(txHash, target, value, signature, data, eta);

        return returnData;
    }


    function getBlockTimestamp() internal view returns (uint) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }

}
