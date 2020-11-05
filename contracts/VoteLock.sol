// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "./interfaces/IVoteLock.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// todo: TBD if we want to add something like `depositAndLock` to avoid making 2 transactions to lock some BOND
contract VoteLock is IVoteLock {
    using SafeMath for uint256;

    uint256 constant TOTAL_VESTING_BOND = 2_200_000e18;
    uint256 constant VESTING_BOND_PER_EPOCH = 22_000e18;
    uint256 constant VESTING_PERIOD = 100;
    uint256 constant VESTING_START = 1603065600;
    uint256 constant VESTING_EPOCH_DURATION = 604800;
    uint256 constant TOTAL_BOND = 10_000_000e18;

    struct Stake {
        uint256 timestamp;
        uint256 amount;
        uint256 expiryTimestamp;
    }

    IERC20 bond;

    address communityVault;
    address treasury;
    uint256 otherBondLocked;

    mapping(address => Stake[]) balances;

    constructor(address _bond, address _cv, address _treasury) {
        bond = IERC20(_bond);
        communityVault = _cv;
        treasury = _treasury;
        otherBondLocked = 500_000e18;
    }

    // deposit allows a user to add more bond to his staked balance
    function deposit(uint256 amount) override public {
        require(amount > 0, "Amount must be greater than 0");

        uint256 allowance = bond.allowance(msg.sender, address(this));
        require(allowance >= amount, "Token allowance too small");

        Stake[] storage checkpoints = balances[msg.sender];
        uint256 numCheckpoints = checkpoints.length;

        if (numCheckpoints == 0) {
            // there's no checkpoint for the user
            checkpoints.push(Stake(block.timestamp, amount, block.timestamp));
        } else {
            // the user already has a stake checkpoint; use that as base for the new checkpoint
            Stake storage oldStake = balances[msg.sender][numCheckpoints - 1];

            if (oldStake.timestamp == block.timestamp) {
                oldStake.amount = oldStake.amount.add(amount);
            } else {
                checkpoints.push(Stake(block.timestamp, oldStake.amount.add(amount), oldStake.expiryTimestamp));
            }
        }

        bond.transferFrom(msg.sender, address(this), amount);
    }

    // withdraw allows a user to withdraw funds if the balance is not locked
    function withdraw(uint256 amount) override public {
        require(amount > 0, "Amount must be greater than 0");

        uint256 balance = balanceOf(msg.sender);
        require(balance >= amount, "Insufficient balance");

        // todo: don't let the user withdraw if balance is locked

        Stake[] storage checkpoints = balances[msg.sender];
        uint256 numCheckpoints = checkpoints.length;

        Stake storage oldStake = balances[msg.sender][numCheckpoints - 1];
        uint256 newBalance = oldStake.amount.sub(amount);

        // if the user already has a checkpoint for the current block, update that one;
        // otherwise create a new checkpoint
        if (oldStake.timestamp == block.timestamp) {
            oldStake.amount = newBalance;
        } else {
            checkpoints.push(Stake(block.timestamp, newBalance, oldStake.expiryTimestamp));
        }

        bond.transfer(msg.sender, amount);
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
        Stake[] storage checkpoints = balances[user];

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
        return balanceAtTs(user, timestamp);
    }

    // totalVotingPowerAtTs returns the total voting power at a point in time (equivalent to totalSupply)
    function totalVotingPowerAtTs(uint256 timestamp) override public view returns (uint256) {
        return 0;
    }

    // bondCirculatingSupply returns the current circulating supply of BOND
    function bondCirculatingSupply() override public view returns (uint256) {
        uint256 completedVestingEpochs = (block.timestamp - VESTING_START) / VESTING_EPOCH_DURATION;
        if (completedVestingEpochs > VESTING_PERIOD) {
            completedVestingEpochs = VESTING_PERIOD;
        }

        uint256 totalVested = TOTAL_VESTING_BOND.sub(VESTING_BOND_PER_EPOCH * completedVestingEpochs);
        uint256 lockedCommunityVault = bond.balanceOf(communityVault);
        uint256 lockedTreasury = bond.balanceOf(treasury);

        return TOTAL_BOND.sub(totalVested).sub(lockedCommunityVault).sub(lockedTreasury).sub(otherBondLocked);
    }

    function balanceOf(address user) public view returns (uint256) {
        return balanceAtTs(user, block.timestamp);
    }
}
