import { ethers } from 'hardhat';

const _gov = '0x8EAcaEdD6D3BaCBC8A09C0787c5567f86eE96d02';
const _barn = '0x19cFBFd65021af353aB8A7126Caf51920163f0D2';

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
