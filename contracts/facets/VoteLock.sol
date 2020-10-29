// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IVoteLock.sol";
import "../storage/VoteLockStorage.sol";

contract VoteLock is IVoteLock, VoteLockStorage {
    // todo: TBD if we want to add something like `depositAndLock` to avoid making 2 transactions to lock some BOND

    // deposit allows a user to add more bond to his staked balance
    function deposit(uint256 amount) override public {

    }

    // withdraw allows a user to withdraw funds if the balance is not locked
    function withdraw(uint256 amount) override public {

    }

    // lock a user's currently staked balance until timestamp & add the bonus to his voting power
    function lock(uint256 timestamp) override public {

    }

    // delegate allows a user to delegate his voting power to another user
    function delegate(address to) override public {

    }

    // stopDelegate allows a user to take back the delegated voting power
    function stopDelegate() override public {

    }

    // lock the balance of a proposal creator until the voting ends; only callable by DAO
    function lockCreatorBalance(address user, uint256 timestamp) override public {

    }

    // balanceAtTs returns the amount of BOND that the user currently staked (bonus NOT included)
    function balanceAtTs(address user, uint256 timestamp) override public view returns (uint256) {
        return 0;
    }

    // votingPowerAtTs returns the voting power (bonus included) + delegated voting power for a user at a point in time
    function votingPowerAtTs(address user, uint256 timestamp) override public view returns (uint256) {
        return 0;
    }

    // totalVotingPowerAtTs returns the total voting power at a point in time (equivalent to totalSupply)
    function totalVotingPowerAtTs(uint256 timestamp) override public view returns (uint256) {
        return 0;
    }

    // bondCirculatingSupply returns the current circulating supply of BOND
    function bondCirculatingSupply() override public view returns (uint256) {
        return 0;
    }

    function balanceOf(address user) public returns (uint256){
        VoteLockStorage storage ds = voteLockStorage();

        return ds.balances[user];
    }
}
