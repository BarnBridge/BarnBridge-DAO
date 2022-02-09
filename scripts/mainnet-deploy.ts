import * as helpers from '../test/helpers';

const _barn = ''; // to be filled

async function main () {
    const gov = await helpers.deployGovernance();
    console.log('Governance deployed at: ', gov.address);

    await gov.initialize(_barn);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
