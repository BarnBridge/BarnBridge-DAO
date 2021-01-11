import { ethers } from 'hardhat';

async function main () {
    console.log(ethers.utils.defaultAbiCoder.encode([
        'uint256',
    ], [
        '14400',
    ]));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
