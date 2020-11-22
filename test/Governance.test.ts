// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import {Signer, ethers as ejs, BigNumber} from 'ethers';
import * as helpers from './helpers';
import { expect } from 'chai';
import { Governance, BarnMock  } from '../typechain';
import {Constants} from "../typechain/Constants";

describe('Governance', function () {

    let governance: Governance, barn: BarnMock;
    let user: Signer, userAddress: string;
    let governor: Signer;
    let voter1: Signer, voter2: Signer, voter3: Signer;
    let snapshotId: any;
    enum ProposalState {
        WarmUp,
        ReadyForActivation,
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
        barn = await helpers.deployBarn();
        governance = await helpers.deployGovernance();
        await governance.initialize(barn.address, await governor.getAddress());
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(governance.address).to.not.equal(0);
        });
    });

    describe('propose', function () {
        it('create new proposal revert reasons', async function () {
            await barn.setBondCirculatingSupply(amount);
            const targets = [helpers.ZERO_ADDRESS];
            const targetsMismatch = [helpers.ZERO_ADDRESS, helpers.ZERO_ADDRESS];
            const values = ['0'];
            const valuesMismatch = ['0', '0'];
            const signatures = ['getBalanceOf(address)'];
            const signaturesMismatch = ['getBalanceOf(address)', 'getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS])];
            const callDatasMismatch = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS]),
                ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS])];
            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('User must own at least 1%');
            await barn.setVotingPower(userAddress, amount.div(10));
            await expect(governance.connect(user)
                .propose(targetsMismatch, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(governance.connect(user)
                .propose(targets, valuesMismatch, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(governance.connect(user)
                .propose(targets, values, signaturesMismatch, callDatas, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatasMismatch, 'description', 'title'))
                .to.be.revertedWith('Proposal function information arity mismatch');
            await expect(governance.connect(user)
                .propose([], [], [], [], 'description', 'title'))
                .to.be.revertedWith('Must provide actions');
            await expect(governance.connect(user)
                .propose(fillArray(targets, 12), fillArray(values, 12), fillArray(signatures, 12),
                    fillArray(callDatas, 12), 'description', 'title'))
                .to.be.revertedWith('Too many actions on a vote');
            // expect(await voteProposal.lastProposalId()).to.be.equal(1);
        });
        it('create new proposal', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(10));

            const targets = [helpers.ZERO_ADDRESS];
            const values = ['0'];
            const signatures = ['getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);
            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('One live proposal per proposer, found an already warmup proposal');
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const block = await helpers.getLatestBlock();
            const ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('One live proposal per proposer, found an already ReadyForActivation proposal');
            await governance.startVote(1);
            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('One live proposal per proposer, found an already active proposal');
        });

        it('start vote && quorum', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(10));
            const targets = [helpers.ZERO_ADDRESS];
            const values = ['0'];
            const signatures = ['getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const block = await helpers.getLatestBlock();
            const ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.ReadyForActivation);
            const tx = await (await governance.startVote(1)).wait();
            // get block timestamp
            const blockObject = await ethers.provider.getBlock(tx.blockNumber);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);
            const proposal = await governance.proposals(1);
            expect(proposal.startTime).to.be.equal(blockObject.timestamp);
            expect(proposal.quorum).to.be.equal(amount.mul(10).div(100));

            // expect(await governance.proposals(1)).to.be.equal(1);

        });

        it('cast, cancel and change vote', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(10));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(10));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(10));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(10));
            const targets = [helpers.ZERO_ADDRESS];
            const values = ['0'];
            const signatures = ['getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const block = await helpers.getLatestBlock();
            const ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.ReadyForActivation);
            await governance.startVote(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);
            await governance.connect(user)
                .castVote(1, true);
            let proposal = await governance.proposals(1);
            expect(proposal.forVotes).to.be.equal(amount.div(10));
            expect(proposal.againstVotes).to.be.equal(0);
            await governance.connect(user).cancelVote(1);
            proposal = await governance.proposals(1);
            expect(proposal.forVotes).to.be.equal(0);
            await governance.connect(user).castVote(1, false);
            proposal = await governance.proposals(1);
            expect(proposal.againstVotes).to.be.equal(amount.div(10));
            await expect(governance.connect(user).castVote(1, false)).to.be.revertedWith('Already voted this option');
            await governance.connect(user).castVote(1, true);
            proposal = await governance.proposals(1);
            expect(proposal.forVotes).to.be.equal(amount.div(10));
            expect(proposal.againstVotes).to.be.equal(0);
        });

        it('cannot vote when vote is closed', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [helpers.ZERO_ADDRESS];
            const values = ['0'];
            const signatures = ['getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.ZERO_ADDRESS])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            let block = await helpers.getLatestBlock();
            let ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD + ACTIVE_PERIOD);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await governance.startVote(1);
            await governance.connect(voter1)
                .castVote(1, true);
            block = await helpers.getLatestBlock();
            ts = parseInt(block.timestamp);
            await governance.connect(voter2)
                .castVote(1, false);
            await governance.connect(user)
                .castVote(1, true);
            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            await expect(governance.connect(voter2).castVote(1, true)).to.be.revertedWith('Voting is closed');
        });

        it('verify proposal state', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [barn.address];
            const values = [0];
            const signatures = ['withdraw(uint256)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['uint256'], [1])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            const GRACE_PERIOD = (await governance.GRACE_PERIOD()).toNumber();
            let block = await helpers.getLatestBlock();
            let ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.ReadyForActivation);
            await governance.startVote(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);
            await governance.connect(voter1)
                .castVote(1, true);
            block = await helpers.getLatestBlock();
            ts = parseInt(block.timestamp);

            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await helpers.moveAtTimestamp(ts);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);
            await governance.connect(voter2)
                .castVote(1, false);
            await governance.connect(user)
                .castVote(1, true);
            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await expect(governance.connect(voter2).castVote(1, true)).to.be.revertedWith('Voting is closed');
            await helpers.moveAtTimestamp(ts);
            await governance.connect(voter2).castVote(1, true);
            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);

            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);
            const proposal = await governance.proposals(1);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() - 1000);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Grace);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + GRACE_PERIOD + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Expired);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await barn.withdrawHasBeenCalled()).to.be.true;

        });

        it('cannot execute proposals that are not queued', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [barn.address];
            const values = [0];
            const signatures = ['withdraw(uint256)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['uint256'], [1])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);
            await expect(governance.execute(1)).to.be.revertedWith('Proposal can only be executed if it is queued');
        });



        it('cannot cancel expired, failed or executed proposals', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [barn.address];
            const values = [0];
            const signatures = ['withdraw(uint256)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['uint256'], [1])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            const GRACE_PERIOD = (await governance.GRACE_PERIOD()).toNumber();
            let block = await helpers.getLatestBlock();
            let ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await governance.startVote(1);
            await governance.connect(voter1)
                .castVote(1, true);
            block = await helpers.getLatestBlock();
            ts = parseInt(block.timestamp);

            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await expect(governance.connect(governor).cancel(1)).to.be.revertedWith('Cannot cancel failed proposal');
            await helpers.moveAtTimestamp(ts);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);
            await governance.connect(voter2)
                .castVote(1, false);
            await governance.connect(user)
                .castVote(1, true);
            await governance.connect(voter2).castVote(1, true);
            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);

            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);
            const proposal = await governance.proposals(1);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() - 1000);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Grace);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + GRACE_PERIOD + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Expired);
            await expect(governance.connect(governor).cancel(1)).to.be.revertedWith('Cannot cancel expired proposal');
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await barn.withdrawHasBeenCalled()).to.be.true;
            await expect(governance.connect(governor).cancel(1)).to.be.revertedWith('Cannot cancel executed proposal');
        });


        it('change governor', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [governance.address];
            const values = [0];
            const signatures = ['anoint(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [await voter1.getAddress()])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            // expect(await governance.lastProposalId()).to.be.equal(1);
            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            let block = await helpers.getLatestBlock();
            let ts = parseInt(block.timestamp);
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await governance.startVote(1);
            await governance.connect(voter1)
                .castVote(1, true);
            block = await helpers.getLatestBlock();
            ts = parseInt(block.timestamp);
            await governance.connect(user)
                .castVote(1, true);
            await governance.connect(voter2).castVote(1, true);
            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);

            await governance.queue(1);
            const proposal = await governance.proposals(1);
            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Grace);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await governance.guardian()).to.be.equal(await voter1.getAddress());
        });

        it('guardian cancel proposal', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [governance.address];
            const values = [0];
            const signatures = ['anoint(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [await voter1.getAddress()])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');

            await governance.connect(governor).cancel(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);
        });

        it('proposer cancel proposal', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(5));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
            const targets = [governance.address];
            const values = [0];
            const signatures = ['anoint(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [await voter1.getAddress()])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');

            await governance.connect(user).cancel(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);
        });


        it('abdicate', async function () {
            await expect(governance.connect(user).abdicate()).to.be.revertedWith('Must be gov guardian');
            await governance.connect(governor).abdicate();
            expect (await governance.guardian()).to.be.equal(helpers.ZERO_ADDRESS);

        });


    });

    async function setupSigners () {
        const accounts = await ethers.getSigners();
        user = accounts[0];
        governor = accounts[1];
        voter1 = accounts[10];
        voter2 = accounts[11];
        voter3 = accounts[12];
        userAddress = await user.getAddress();
    }
    function fillArray (arr: Array<string>, len: number) {
        while (arr.length * 2 <= len) arr = arr.concat(arr);
        if (arr.length < len) arr = arr.concat(arr.slice(0, len - arr.length));
        return arr;
    }
});
