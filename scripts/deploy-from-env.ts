import * as helpers from '../test/helpers';

require('dotenv').config();

const _barn = process.env.BARN;

async function main () {
    const gov = await helpers.deployGovernance();
    console.log('Governance deployed at: ', gov.address);
    await gov.initialize(_barn);
    console.log('Governance Successfuly Initialized')
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
