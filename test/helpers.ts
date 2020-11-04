// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

export async function deployVoteLock (): Promise<Contract> {
    const VoteLock:ContractFactory = await ethers.getContractFactory('VoteLock');
    const lock:Contract = await VoteLock.deploy();
    await lock.deployed();

    return lock;
}

