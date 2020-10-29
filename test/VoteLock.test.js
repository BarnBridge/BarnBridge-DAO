/* eslint-disable prefer-const */
const { expect } = require('chai')
const { ethers } = require('hardhat')
const helpers = require('./helpers')
const _const = require('./const')

const BN = ethers.BigNumber

describe('VoteLock', function () {
    const amount = BN.from(100).mul(BN.from(10).pow(18))

    let dao, lock
    let user

    before(async function () {
        const lockFacet = await helpers.deployVoteLock()
        const loupeFacet = await helpers.deployLoupe()

        console.log('Lock facet deployed at:', lockFacet.address)

        dao = await helpers.deployDiamond('BarnBridgeDAO', [lockFacet, loupeFacet])
        lock = await helpers.daoAsFacet(dao, _const.voteLockFacet)

        console.log('DAO deployed at:', dao.address)

        const accounts = await ethers.getSigners()
        user = accounts[0]
    })

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0)
        })
    })

    describe('deposit', function () {
        it('stores the user balance in storage', async function () {
            await lock.connect(user).deposit(amount)

            expect(await lock.balanceOf(user.getAddress())).to.equal(amount)
        })
    })
})
