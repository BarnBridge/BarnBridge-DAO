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

    let warmUpDuration: number, activeDuration: number, queueDuration: number, gracePeriodDuration: number;

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

        warmUpDuration = (await governance.warmUpDuration()).toNumber();
        activeDuration = (await governance.activeDuration()).toNumber();
        queueDuration = (await governance.queueDuration()).toNumber();
        gracePeriodDuration = (await governance.gracePeriodDuration()).toNumber();
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

            const ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + warmUpDuration);
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

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + warmUpDuration);
            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();
            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);

            await helpers.moveAtTimestamp(ts + activeDuration);
            await expect(governance.connect(voter2).castVote(1, true)).to.be.revertedWith('Voting is closed');
        });

        it('verify proposal state', async function () {
            await setupEnv();
            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);

            let ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + warmUpDuration);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + activeDuration);
            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);

            await helpers.moveAtTimestamp(ts);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);

            await helpers.moveAtTimestamp(ts + activeDuration);
            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await expect(governance.connect(voter2).castVote(1, true)).to.be.revertedWith('Voting is closed');

            await helpers.moveAtTimestamp(ts);
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

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + warmUpDuration);

            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + activeDuration);

            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await expect(governance.connect(user).cancelProposal(1))
                .to.be.revertedWith('Proposal in state that does not allow cancellation');

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
                .to.be.revertedWith('Proposal in state that does not allow cancellation');

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await barn.withdrawHasBeenCalled()).to.be.true;
            await expect(governance.connect(user).cancelProposal(1))
                .to.be.revertedWith('Proposal in state that does not allow cancellation');
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

            await moveAtTimestamp(await helpers.getCurrentBlockchainTimestamp() + warmUpDuration + 1);
            await governance.connect(user).castVote(1, true);

            let voteProposal = await governance.proposals(1);

            await moveAtTimestamp(voteProposal.createTime.toNumber() + warmUpDuration + activeDuration + 1);
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

            await moveAtTimestamp(await helpers.getCurrentBlockchainTimestamp() + warmUpDuration + 1);
            await governance.connect(user).castVote(1, true);
            await governance.connect(user).castVote(2, true);

            let voteProposalBig = await governance.proposals(1);

            let activeDuration = (await governance.activeDuration()).toNumber();
            await moveAtTimestamp(voteProposalBig.createTime.toNumber() + warmUpDuration + activeDuration + 1);
            await governance.queue(1);

            voteProposalBig = await governance.proposals(1);
            await moveAtTimestamp(voteProposalBig.eta.toNumber() + 1);
            await expect(governance.execute(1)).to.be.revertedWith('Maximum is 100.');

            let voteProposalLow = await governance.proposals(2);
            activeDuration = (await governance.activeDuration()).toNumber();
            await moveAtTimestamp(voteProposalLow.createTime.toNumber() + warmUpDuration + activeDuration + 1);
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

            const ts = await helpers.getCurrentBlockchainTimestamp();

            await moveAtTimestamp(ts + warmUpDuration + 1);

            let proposal = await governance.proposals(1);
            await governance.connect(user).castVote(1, true);

            await moveAtTimestamp(proposal.createTime.toNumber() + warmUpDuration + activeDuration + 1);
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

        it('allows anyone to cancel a proposal if creator balance fell below threshold', async function () {
            await setupEnv();
            await createTestProposal();

            const ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts + warmUpDuration);

            await expect(governance.connect(voter1).cancelProposal(1))
                .to.be.revertedWith('Cancellation requirements not met');

            await barn.setVotingPower(userAddress, 0);

            await expect(governance.connect(voter1).cancelProposal(1)).to.not.be.reverted;
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);
        });
    });

    describe('cancellation proposal', function () {
        it('reverts if proposal id is not valid', async function () {
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('invalid proposal id');
        });

        it('works only if proposal is in queued state', async function () {
            await setupEnv();
            await createTestProposal();

            const creationTs = await helpers.getCurrentBlockchainTimestamp();

            expect(await governance.state(1)).to.equal(ProposalState.WarmUp);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');

            await helpers.moveAtTimestamp(creationTs + warmUpDuration + 1);

            expect(await governance.state(1)).to.equal(ProposalState.Active);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');

            await governance.connect(user).castVote(1, false);
            await governance.connect(voter1).castVote(1, true);
            await governance.connect(voter2).castVote(1, true);
            await governance.connect(voter3).castVote(1, true);

            expect(await governance.state(1)).to.equal(ProposalState.Active);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');

            await helpers.moveAtTimestamp(creationTs + warmUpDuration + activeDuration + 1);
            expect(await governance.state(1)).to.equal(ProposalState.Accepted);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');

            let snapshot = await takeSnapshot();

            await governance.queue(1);

            expect(await governance.state(1)).to.equal(ProposalState.Queued);
            await expect(governance.startCancellationProposal(1))
                .to.not.be.reverted;

            const cancellationProposalCreationTs = await helpers.getCurrentBlockchainTimestamp();
            expect((await governance.cancellationProposals(1)).createTime).to.equal(cancellationProposalCreationTs);

            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Cancellation proposal already exists');

            await revertEVM(snapshot);

            snapshot = await takeSnapshot();
            await governance.connect(user).cancelProposal(1);
            expect(await governance.state(1)).to.equal(ProposalState.Canceled);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');
            await revertEVM(snapshot);

            await governance.queue(1);

            await helpers.moveAtTimestamp(creationTs + warmUpDuration + activeDuration + queueDuration + 1);
            expect(await governance.state(1)).to.equal(ProposalState.Grace);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');

            snapshot = await takeSnapshot();
            await governance.execute(1);

            expect(await governance.state(1)).to.equal(ProposalState.Executed);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');

            await revertEVM(snapshot);

            await helpers.moveAtTimestamp(creationTs + warmUpDuration + activeDuration + queueDuration + gracePeriodDuration + 1);

            expect(await governance.state(1)).to.equal(ProposalState.Expired);
            await expect(governance.startCancellationProposal(1))
                .to.be.revertedWith('Proposal must be in queue');
        });

        async function prepareProposalForCancellation (): Promise<number> {
            await setupEnv();
            await createTestProposal();

            const creationTs = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(creationTs + warmUpDuration + 1);

            await governance.connect(user).castVote(1, false);
            await governance.connect(voter1).castVote(1, true);
            await governance.connect(voter2).castVote(1, true);
            await governance.connect(voter3).castVote(1, true);

            await helpers.moveAtTimestamp(creationTs + warmUpDuration + activeDuration + 1);
            await governance.queue(1);

            return creationTs;
        }


        it('fails if user does not voting power above threshold', async function () {
            await prepareProposalForCancellation();

            const somebody = (await ethers.getSigners())[5];
            await expect(governance.connect(somebody).startCancellationProposal(1))
                .to.be.revertedWith('User must own at least 1%');

            await barn.setVotingPower(await somebody.getAddress(), amount);

            await expect(governance.connect(somebody).startCancellationProposal(1))
                .to.not.be.reverted;
        });

        describe('voting', function () {
            it('reverts for invalid proposal id', async function () {
                await expect(governance.voteCancellationProposal(1, true))
                    .to.be.revertedWith('invalid proposal id');
            });

            it('reverts if cancellation proposal is not created', async function () {
                await setupEnv();
                await createTestProposal();

                await expect(governance.connect(voter1).voteCancellationProposal(1, true))
                    .to.be.revertedWith('Cancel Proposal not active');
            });

            it('reverts if cancellation proposal expired', async function () {
                const creationTs = await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await expect(governance.connect(voter1).voteCancellationProposal(1, true))
                    .to.not.be.reverted;

                await moveAtTimestamp(creationTs + warmUpDuration + activeDuration + queueDuration + 1);

                await expect(governance.connect(voter2).voteCancellationProposal(1, true))
                    .to.be.revertedWith('Cancel Proposal not active');
            });

            it('reverts if user tries to double vote', async function () {
                await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await expect(governance.connect(voter1).voteCancellationProposal(1, true))
                    .to.not.be.reverted;
                await expect(governance.connect(voter1).voteCancellationProposal(1, true))
                    .to.be.revertedWith('Already voted this option');
            });

            it('updates the amount of votes', async function () {
                await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await governance.connect(voter1).voteCancellationProposal(1, true);
                expect((await governance.cancellationProposals(1)).forVotes).to.equal(amount.div(20));

                await governance.connect(voter2).voteCancellationProposal(1, false);
                expect((await governance.cancellationProposals(1)).forVotes).to.equal(amount.div(20));
                expect((await governance.cancellationProposals(1)).againstVotes).to.equal(amount.div(5));
            });

            it('allows user to change vote', async function () {
                await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await governance.connect(voter1).voteCancellationProposal(1, true);
                expect((await governance.cancellationProposals(1)).forVotes).to.equal(amount.div(20));
                expect((await governance.cancellationProposals(1)).againstVotes).to.equal(0);

                await expect(governance.connect(voter1).voteCancellationProposal(1, false))
                    .to.not.be.reverted;
                expect((await governance.cancellationProposals(1)).forVotes).to.equal(0);
                expect((await governance.cancellationProposals(1)).againstVotes).to.equal(amount.div(20));
            });

            it('changes initial proposal state to cancelled if accepted', async function () {
                const createTs = await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await governance.connect(user).voteCancellationProposal(1, true);
                await governance.connect(voter1).voteCancellationProposal(1, true);
                await governance.connect(voter2).voteCancellationProposal(1, true);
                await governance.connect(voter3).voteCancellationProposal(1, true);

                expect(await governance.state(1)).to.equal(ProposalState.Queued);

                await moveAtTimestamp(createTs + warmUpDuration + activeDuration + queueDuration + 1);

                expect(await governance.state(1)).to.equal(ProposalState.Canceled);
                await expect(governance.execute(1)).to.be.revertedWith('Cannot be executed');
            });

            it('does not change initial proposal state if not accepted', async function () {
                const createTs = await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await governance.connect(voter1).voteCancellationProposal(1, true);
                await governance.connect(voter2).voteCancellationProposal(1, false);
                await governance.connect(voter3).voteCancellationProposal(1, false);

                expect(await governance.state(1)).to.equal(ProposalState.Queued);

                await moveAtTimestamp(createTs + warmUpDuration + activeDuration + queueDuration + 1);

                expect(await governance.state(1)).to.equal(ProposalState.Grace);
            });
        });

        describe('executeCancellationProposal', function () {
            it('reverts if proposal state is not canceled', async function () {
                await setupEnv();
                await createTestProposal();

                await expect(governance.executeCancellationProposal(1))
                    .to.be.revertedWith('Cannot be executed');
            });

            it('reverts if cancellation proposal failed', async function () {
                const createTs = await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await governance.connect(voter1).voteCancellationProposal(1, true);
                await governance.connect(voter2).voteCancellationProposal(1, false);
                await governance.connect(voter3).voteCancellationProposal(1, false);

                await moveAtTimestamp(createTs + warmUpDuration + activeDuration + queueDuration + 1);

                await expect(governance.executeCancellationProposal(1))
                    .to.be.revertedWith('Cannot be executed');
            });

            it('works if cancellation proposal was accepted', async function () {
                const createTs = await prepareProposalForCancellation();
                await governance.connect(user).startCancellationProposal(1);

                await governance.connect(user).voteCancellationProposal(1, true);
                await governance.connect(voter1).voteCancellationProposal(1, true);
                await governance.connect(voter2).voteCancellationProposal(1, true);
                await governance.connect(voter3).voteCancellationProposal(1, true);

                await moveAtTimestamp(createTs + warmUpDuration + activeDuration + queueDuration + 1);

                await expect(governance.executeCancellationProposal(1)).to.not.be.reverted;
                expect((await governance.proposals(1)).canceled).to.equal(true);
            });
        });
    });

    async function takeSnapshot () {
        return await ethers.provider.send('evm_snapshot', []);
    }

    async function revertEVM (snapshot: any) {
        await ethers.provider.send('evm_revert', [snapshot]);
    }

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
