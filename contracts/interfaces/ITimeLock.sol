// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

interface ITimeLock {

    function queuedTransactions (bytes32 txHash) public view returns (bool);
    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public returns (bytes32);
    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public;
    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public payable returns (bytes memory);
}
