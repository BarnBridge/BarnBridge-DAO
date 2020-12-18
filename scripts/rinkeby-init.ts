import { ethers } from 'hardhat';

const _gov = '0x188f848591e6aE4A4Cc728d36Dcf8eCC1b44fEC5';
const _barn = '0xc05d8A23221c48c10fBAD322f8bF133945Cd35d1';

async function main () {
    const gov = await ethers.getContractAt('Governance', _gov);
    await gov.initialize(_barn);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
