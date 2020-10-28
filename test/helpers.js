const { ethers } = require('hardhat')
const diamond = require('diamond-util')

async function deployVoteLock () {
    const VoteLock = await ethers.getContractFactory('VoteLock')
    const lock = await VoteLock.deploy()
    await lock.deployed()

    return lock
}

async function deployLoupe () {
    const DiamondLoupeFacetFactory = await ethers.getContractFactory('DiamondLoupeFacet')
    const dlf = await DiamondLoupeFacetFactory.deploy()
    await dlf.deployed()

    return dlf
}

async function deployDiamond (diamondArtifactName, facets) {
    const diamondCut = []

    for (const facet of facets) {
        diamondCut.push([
            facet.address,
            diamond.FacetCutAction.Add,
            diamond.getSelectors(facet),
        ])
    }

    const diamondFactory = await ethers.getContractFactory(diamondArtifactName)
    const deployedDiamond = await diamondFactory.deploy(diamondCut)
    await deployedDiamond.deployed()

    return deployedDiamond
}

async function daoAsFacet (dao, facetName) {
    return await ethers.getContractAt(facetName, dao.address)
}

exports.deployVoteLock = deployVoteLock
exports.deployLoupe = deployLoupe
exports.deployDiamond = deployDiamond
exports.daoAsFacet = daoAsFacet
