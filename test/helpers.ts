// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import * as diamond from 'diamond-util';

export async function deployVoteLock (): Promise<Contract> {
    const VoteLock:ContractFactory = await ethers.getContractFactory('VoteLock');
    const lock:Contract = await VoteLock.deploy();
    await lock.deployed();

    return lock;
}

export async function deployLoupe (): Promise<Contract> {
    const DiamondLoupeFacetFactory: ContractFactory = await ethers.getContractFactory('DiamondLoupeFacet');
    const dlf: Contract = await DiamondLoupeFacetFactory.deploy();
    await dlf.deployed();

    return dlf;
}

export async function deployDiamond (diamondArtifactName:string, facets:Array<Contract>): Promise<Contract> {
    const diamondCut = [];

    for (const facet of facets) {
        diamondCut.push([
            facet.address,
            diamond.FacetCutAction.Add,
            diamond.getSelectors(facet),
        ]);
    }

    const diamondFactory: ContractFactory = await ethers.getContractFactory(diamondArtifactName);
    const deployedDiamond: Contract = await diamondFactory.deploy(diamondCut);
    await deployedDiamond.deployed();

    return deployedDiamond;
}

export async function daoAsFacet (dao, facetName):Promise<Contract> {
    return await ethers.getContractAt(facetName, dao.address);
}
