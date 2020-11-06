// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { BigNumber, ContractFactory } from 'ethers';
import { Erc20Mock, VoteLock } from '../typechain';

export const stakingEpochStart = 1603065600;
export const stakingEpochDuration = 604800;
export const tenPow18 = BigNumber.from(10).pow(18);

export async function deployVoteLock (bond:string, cv:string, treasury:string): Promise<VoteLock> {
    const VoteLock: ContractFactory = await ethers.getContractFactory('VoteLock');
    const lock: VoteLock = (await VoteLock.deploy(bond, cv, treasury)) as VoteLock;
    await lock.deployed();

    return lock;
}

export async function deployBond ():Promise<Erc20Mock> {
    const ERC20Mock: ContractFactory = await ethers.getContractFactory('ERC20Mock');
    const bond = (await ERC20Mock.deploy()) as Erc20Mock;
    await bond.deployed();

    return bond;
}

export async function getLatestBlock (): Promise<any> {
    return await ethers.provider.send('eth_getBlockByNumber', ['latest', false]);
}

export async function getLatestBlockTimestamp ():Promise<number> {
    return parseInt((await getLatestBlock()).timestamp);
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

export async function getCurrentEpoch (): Promise<number> {
    const currentBlockTs = parseInt((await getLatestBlock()).timestamp);

    if (currentBlockTs < stakingEpochStart) {
        return 0;
    }

    return Math.floor((currentBlockTs - stakingEpochStart) / stakingEpochDuration) + 1;
}
