/* eslint-disable prefer-const */
/* global contract artifacts web3 before it assert */
const { ethers } = require('hardhat')
const { expect } = require('chai')

const diamond = require('diamond-util')

let account, barnBridgeDAO

describe('BarnBridgeDAO', async function () {
    before(async function () {
        const DiamondLoupeFacetFactory = await ethers.getContractFactory('DiamondLoupeFacet')
        const BarnBridgeDAOFactory = await ethers.getContractFactory('BarnBridgeDAO')
        const diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        barnBridgeDAO = await BarnBridgeDAOFactory.deploy()
        await diamondLoupeFacet.deployed()

        const accounts = await ethers.getSigners()
        account = await accounts[0].getAddress()
    })
    describe('Dao Tests', function () {
        it('should be deployed', async function () {
            expect(barnBridgeDAO.address).to.not.equal(0)
        })
    })
})
