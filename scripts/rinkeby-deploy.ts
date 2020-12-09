import * as helpers from '../test/helpers';

const _barn = '0x5e4D8f6bb715f56067Cde289F9aaCF6a2ACd0330';
const _owner = '0x89d652C64d7CeE18F5DF53B24d9D29D130b18798';

async function main () {
    const gov = await helpers.deployGovernance();
    console.log('Governance deployed at: ', gov.address);

    await gov.initialize(_barn, _owner);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
