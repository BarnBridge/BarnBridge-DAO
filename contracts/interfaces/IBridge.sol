// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

interface IBridge {
    function queuedTransactions(bytes32 txHash) external view returns (bool);

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external returns (bytes32);

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external;

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external payable returns (bytes memory);
}
