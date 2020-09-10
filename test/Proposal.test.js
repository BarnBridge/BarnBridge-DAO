const { ethers } = require('@nomiclabs/buidler')
const { expect } = require('chai')

describe('Proposal', function () {
    let dao
    const votingBlocksDuration = 0
    const challengeBlocksDuration = 0

    const zeroAddr = ethers.utils.getAddress('0x0000000000000000000000000000000000000000')

    let proposal

    beforeEach(async function () {
        const Dao = await ethers.getContractFactory('BarnBridgeDAO')
        dao = await Dao.deploy()
        await dao.deployed()

        const ProposalMock = await ethers.getContractFactory('ProposalMock')
        proposal = await ProposalMock.deploy()
        await proposal.deployed()
    })

    describe('newProposal', async function () {
        it('Can be deployed', async function () {
            expect(dao.address).to.not.equal(0)
        })

        it('Can create new proposal', async function () {
            await dao.newProposal(
                proposal.address,
                votingBlocksDuration,
                challengeBlocksDuration,
            )
        })

        it('Reverts if proposal is not a contract', async function () {
            await expect(
                dao.newProposal(
                    zeroAddr,
                    votingBlocksDuration,
                    challengeBlocksDuration,
                ),
            ).to.be.revertedWith('BarnBridgeDAO: Proposal needs to be a contract.')
        })

        it('Emits Proposal() event', async function () {
            const txProposal = await dao.newProposal(
                proposal.address,
                votingBlocksDuration,
                challengeBlocksDuration,
            )

            console.log(txProposal)
        })
    })
})
