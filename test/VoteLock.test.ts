// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import * as helpers from './helpers';
import { expect } from 'chai';
import { Erc20Mock, VoteLock } from '../typechain';
import * as time from './time';
import { tenPow18 } from './helpers';

describe('VoteLock', function () {
    const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));

    let voteLock: VoteLock, bond: Erc20Mock;
    let user: Signer, userAddress: string;
    let communityVault: Signer, treasury: Signer;
    let snapshotId: any;

    beforeEach(async function () {
        snapshotId = await ethers.provider.send('evm_snapshot', []);

        await setupSigners();
        bond = await helpers.deployBond();

        voteLock = await helpers.deployVoteLock(
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
            expect(voteLock.address).to.not.equal(0);
        });
    });

    describe('deposit', function () {
        it('reverts if called with 0', async function () {
            await expect(voteLock.connect(user).deposit(0)).to.be.revertedWith('Amount must be greater than 0');
        });

        it('reverts if user did not approve token', async function () {
            await expect(voteLock.connect(user).deposit(amount)).to.be.revertedWith('Token allowance too small');
        });

        it('stores the user balance in storage', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            expect(await voteLock.balanceOf(userAddress)).to.equal(amount);
        });

        it('transfers the user balance to itself', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            expect(await bond.transferFromCalled()).to.be.true;
            expect(await bond.balanceOf(voteLock.address)).to.be.equal(amount);
        });
    });

    describe('balanceAtTs', function () {
        it('returns 0 if no checkpoint', async function () {
            const block = await helpers.getLatestBlock();

            expect(await voteLock.balanceAtTs(userAddress, block.timestamp)).to.be.equal(0);
        });

        it('returns 0 if timestamp older than first checkpoint', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();

            expect(await voteLock.balanceAtTs(userAddress, block.timestamp - 1)).to.be.equal(0);
        });

        it('return correct balance if timestamp newer than latest checkpoint', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();

            expect(await voteLock.balanceAtTs(userAddress, block.timestamp - -1)).to.be.equal(amount);
        });

        it('returns correct balance if timestamp between checkpoints', async function () {
            await prepareAccount(user, amount.mul(3));
            await voteLock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();
            const ts = parseInt(block.timestamp);

            await helpers.moveAtTimestamp(ts + 30);
            await voteLock.connect(user).deposit(amount);

            expect(await voteLock.balanceAtTs(userAddress, ts + 15)).to.be.equal(amount);

            await helpers.moveAtTimestamp(ts + 60);
            await voteLock.connect(user).deposit(amount);

            expect(await voteLock.balanceAtTs(userAddress, ts + 45)).to.be.equal(amount.mul(2));
        });
    });

    describe('withdraw', async function () {
        it('reverts if called with 0', async function () {
            await expect(voteLock.connect(user).withdraw(0)).to.be.revertedWith('Amount must be greater than 0');
        });

        it('reverts if user does not have enough balance', async function () {
            await expect(voteLock.connect(user).withdraw(amount)).to.be.revertedWith('Insufficient balance');
        });

        it('sets user balance to 0', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            expect(await voteLock.connect(user).withdraw(amount)).to.not.throw;
            expect(await voteLock.balanceOf(userAddress)).to.be.equal(0);
        });

        it('does not affect old checkpoints', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            const currentTs = parseInt((await helpers.getLatestBlock()).timestamp);
            await helpers.moveAtTimestamp(currentTs + 15);

            await voteLock.connect(user).withdraw(amount);

            const block = await helpers.getLatestBlock();

            expect(await voteLock.balanceAtTs(userAddress, parseInt(block.timestamp) - 1)).to.be.equal(amount);
        });

        it('transfers balance to the user', async function () {
            await prepareAccount(user, amount.mul(2));
            await voteLock.connect(user).deposit(amount.mul(2));

            expect(await bond.balanceOf(voteLock.address)).to.be.equal(amount.mul(2));

            await voteLock.connect(user).withdraw(amount);

            expect(await bond.transferCalled()).to.be.true;
            expect(await bond.balanceOf(userAddress)).to.be.equal(amount);
            expect(await bond.balanceOf(voteLock.address)).to.be.equal(amount);
        });
    });

    describe('bondCirculatingSupply', async function () {
        it('returns current circulating supply of BOND', async function () {
            await setupContracts();

            const completedEpochs = (await helpers.getCurrentEpoch()) - 1;
            const expectedValue = BigNumber.from(22000 * completedEpochs).mul(helpers.tenPow18);

            expect(await voteLock.bondCirculatingSupply()).to.be.equal(expectedValue);
        });
    });

    describe('lock', async function () {
        it('reverts if timestamp is more than 1 year away', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            await expect(
                voteLock.connect(user).lock(time.futureTimestamp(5*time.year))
            ).to.be.revertedWith('timestamp too big');

            await expect(
                voteLock.connect(user).lock(time.futureTimestamp(180*time.day))
            ).to.not.be.reverted;
        });

        it('reverts if user does not have balance', async function () {
            await expect(
                voteLock.connect(user).lock(time.futureTimestamp(10*time.day))
            ).to.be.revertedWith('sender has no balance');
        });
    });

    describe('multiplierAtTs', async function () {
        it('returns expected multiplier', async function () {
            await prepareAccount(user, amount);
            await voteLock.connect(user).deposit(amount);

            let ts:number = time.getUnixTimestamp();
            await helpers.setNextBlockTimestamp(ts+5);

            const lockExpiryTs = ts + 5 + time.year;
            await voteLock.connect(user).lock(lockExpiryTs);

            ts = parseInt((await helpers.getLatestBlock()).timestamp);

            const expectedMultiplier = BigNumber.from(lockExpiryTs-ts)
                .mul(helpers.tenPow18)
                .div(time.year)
                .add(helpers.tenPow18);
            const actualMultiplier = await voteLock.multiplierAtTs(userAddress, ts);

            expect(
                actualMultiplier
            ).to.be.equal(expectedMultiplier);
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
        await bond.connect(account).approve(voteLock.address, balance);
    }
});
