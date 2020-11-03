// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { VoteLock } from '../typechain';

const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2,
};

function getSelectors (contract: Contract) {
    const signatures: string[] = Object.keys(contract.interface.functions);
    const selectors = signatures.reduce((acc: string[], val) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val));
        }
        return acc;
    }, []);
    return selectors;
}

export async function deployVoteLock (): Promise<Contract> {
    const VoteLock: ContractFactory = await ethers.getContractFactory('VoteLock');
    const lock: Contract = await VoteLock.deploy();
    await lock.deployed();

    return lock;
}

export async function deployLoupe (): Promise<Contract> {
    const DiamondLoupeFacetFactory: ContractFactory = await ethers.getContractFactory('DiamondLoupeFacet');
    const dlf: Contract = await DiamondLoupeFacetFactory.deploy();
    await dlf.deployed();

    return dlf;
}

export async function deployDiamond (diamondArtifactName: string, facets: Array<Contract>): Promise<Contract> {
    const diamondCut = [];

    for (const facet of facets) {
        diamondCut.push([
            facet.address,
            FacetCutAction.Add,
            getSelectors(facet),
        ]);
    }

    const diamondFactory: ContractFactory = await ethers.getContractFactory(diamondArtifactName);
    const deployedDiamond: Contract = await diamondFactory.deploy(diamondCut);
    await deployedDiamond.deployed();

    return deployedDiamond;
}

export async function daoAsFacet (dao: Contract, facetName: string): Promise<Contract> {
    return await ethers.getContractAt(facetName, dao.address);
}

export async function daoAsVoteLock (dao: Contract): Promise<VoteLock> {
    return (await ethers.getContractAt('VoteLock', dao.address)) as VoteLock;
}

export async function getLatestBlock (): Promise<any> {
    return await ethers.provider.send('eth_getBlockByNumber', ['latest', false]);
}

export async function setNextBlockTimestamp (timestamp: number): Promise<void> {
    const block = await ethers.provider.send('eth_getBlockByNumber', ['latest', false]);
    const currentTs = parseInt(block.timestamp);
    const diff = timestamp - currentTs;
    await ethers.provider.send('evm_increaseTime', [diff]);
}

export async function moveAtTimestamp (timestamp: number): Promise<void> {
    await setNextBlockTimestamp(timestamp);
    await ethers.provider.send('evm_mine', []);
}
