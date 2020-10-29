/* eslint-disable prefer-const */
const { ethers } = require('hardhat')
const { expect } = require('chai')
const helpers = require('./helpers')
const _const = require('./const')

let account, dao

describe('BarnBridgeDAO', async function () {
    before(async function () {
        const loupe = await helpers.deployLoupe()

        dao = await helpers.deployDiamond('BarnBridgeDAO', [loupe])

        const accounts = await ethers.getSigners()
        account = await accounts[0].getAddress()
    })

    describe('Dao Tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0)
        })

        it('should have loupe functions', async function () {
            const d = await helpers.daoAsFacet(dao, _const.loupeFacet)

            expect(await d.facets()).to.not.throw
        })
    })
})
