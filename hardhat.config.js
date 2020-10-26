const config = require('./config')
const ethers = require('ethers')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-abi-exporter')

// no support yet for the following
// require('solidity-coverage')
// require('buidler-gas-reporter')

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
    const accounts = await ethers.getSigners()

    for (const account of accounts) {
        console.log(await account.getAddress())
    }
})

// Some of the settings should be defined in `./config.js`.
// Go to https://buidler.dev/config/ for the syntax.
module.exports = {
    solc: {
        version: '0.7.0',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },

    defaultNetwork: 'hardhat',

    networks: config.networks,
    etherscan: config.etherscan,

    abiExporter: {
        only: ['BarnBridgeDAO'],
        clear: true,
    },
}
