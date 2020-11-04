// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import * as helpers from './helpers';
import { expect } from 'chai';
import { Erc20Mock, VoteLock } from '../typechain';

describe('VoteLock', function () {
    const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));

    let lock: VoteLock, bond: Erc20Mock;
    let user: Signer, userAddress: string;
    let communityVault: Signer, treasury: Signer;
    let snapshotId: any;

    beforeEach(async function () {
        snapshotId = await ethers.provider.send('evm_snapshot', []);

        await setupSigners();
        bond = await helpers.deployBond();

        lock = await helpers.deployVoteLock(
            bond.address,
            await communityVault.getAddress(),
            await treasury.getAddress()
        );
    });

    afterEach(async function () {
        await ethers.provider.send('evm_revert', [snapshotId]);
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(lock.address).to.not.equal(0);
        });
    });

    describe('deposit', function () {
        it('reverts if called with 0', async function () {
            await expect(lock.connect(user).deposit(0)).to.be.revertedWith('Amount must be greater than 0');
        });

        it('reverts if user did not approve token', async function () {
            await expect(lock.connect(user).deposit(amount)).to.be.revertedWith('Token allowance too small');
        });

        it('stores the user balance in storage', async function () {
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);

            expect(await lock.balanceOf(userAddress)).to.equal(amount);
        });

        it('transfers the user balance to itself', async function () {
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);

            expect(await bond.transferFromCalled()).to.be.true;
            expect(await bond.balanceOf(lock.address)).to.be.equal(amount);
        });
    });

    describe('balanceAtTs', function () {
        it('returns 0 if no checkpoint', async function () {
            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, block.timestamp)).to.be.equal(0);
        });

        it('returns 0 if timestamp older than first checkpoint', async function () {
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, block.timestamp - 1)).to.be.equal(0);
        });

        it('return correct balance if timestamp newer than latest checkpoint', async function () {
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, block.timestamp - -1)).to.be.equal(amount);
        });

        it('returns correct balance if timestamp between checkpoints', async function () {
            await prepareAccount(user, amount.mul(3));
            await lock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();
            const ts = parseInt(block.timestamp);

            await helpers.moveAtTimestamp(ts + 30);
            await lock.connect(user).deposit(amount);

            expect(await lock.balanceAtTs(userAddress, ts + 15)).to.be.equal(amount);

            await helpers.moveAtTimestamp(ts + 60);
            await lock.connect(user).deposit(amount);

            expect(await lock.balanceAtTs(userAddress, ts + 45)).to.be.equal(amount.mul(2));
        });
    });

    describe('withdraw', async function () {
        it('reverts if called with 0', async function () {
            await expect(lock.connect(user).withdraw(0)).to.be.revertedWith('Amount must be greater than 0');
        });

        it('reverts if user does not have enough balance', async function () {
            await expect(lock.connect(user).withdraw(amount)).to.be.revertedWith('Insufficient balance');
        });

        it('sets user balance to 0', async function () {
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);

            expect(await lock.connect(user).withdraw(amount)).to.not.throw;
            expect(await lock.balanceOf(userAddress)).to.be.equal(0);
        });

        it('does not affect old checkpoints', async function () {
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);

            const currentTs = parseInt((await helpers.getLatestBlock()).timestamp);
            await helpers.moveAtTimestamp(currentTs + 15);

            await lock.connect(user).withdraw(amount);

            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, parseInt(block.timestamp) - 1)).to.be.equal(amount);
        });

        it('transfers balance to the user', async function () {
            await prepareAccount(user, amount.mul(2));
            await lock.connect(user).deposit(amount.mul(2));

            expect(await bond.balanceOf(lock.address)).to.be.equal(amount.mul(2));

            await lock.connect(user).withdraw(amount);

            expect(await bond.transferCalled()).to.be.true;
            expect(await bond.balanceOf(userAddress)).to.be.equal(amount);
            expect(await bond.balanceOf(lock.address)).to.be.equal(amount);
        });
    });

    describe('bondCirculatingSupply', async function () {
        it('returns current circulating supply of BOND', async function () {
            await setupContracts();

            const completedEpochs = (await helpers.getCurrentEpoch()) - 1;
            const expectedValue = BigNumber.from(22000 * completedEpochs).mul(helpers.tenPow18);

            expect(await lock.bondCirculatingSupply()).to.be.equal(expectedValue);
        });
    });

    async function setupSigners () {
        const accounts = await ethers.getSigners();
        user = accounts[0];
        communityVault = accounts[1];
        treasury = accounts[2];
        userAddress = await user.getAddress();
    }

    async function setupContracts () {
        const cvValue = BigNumber.from(2800000).mul(helpers.tenPow18);
        const treasuryValue = BigNumber.from(4500000).mul(helpers.tenPow18);

        await bond.mint(await communityVault.getAddress(), cvValue);
        await bond.mint(await treasury.getAddress(), treasuryValue);
    }

    async function prepareAccount (account: Signer, balance: BigNumber) {
        await bond.mint(await account.getAddress(), balance);
        await bond.connect(account).approve(lock.address, balance);
    }
});
