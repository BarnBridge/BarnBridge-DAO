import * as helpers from '../test/helpers';

const _barn = '0x59E2bC2E34EEeA09BfB99C2069Bfadf872D5F56f';

async function main () {
    const gov = await helpers.deployGovernance();
    console.log('Governance deployed at: ', gov.address);
    await gov.initialize(_barn);
    console.log('Barn set to: ', _barn);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
