import { ethers } from 'hardhat';

const _gov = '0x930e52B96320d7dBbfb6be458e5EE0Cd3E5E5Dac'; // from BarnBridge-DAO/scripts/kovan-deploy.ts
const _barn = '0x0DEc9fdb535eB45cef986F1129bb234578F8BD20'; // from BarnBridge-Barn/scripts/kovan-deploy-barn.ts

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
