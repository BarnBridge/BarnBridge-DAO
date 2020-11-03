// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { BigNumber, Contract, ContractFactory, Signer } from 'ethers';
import * as helpers from './helpers';
import { expect } from 'chai';
import { VoteLock } from '../typechain';

describe('VoteLock', function () {
    const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));

    let dao:Contract, lock: VoteLock, bond: Contract;
    let user: Signer, userAddress:string;
    let snapshotId:any;

    beforeEach(async function () {
        snapshotId = await ethers.provider.send('evm_snapshot', []);

        const lockFacet = await helpers.deployVoteLock();
        const loupeFacet = await helpers.deployLoupe();

        dao = await helpers.deployDiamond('BarnBridgeDAO', [lockFacet, loupeFacet]);
        lock = await helpers.daoAsVoteLock(dao);

        const accounts = await ethers.getSigners();
        user = accounts[0];
        userAddress = await user.getAddress();

        const ERC20Mock:ContractFactory = await ethers.getContractFactory('ERC20Mock');
        bond = await ERC20Mock.deploy();
        await bond.deployed();

        await lock.init(bond.address);
    });

    afterEach(async function () {
        await ethers.provider.send('evm_revert', [snapshotId]);
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0);
        });

        it('should have init function', async function () {
            await expect(lock.init(bond.address)).to.not.be.reverted;
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
            await prepareBond(amount);
            await lock.connect(user).deposit(amount);

            expect(await lock.balanceOf(userAddress)).to.equal(amount);
        });
    });

    describe('balanceAtTs', function () {
        it('returns 0 if no checkpoint', async function () {
            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, block.timestamp)).to.be.equal(0);
        });

        it('returns 0 if timestamp older than first checkpoint', async function () {
            await prepareBond(amount);
            await lock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, block.timestamp-1)).to.be.equal(0);
        });

        it('return correct balance if timestamp newer than latest checkpoint', async function () {
            await prepareBond(amount);
            await lock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();

            expect(await lock.balanceAtTs(userAddress, block.timestamp - -1)).to.be.equal(amount);
        });

        it('returns correct balance if timestamp between checkpoints', async function () {
            await prepareBond(amount);
            await lock.connect(user).deposit(amount);

            const block = await helpers.getLatestBlock();
            const ts = parseInt(block.timestamp);

            await helpers.moveAtTimestamp(ts+30);
            await lock.connect(user).deposit(amount);

            expect(await lock.balanceAtTs(userAddress, ts+15)).to.be.equal(amount);

            await helpers.moveAtTimestamp(ts+60);
            await lock.connect(user).deposit(amount);

            expect(await lock.balanceAtTs(userAddress, ts+45)).to.be.equal(amount.mul(2));
        });
    });

    describe('withdraw', async function () {
        it('reverts if called with 0', async function () {
            await expect(lock.connect(user).withdraw(0)).to.be.revertedWith('Amount must be greater than 0');
        });

        it('reverts if user does not have enough balance', async function () {
            await expect(lock.connect(user).withdraw(amount)).to.be.revertedWith('Insufficient balance');
        });
    });

    async function prepareBond (balance:BigNumber) {
        await bond.mint(userAddress, balance);
        await bond.connect(user).approve(lock.address, balance);
    }
});
