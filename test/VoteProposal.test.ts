// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import {Signer, ethers as ejs, BigNumber} from 'ethers';
import * as helpers from './helpers';
import * as _const from './const';
import { expect } from 'chai';
import { Erc20Mock, VoteLock, Timelock, VoteProposal } from '../typechain';

describe('VoteProposal', function () {

    let voteProposal: VoteProposal, timelock: Timelock, lock: VoteLock, bond: Erc20Mock;
    let user: Signer, userAddress: string;
    let communityVault: Signer, treasury: Signer;
    let snapshotId: any;
    enum ProposalState {
        WarmUp,
        Active,
        Canceled,
        Failed,
        Accepted,
        Queued,
        Grace,
        Expired,
        Executed
    }
    const amount = BigNumber.from(28000).mul(BigNumber.from(10).pow(18));
    beforeEach(async function () {
        snapshotId = await ethers.provider.send('evm_snapshot', []);

        await setupSigners();
        bond = await helpers.deployBond();

        lock = await helpers.deployVoteLock(
            bond.address,
            await communityVault.getAddress(),
            await treasury.getAddress()
        );
        timelock = await helpers.deployTimelock();
        voteProposal = await helpers.deployVoteProposal(lock.address, timelock.address);
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(voteProposal.address).to.not.equal(0);
            expect(timelock.address).to.not.equal(0);
        });
    });

    describe('propose', function () {
        it('create new proposal revert reasons', async function () {
            const targets = [helpers.zeroAddress()];
            const targets10plus = [helpers.zeroAddress()];
            const targetsMismatch = [helpers.zeroAddress(), helpers.zeroAddress()];
            const values = ['0'];
            const valuesMismatch = ['0', '0'];
            const signatures = ['getBalanceOf(address)'];
            const signaturesMismatch = ['getBalanceOf(address)', 'getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.zeroAddress()])];
            const callDatasMismatch = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.zeroAddress()]),
                ejs.utils.defaultAbiCoder.encode(['address'], [helpers.zeroAddress()])];
            await expect(voteProposal.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('User must own at least 1%');
            await setupContracts();
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);
            await expect(voteProposal.connect(user)
                .propose(targetsMismatch, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(voteProposal.connect(user)
                .propose(targets, valuesMismatch, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(voteProposal.connect(user)
                .propose(targets, values, signaturesMismatch, callDatas, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(voteProposal.connect(user)
                .propose(targets, values, signatures, callDatasMismatch, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(voteProposal.connect(user)
                .propose([], [], [], [], 'description', 'title'))
                .to.be.revertedWith('Must provide actions');
            await expect(voteProposal.connect(user)
                .propose(fillArray(targets, 12), fillArray(values, 12), fillArray(signatures, 12),
                    fillArray(callDatas, 12), 'description', 'title'))
                .to.be.revertedWith('Too many actions on a vote');
            // expect(await voteProposal.lastProposalId()).to.be.equal(1);
        });
        it('create new proposal', async function () {
            const targets = [helpers.zeroAddress()];
            const values = ['0'];
            const signatures = ['getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.zeroAddress()])];
            await setupContracts();
            await prepareAccount(user, amount);
            await lock.connect(user).deposit(amount);
            await voteProposal.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await voteProposal.lastProposalId()).to.be.equal(1);
            expect(await voteProposal.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await voteProposal.state(1)).to.be.equal(ProposalState.WarmUp);
            await expect(voteProposal.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('One live proposal per proposer, found an already warmup proposal');
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

    function fillArray (arr: Array<any>, len: number) {
        while (arr.length * 2 <= len) arr = arr.concat(arr);
        if (arr.length < len) arr = arr.concat(arr.slice(0, len - arr.length));
        return arr;
    }
});
