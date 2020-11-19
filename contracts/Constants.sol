// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

abstract contract Constants {
    uint public constant WARM_UP = 2 days;
    uint public constant ACTIVE = 2 days;
    uint public constant QUEUE = 2 days;
    uint public constant GRACE_PERIOD = 2 days;
    uint public constant MINIMUM_FOR_VOTES_THRESHOLD = 60;

}
