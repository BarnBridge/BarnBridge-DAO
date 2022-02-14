import * as helpers from '../test/helpers';

const _barn = '0x34981b958C8d13eB4b5585f4eF6a772510EF2374';

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
