import { NetworksUserConfig } from 'hardhat/types';
import { EtherscanConfig } from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = {
    // Needed for `solidity-coverage`
    coverage: {
        url: 'http://localhost:8555',
    },

    // Kovan
    kovan: {
        url: 'https://kovan.infura.io/v3/YOUR-INFURA-API-KEY',
        chainId: 42,
        accounts: {
            mnemonic: 'your kovan test wallet mnemonic phrase here, get eth from faucet first',
            path: 'm/44\'/60\'/0\'/0',
            initialIndex: 0,
            count: 10,
        },
        gas: 3716887,
        gasPrice: 20000000000, // 20 gwei
        gasMultiplier: 1.5,
    },

    // Mainnet
    mainnet: {
        url: 'https://mainnet.infura.io/v3/YOUR-INFURA-KEY',
        chainId: 1,
        accounts: ['0xaaaa'],
        gas: 'auto',
        gasPrice: 50000000000,
        gasMultiplier: 1.5,
    },
};

// Use to verify contracts on Etherscan
// https://buidler.dev/plugins/nomiclabs-buidler-etherscan.html
export const etherscan: EtherscanConfig = {
    apiKey: 'YOUR-ETHERSCAN-API-KEY',
};
