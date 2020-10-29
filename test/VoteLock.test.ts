// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as helpers from './helpers';
import * as _const from './const';
import { expect } from 'chai';

describe('VoteLock', function () {
    const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));

    let dao:Contract, lock: Contract;
    let user: Signer;

    before(async function () {
        const lockFacet = await helpers.deployVoteLock();
        const loupeFacet = await helpers.deployLoupe();

        console.log('Lock facet deployed at:', lockFacet.address);

        dao = await helpers.deployDiamond('BarnBridgeDAO', [lockFacet, loupeFacet]);
        lock = await helpers.daoAsFacet(dao, _const.LOCK_FACET);

        console.log('DAO deployed at:', dao.address);

        const accounts = await ethers.getSigners();
        user = accounts[0];
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0);
        });
    });

    describe('deposit', function () {
        it('stores the user balance in storage', async function () {
            await lock.connect(user).deposit(amount);

            // expect(await lock.balanceOf(user.getAddress())).to.equal(amount)
        });
    });
});
