import { ethers } from 'hardhat';
import { BigNumber, ethers as ejs, Signer } from 'ethers';
import * as helpers from './helpers';
import { moveAtTimestamp } from './helpers';
import { expect } from 'chai';
import { BarnMock, Governance } from '../typechain';

describe('Governance', function () {

    let governance: Governance, barn: BarnMock;
    let user: Signer, userAddress: string;
    let voter1: Signer, voter2: Signer, voter3: Signer;
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
    before(async function () {
        await setupSigners();
        barn = await helpers.deployBarn();
        governance = await helpers.deployGovernance();
        await governance.initialize(barn.address);
    });

    beforeEach(async function () {
        snapshotId = await ethers.provider.send('evm_snapshot', []);
    });

    afterEach(async function () {
        await ethers.provider.send('evm_revert', [snapshotId]);
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(governance.address).to.not.equal(0);
        });
    });

    describe('activate', function () {
        it('reverts if threshold not yet met', async function () {
            await expect(governance.activate()).to.be.revertedWith('Threshold not met yet');
        });

        it('activates if threshold is met', async function () {
            await barn.setBondStaked(BigNumber.from(400000).mul(helpers.tenPow18));
            await expect(governance.activate()).to.not.be.reverted;
            expect(await governance.isActive()).to.be.true;
        });

        it('reverts if already activated', async function () {
            await barn.setBondStaked(BigNumber.from(400000).mul(helpers.tenPow18));
            await governance.activate();

            await expect(governance.activate()).to.be.revertedWith('DAO already active');
        });
    });

    describe('propose', function () {
        before(async function () {
            await barn.setBondStaked(BigNumber.from(400000).mul(helpers.tenPow18));
            await governance.activate();
            await barn.setBondStaked(0);
        });

        it('create new proposal revert reasons', async function () {
            await barn.setBondStaked(amount);

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
        });

        it('create new proposal', async function () {
            await barn.setBondStaked(amount);
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
                .to.be.revertedWith('One live proposal per proposer');

            const warmUpDuration = (await governance.warmUpDuration()).toNumber();
            const ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + warmUpDuration);
            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('One live proposal per proposer');

            await expect(governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title'))
                .to.be.revertedWith('One live proposal per proposer');
        });

        it('start vote && quorum', async function () {
            await barn.setBondStaked(amount);
            await barn.setVotingPower(userAddress, amount.div(10));

            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);

            const warmUpDuration = (await governance.warmUpDuration()).toNumber();
            const ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + warmUpDuration);

            expect(await governance.state(1)).to.be.equal(ProposalState.Active);
            expect(await governance.getProposalQuorum(1)).to.be.equal(amount.mul(40).div(100));
        });

        it('cast, cancel and change vote', async function () {
            await barn.setBondStaked(amount);
            await barn.setVotingPower(userAddress, amount.div(10));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(10));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(10));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(10));

            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);

            const WARM_UP_PERIOD = (await governance.warmUpDuration()).toNumber();

            const ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(user).castVote(1, true);
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
            await setupEnv();
            await createTestProposal();

            const WARM_UP_PERIOD = (await governance.warmUpDuration()).toNumber();
            const ACTIVE_PERIOD = (await governance.activeDuration()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();
            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);

            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            await expect(governance.connect(voter2).castVote(1, true)).to.be.revertedWith('Voting is closed');
        });

        it('verify proposal state', async function () {
            await setupEnv();
            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);

            const WARM_UP_PERIOD = (await governance.warmUpDuration()).toNumber();
            const ACTIVE_PERIOD = (await governance.activeDuration()).toNumber();
            const gracePeriodDuration = (await governance.gracePeriodDuration()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);

            await helpers.moveAtTimestamp(ts);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);

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

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + gracePeriodDuration + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Expired);

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await barn.withdrawHasBeenCalled()).to.be.true;
        });

        it('cannot execute proposals that are not queued', async function () {
            await setupEnv();
            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);
            await expect(governance.execute(1)).to.be.revertedWith('Cannot be executed');
        });

        it('test proposal execution in queued mode', async function () {
            await setupEnv();
            await createTestProposal();

            const warmUpDuration = (await governance.warmUpDuration()).toNumber();
            const activeDuration = (await governance.activeDuration()).toNumber();
            const queueDuration = (await governance.queueDuration()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + warmUpDuration);
            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();

            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);
            await governance.connect(voter2).castVote(1, true);

            await helpers.moveAtTimestamp(ts + activeDuration);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);

            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);
            await expect(governance.execute(1)).to.be.revertedWith('Cannot be executed');

            ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + queueDuration + 1);
            await governance.connect(user).execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
        });

        it('cannot cancel expired, failed or executed proposals', async function () {
            await setupEnv();
            await createTestProposal();

            const warmUpDuration = (await governance.warmUpDuration()).toNumber();
            const activeDuration = (await governance.activeDuration()).toNumber();
            const gracePeriodDuration = (await governance.gracePeriodDuration()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + warmUpDuration);

            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + activeDuration);

            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await expect(governance.connect(user).cancelProposal(1))
                .to.be.revertedWith('Cannot cancel failed proposal');

            await helpers.moveAtTimestamp(ts);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);
            await governance.connect(voter2).castVote(1, true);

            await helpers.moveAtTimestamp(ts + activeDuration);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);

            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);

            const proposal = await governance.proposals(1);

            await helpers.moveAtTimestamp((proposal.eta).toNumber() - 1000);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Grace);

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + gracePeriodDuration + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Expired);
            await expect(governance.connect(user).cancelProposal(1))
                .to.be.revertedWith('Cannot cancel expired proposal');

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await barn.withdrawHasBeenCalled()).to.be.true;
            await expect(governance.connect(user).cancelProposal(1))
                .to.be.revertedWith('Cannot cancel executed proposal');
        });

        it('fail for invalid quorum', async function () {
            await barn.setBondStaked(amount);
            await barn.setVotingPower(userAddress, amount.div(2));

            const targets = [governance.address];
            const signatures = ['setMinQuorum(uint256)'];
            const values = [0];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['uint256'], [101])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'Change Quorum', 'Quorum');

            const WARM_UP_PERIOD = (await governance.warmUpDuration()).toNumber();
            const ACTIVE = (await governance.activeDuration()).toNumber();

            await moveAtTimestamp(await helpers.getCurrentBlockchainTimestamp() + WARM_UP_PERIOD + 1);
            await governance.connect(user).castVote(1, true);

            let voteProposal = await governance.proposals(1);

            await moveAtTimestamp(voteProposal.createTime.toNumber() + WARM_UP_PERIOD + ACTIVE + 1);
            await governance.queue(1);

            voteProposal = await governance.proposals(1);
            await moveAtTimestamp(voteProposal.eta.toNumber() + 1);
            await expect(governance.execute(1)).to.be.revertedWith('Maximum is 100.');
        });

        it('fail for invalid minimum threshold', async function () {
            await barn.setBondStaked(amount);
            await barn.setVotingPower(userAddress, amount.div(2));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(2));

            const targets = [governance.address];
            const signatures = ['setAcceptanceThreshold(uint256)'];
            const values = [0];
            const callDatasBig = [ejs.utils.defaultAbiCoder.encode(['uint256'], [101])];
            const callDatasLow = [ejs.utils.defaultAbiCoder.encode(['uint256'], [49])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatasBig, 'Change Threshold Big', 'Threshold');
            await governance.connect(voter1)
                .propose(targets, values, signatures, callDatasLow, 'Change Threshold Low', 'Threshold');

            const WARM_UP_PERIOD = (await governance.warmUpDuration()).toNumber();

            await moveAtTimestamp(await helpers.getCurrentBlockchainTimestamp() + WARM_UP_PERIOD + 1);
            await governance.connect(user).castVote(1, true);
            await governance.connect(user).castVote(2, true);

            let voteProposalBig = await governance.proposals(1);

            let ACTIVE = (await governance.activeDuration()).toNumber();
            await moveAtTimestamp(voteProposalBig.createTime.toNumber() + WARM_UP_PERIOD + ACTIVE + 1);
            await governance.queue(1);

            voteProposalBig = await governance.proposals(1);
            await moveAtTimestamp(voteProposalBig.eta.toNumber() + 1);
            await expect(governance.execute(1)).to.be.revertedWith('Maximum is 100.');

            let voteProposalLow = await governance.proposals(2);
            ACTIVE = (await governance.activeDuration()).toNumber();
            await moveAtTimestamp(voteProposalLow.createTime.toNumber() + WARM_UP_PERIOD + ACTIVE + 1);
            await governance.queue(2);

            voteProposalLow = await governance.proposals(2);
            await moveAtTimestamp(voteProposalLow.eta.toNumber() + 1);
            await expect(governance.execute(2)).to.be.revertedWith('Minimum is 50.');
        });

        it('test change periods', async function () {
            await expect(governance.setActiveDuration(1)).to.be.revertedWith('Only DAO can call');
            await barn.setBondStaked(amount);
            await barn.setVotingPower(userAddress, amount.div(2));
            const targets = [
                governance.address,
                governance.address,
                governance.address,
                governance.address,
                governance.address,
                governance.address,
            ];
            const values = [0, 0, 0, 0, 0, 0];
            const signatures = ['setWarmUpDuration(uint256)',
                'setActiveDuration(uint256)',
                'setQueueDuration(uint256)',
                'setGracePeriodDuration(uint256)',
                'setAcceptanceThreshold(uint256)',
                'setMinQuorum(uint256)',
            ];

            const period = (await governance.gracePeriodDuration()).toNumber() / 2;
            const callDatas = [
                ejs.utils.defaultAbiCoder.encode(['uint256'], [period]),
                ejs.utils.defaultAbiCoder.encode(['uint256'], [period]),
                ejs.utils.defaultAbiCoder.encode(['uint256'], [period]),
                ejs.utils.defaultAbiCoder.encode(['uint256'], [period]),
                ejs.utils.defaultAbiCoder.encode(['uint256'], [51]),
                ejs.utils.defaultAbiCoder.encode(['uint256'], [51]),
            ];

            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'Change Periods', 'Periods');

            const WARM_UP_PERIOD = (await governance.warmUpDuration()).toNumber();
            const ACTIVE = (await governance.activeDuration()).toNumber();
            const ts = await helpers.getCurrentBlockchainTimestamp();

            await moveAtTimestamp(ts + WARM_UP_PERIOD + 1);

            let proposal = await governance.proposals(1);
            await governance.connect(user).castVote(1, true);

            await moveAtTimestamp(proposal.createTime.toNumber() + WARM_UP_PERIOD + ACTIVE + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);
            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);

            proposal = await governance.proposals(1);
            await moveAtTimestamp(proposal.eta.toNumber() + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Grace);

            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await governance.warmUpDuration()).to.be.equal(period);
            expect(await governance.activeDuration()).to.be.equal(period);
            expect(await governance.queueDuration()).to.be.equal(period);
            expect(await governance.gracePeriodDuration()).to.be.equal(period);
            expect(await governance.acceptanceThreshold()).to.be.equal(51);
            expect(await governance.minQuorum()).to.be.equal(51);
        });

        it('proposer cancel proposal', async function () {
            await setupEnv();
            await createTestProposal();

            await governance.connect(user).cancelProposal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);
        });
    });

    async function setupEnv () {
        await barn.setBondStaked(amount);
        await barn.setVotingPower(userAddress, amount.div(5));
        await barn.setVotingPower(await voter1.getAddress(), amount.div(20));
        await barn.setVotingPower(await voter2.getAddress(), amount.div(5));
        await barn.setVotingPower(await voter3.getAddress(), amount.div(5));
    }

    async function createTestProposal () {
        const targets = [barn.address];
        const values = [0];
        const signatures = ['withdraw(uint256)'];
        const callDatas = [ejs.utils.defaultAbiCoder.encode(['uint256'], [1])];
        await governance.connect(user)
            .propose(targets, values, signatures, callDatas, 'description', 'title');
    }

    async function setupSigners () {
        const accounts = await ethers.getSigners();
        user = accounts[0];
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
