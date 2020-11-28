// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

import "./TimePeriod.sol";

contract Bridge is TimePeriod {

    mapping(bytes32 => bool) public queuedTransactions;

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) internal returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));

        queuedTransactions[txHash] = true;
        return txHash;
    }

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) internal {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        queuedTransactions[txHash] = false;
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) internal returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(getBlockTimestamp() >= eta, "executeTransaction: Transaction hasn't surpassed time lock.");
        require(getBlockTimestamp() <= eta + GRACE_PERIOD, "executeTransaction: Transaction is stale.");

        queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }
        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call{value : value}(callData);
        require(success, string(returnData));

        //        emit ExecuteTransaction(txHash, target, value, signature, data, eta);

        return returnData;
    }

    function getBlockTimestamp() internal view returns (uint) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }

}
