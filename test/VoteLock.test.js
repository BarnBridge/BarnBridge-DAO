/* eslint-disable prefer-const */
const { ethers } = require('hardhat')
const { expect } = require('chai')
const helpers = require('./helpers')

let dao, lock

describe('VoteLock', async function () {
    before(async function () {
        lock = await helpers.deployVoteLock()
        const loupe = await helpers.deployLoupe()

        dao = await helpers.deployDiamond('BarnBridgeDAO', [lock, loupe])
    })

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0)
        })
    })
})
