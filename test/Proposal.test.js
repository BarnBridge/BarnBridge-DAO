const { ethers } = require('@nomiclabs/buidler')
const { expect } = require('chai')

describe('Proposal', function () {
    let dao

    beforeEach(async function () {
        const Dao = await ethers.getContractFactory('BarnBridgeDAO')

        dao = await Dao.deploy()
        await dao.deployed()
    })

    it('Can be deployed', async function () {
        expect(dao.address).to.not.equal(0)
    })
})
