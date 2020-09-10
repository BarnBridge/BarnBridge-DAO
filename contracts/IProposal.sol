// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.6.12;

interface IProposal {
    // Returns the name of the proposal. This cannot be changed in the future.
    function name() external pure returns (string memory);

    // Returns a more detailed description of the proposal. This cannot be changed in the future.
    function description() external pure returns (string memory);

    // This is executed when the proposal is passed.
    function execute() external;
}
