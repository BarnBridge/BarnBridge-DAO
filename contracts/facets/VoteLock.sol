// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "../interfaces/IVoteLock.sol";
import "../storage/VoteLockStorage.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// todo: TBD if we want to add something like `depositAndLock` to avoid making 2 transactions to lock some BOND
contract VoteLock is IVoteLock, VoteLockStorageContract {
    using SafeMath for uint256;

    function init(address bond) public {
        VoteLockStorage storage ds = voteLockStorage();

        ds.bond = IERC20(bond);
    }

    // deposit allows a user to add more bond to his staked balance
    function deposit(uint256 amount) override public {
        require(amount > 0, "Amount must be greater than 0");

        VoteLockStorage storage ds = voteLockStorage();

        uint256 allowance = ds.bond.allowance(msg.sender, address(this));
        require(allowance >= amount, "Token allowance too small");

        Stake[] storage checkpoints = ds.balances[msg.sender];
        uint256 numCheckpoints = checkpoints.length;

        if (numCheckpoints == 0) {
            // there's no checkpoint for the user
            checkpoints.push(Stake(block.timestamp, amount, block.timestamp));
        } else {
            // the user already has a stake checkpoint; use that as base for the new checkpoint
            Stake storage oldStake = ds.balances[msg.sender][numCheckpoints - 1];

            if (oldStake.timestamp == block.timestamp) {
                oldStake.amount = oldStake.amount.add(amount);
            } else {
                checkpoints.push(Stake(block.timestamp, oldStake.amount.add(amount), oldStake.expiryTimestamp));
            }
        }
    }

    // withdraw allows a user to withdraw funds if the balance is not locked
    function withdraw(uint256 amount) override public {
        require(amount > 0, "Amount must be greater than 0");

        uint256 balance = balanceOf(msg.sender);
        require(balance >= amount, "Insufficient balance");
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
        VoteLockStorage storage s = voteLockStorage();

        Stake[] storage checkpoints = s.balances[msg.sender];

        if (checkpoints.length == 0 || timestamp < checkpoints[0].timestamp) {
            return 0;
        }

        uint256 min = 0;
        uint256 max = checkpoints.length - 1;

        if (timestamp >= checkpoints[max].timestamp) {
            return checkpoints[max].amount;
        }

        // binary search of the value in the array
        while (max > min) {
            uint mid = (max + min + 1) / 2;
            if (checkpoints[mid].timestamp <= timestamp) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }

        return checkpoints[min].amount;
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

    function balanceOf(address user) public view returns (uint256) {
        return balanceAtTs(user, block.timestamp);
    }
}
