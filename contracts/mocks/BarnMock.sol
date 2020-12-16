// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;

import "../interfaces/IBarn.sol";

contract BarnMock {
    uint private _circulatingSupply;
    mapping(address => uint) private _votingPowerAtTs;
    bool public lockCreatorBalanceHasBeenCalled;
    bool public withdrawHasBeenCalled;

    // votingPowerAtTs returns the voting power (bonus included) + delegated voting power for a user at a point in time
    function votingPowerAtTs(address user, uint256 timestamp) external view returns (uint256){
        return _votingPowerAtTs[user];
    }

    // bondCirculatingSupply returns the current circulating supply of BOND
    function bondCirculatingSupply() external view returns (uint256) {
        return _circulatingSupply;
    }

    function setBondCirculatingSupply(uint val) public {
        _circulatingSupply = val;
    }

    function setVotingPower(address user, uint val) public {
        _votingPowerAtTs[user] = val;
    }

    function withdraw(uint256 amount) external {
        withdrawHasBeenCalled = true;
    }
}
