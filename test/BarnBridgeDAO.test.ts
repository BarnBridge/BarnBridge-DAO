// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ethers } from 'hardhat';
import { expect } from 'chai';
import * as helpers from './helpers';
import * as _const from './const';
import { Contract, Signer } from 'ethers';

let account:Signer;
let dao:Contract;

describe('BarnBridgeDAO', async function () {
    before(async function () {
        const loupe = await helpers.deployLoupe();

        dao = await helpers.deployDiamond('BarnBridgeDAO', [loupe]);

        const accounts = await ethers.getSigners();
        account = await accounts[0];
    });

    describe('Dao Tests', function () {
        it('should be deployed', async function () {
            expect(dao.address).to.not.equal(0);
        });

        it('should have loupe functions', async function () {
            const d = await helpers.daoAsFacet(dao, _const.LOUPE_FACET);

            expect(await d.facets()).to.not.throw;
        });
    });
});
