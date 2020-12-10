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
            const ts = await helpers.getCurrentBlockchainTimestamp();
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

            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.ReadyForActivation);

            await governance.startVote(1);
            const startVoteTs = await helpers.getCurrentBlockchainTimestamp();

            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            const proposal = await governance.proposals(1);
            expect(proposal.startTime).to.be.equal(startVoteTs - 1);
            expect(proposal.quorum).to.be.equal(amount.mul(30).div(100));
        });

        it('cast, cancel and change vote', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(10));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(10));
            await barn.setVotingPower(await voter2.getAddress(), amount.div(10));
            await barn.setVotingPower(await voter3.getAddress(), amount.div(10));

            await createTestProposal();

            expect(await governance.lastProposalId()).to.be.equal(1);
            expect(await governance.latestProposalIds(userAddress)).to.be.equal(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.WarmUp);

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();

            const ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.ReadyForActivation);

            await governance.startVote(1);
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

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await governance.startVote(1);
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

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            const GRACE_PERIOD = (await governance.GRACE_PERIOD()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);

            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.ReadyForActivation);

            await governance.startVote(1);
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

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + GRACE_PERIOD + 1);
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

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            const QUEUE_PERIOD = (await governance.QUEUE()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);
            await governance.startVote(1);
            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();

            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);
            await governance.connect(voter2).castVote(1, true);

            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);

            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);
            await expect(governance.execute(1)).to.be.revertedWith('Cannot be executed');

            ts = await helpers.getCurrentBlockchainTimestamp();

            await helpers.moveAtTimestamp(ts+QUEUE_PERIOD+1);
            await governance.connect(user).execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
        });

        it('cannot cancel expired, failed or executed proposals', async function () {
            await setupEnv();
            await createTestProposal();

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE_PERIOD = (await governance.ACTIVE()).toNumber();
            const GRACE_PERIOD = (await governance.GRACE_PERIOD()).toNumber();

            let ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + WARM_UP_PERIOD);

            await governance.startVote(1);
            await governance.connect(voter1).castVote(1, true);

            ts = await helpers.getCurrentBlockchainTimestamp();
            await helpers.moveAtTimestamp(ts + ACTIVE_PERIOD);

            expect(await governance.state(1)).to.be.equal(ProposalState.Failed);
            await expect(governance.connect(user).cancel(1)).to.be.revertedWith('Cannot cancel failed proposal');

            await helpers.moveAtTimestamp(ts);
            expect(await governance.state(1)).to.be.equal(ProposalState.Active);

            await governance.connect(voter2).castVote(1, false);
            await governance.connect(user).castVote(1, true);
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
            await expect(governance.connect(user).cancel(1)).to.be.revertedWith('Cannot cancel expired proposal');

            await helpers.moveAtTimestamp((proposal.eta).toNumber() + 1);
            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await barn.withdrawHasBeenCalled()).to.be.true;
            await expect(governance.connect(user).cancel(1)).to.be.revertedWith('Cannot cancel executed proposal');
        });

        it('fail for invalid quorum', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(2));

            const targets = [governance.address];
            const signatures = ['setMinimumQuorum(uint256)'];
            const values = [0];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['uint256'], [101])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatas, 'Change Quorum', 'Quorum');

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ACTIVE = (await governance.ACTIVE()).toNumber();

            await moveAtTimestamp(await helpers.getCurrentBlockchainTimestamp() + WARM_UP_PERIOD + 1);
            await governance.startVote(1);
            await governance.connect(user).castVote(1, true);

            let voteProposal = await governance.proposals(1);

            await moveAtTimestamp(ACTIVE + (voteProposal.startTime).toNumber() + 1);
            await governance.queue(1);

            voteProposal = await governance.proposals(1);
            await moveAtTimestamp(voteProposal.eta.toNumber() + 1);
            await expect(governance.execute(1)).to.be.revertedWith('Maximum is 100.');
        });

        it('fail for invalid minimum threshold', async function () {
            await barn.setBondCirculatingSupply(amount);
            await barn.setVotingPower(userAddress, amount.div(2));
            await barn.setVotingPower(await voter1.getAddress(), amount.div(2));

            const targets = [governance.address];
            const signatures = ['setMinimumThreshold(uint256)'];
            const values = [0];
            const callDatasBig = [ejs.utils.defaultAbiCoder.encode(['uint256'], [101])];
            const callDatasLow = [ejs.utils.defaultAbiCoder.encode(['uint256'], [49])];
            await governance.connect(user)
                .propose(targets, values, signatures, callDatasBig, 'Change Threshold Big', 'Threshold');
            await governance.connect(voter1)
                .propose(targets, values, signatures, callDatasLow, 'Change Threshold Low', 'Threshold');

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();

            await moveAtTimestamp(await helpers.getCurrentBlockchainTimestamp() + WARM_UP_PERIOD + 1);
            await governance.startVote(1);
            await governance.startVote(2);
            await governance.connect(user).castVote(1, true);
            await governance.connect(user).castVote(2, true);

            let voteProposalBig = await governance.proposals(1);
            let ACTIVE = (await governance.ACTIVE()).toNumber();
            await moveAtTimestamp(ACTIVE + (voteProposalBig.startTime).toNumber() + 1);
            await governance.queue(1);

            voteProposalBig = await governance.proposals(1);
            await moveAtTimestamp(voteProposalBig.eta.toNumber() + 1);
            await expect(governance.execute(1)).to.be.revertedWith('Maximum is 100.');

            let voteProposalLow = await governance.proposals(2);
            ACTIVE = (await governance.ACTIVE()).toNumber();
            await moveAtTimestamp(ACTIVE + (voteProposalLow.startTime).toNumber() + 1);
            await governance.queue(2);

            voteProposalLow = await governance.proposals(2);
            await moveAtTimestamp(voteProposalLow.eta.toNumber() + 1);
            await expect(governance.execute(2)).to.be.revertedWith('Minimum is 50.');
        });

        it('test change periods', async function () {
            await expect(governance.setActivePeriod(1)).to.be.revertedWith('Only DAO can call');
            await barn.setBondCirculatingSupply(amount);
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
            const signatures = ['setWarmUpPeriod(uint256)',
                'setActivePeriod(uint256)',
                'setQueuePeriod(uint256)',
                'setGracePeriod(uint256)',
                'setMinimumThreshold(uint256)',
                'setMinimumQuorum(uint256)',
            ];

            const period = (await governance.GRACE_PERIOD()).toNumber() / 2;
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

            const WARM_UP_PERIOD = (await governance.WARM_UP()).toNumber();
            const ts = await helpers.getCurrentBlockchainTimestamp();

            await moveAtTimestamp(ts + WARM_UP_PERIOD + 1);
            await governance.startVote(1);

            let proposal = await governance.proposals(1);
            await governance.connect(user).castVote(1, true);

            await moveAtTimestamp(proposal.startTime.toNumber() + WARM_UP_PERIOD + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Accepted);
            await governance.queue(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Queued);

            proposal = await governance.proposals(1);
            await moveAtTimestamp(proposal.eta.toNumber() + 1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Grace);

            await governance.execute(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Executed);
            expect(await governance.WARM_UP()).to.be.equal(period);
            expect(await governance.ACTIVE()).to.be.equal(period);
            expect(await governance.QUEUE()).to.be.equal(period);
            expect(await governance.GRACE_PERIOD()).to.be.equal(period);
            expect(await governance.MINIMUM_FOR_VOTES_THRESHOLD()).to.be.equal(51);
            expect(await governance.MINIMUM_QUORUM()).to.be.equal(51);
        });

        it('proposer cancel proposal', async function () {
            await setupEnv();
            await createTestProposal();

            await governance.connect(user).cancel(1);
            expect(await governance.state(1)).to.be.equal(ProposalState.Canceled);
        });
    });

    async function setupEnv () {
        await barn.setBondCirculatingSupply(amount);
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
