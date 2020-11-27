// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

abstract contract TimePeriod {
    uint public WARM_UP = 2 days;
    uint public ACTIVE = 2 days;
    uint public QUEUE = 2 days;
    uint public GRACE_PERIOD = 2 days;
    uint public MINIMUM_FOR_VOTES_THRESHOLD = 60;
    uint public MINIMUM_QUORUM = 30;

    //  modifier

    modifier onlyDAO () {
        require(msg.sender == address(this), 'Only DAO can call');
        _;
    }

    function setWarmUpPeriod (uint period) public onlyDAO {
        WARM_UP = period;
    }

    function setActivePeriod (uint period) public onlyDAO {
        ACTIVE = period;
    }

    function setQueuePeriod (uint period) public onlyDAO {
        QUEUE = period;
    }

    function setGracePeriod (uint period) public onlyDAO {
        GRACE_PERIOD = period;
    }

}
