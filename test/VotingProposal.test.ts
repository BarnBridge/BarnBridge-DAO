// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { Contract, Signer, ethers as ejs } from 'ethers';
import * as helpers from './helpers';
import * as _const from './const';
import { expect } from 'chai';

describe('VotingProposal', function () {

    let dao:Contract, votingProposal: Contract, timelock: Contract;
    let user: Signer;

    before(async function () {
        const votingProposalFacet = await helpers.deployVotingProposalFacet();
        const timelockFacet = await helpers.deployTimelockFacet();
        const loupeFacet = await helpers.deployLoupe();

        console.log('Proposal facet deployed at:', votingProposalFacet.address);

        dao = await helpers.deployDiamond('BarnBridgeDAO', [votingProposalFacet, timelockFacet, loupeFacet]);
        votingProposal = await helpers.daoAsFacet(dao, _const.VOTING_PROPOSAL_FACET);
        timelock = await helpers.daoAsFacet(dao, _const.TIMELOCK_FACET);

        console.log('DAO deployed at:', dao.address);

        const accounts = await ethers.getSigners();
        user = accounts[0];
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0);
        });
    });

    describe('propose', function () {
        it('create new proposal', async function () {
            const targets = [helpers.zeroAddress()];
            const values = ['0'];
            const signatures = ['getBalanceOf(address)'];
            const callDatas = [ejs.utils.defaultAbiCoder.encode(['address'], [helpers.zeroAddress()])];
            await votingProposal.connect(user)
                .propose(targets, values, signatures, callDatas, 'description', 'title');
            expect(await votingProposal.lastProposalId()).to.be.equal(1);
        });
    });
});
