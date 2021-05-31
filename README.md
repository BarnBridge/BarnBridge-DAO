# BarnBridge DAO
![](https://i.imgur.com/Neja9z5.png)

Implements the BarnBridge Decentralized Autonomous Organization (DAO) Governance contracts, allowing token holders to create proposals, vote upon them, and queues up for execution those proposals that have passed with quorum. Includes an Abrogation mechanism to cancel queued transactions.

Any questions? Please contact us on [Discord](https://discord.gg/FfEhsVk) or read our [Developer Guides](https://integrations.barnbridge.com/) for more information.

##  Contracts
### Governance.sol
Implements DAO logic Creating proposals, voting, queuing, canceling, executing and abrogating.


## Smart Contract Architecture
Overview

Check out more detailed smart contract Slither graphs with all the dependencies: [Yield Farming Slither Graphs](https://github.com/BarnBridge/sc-graphs/tree/main/BarnBridge-DAO).

## Smart Contract Specification
[SPEC](https://github.com/BarnBridge/BarnBridge-DAO/blob/master/SPEC.md)

## Initial Setup
### Install NVM and the latest version of NodeJS 12.x
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash 
    # Restart terminal and/or run commands given at the end of the installation script
    nvm install 12
    nvm use 12
### Use Git to pull down the BarnBridge-SmartYieldBonds repository from GitHub
    git clone https://github.com/BarnBridge/BarnBridge-DAO.git
    cd BarnBridge-YieldFarming
### Create config.ts using the sample template config.sample.ts
    cp config.sample.ts config.ts

## Updating the config.ts file
### Create an API key with Infura to deploy to Ethereum Public Testnet. In this guide, we are using Kovan.

1. Navigate to [Infura.io](https://infura.io/) and create an account
2. Log in and select "Get started and create your first project to access the Ethereum network"
3. Create a project and name it appropriately
4. Then, switch the endpoint to Rinkeby, copy the https URL and paste it into the section named `rinkeby` 
5. Finally, insert the mnemonic phrase for your testing wallet. You can use a MetaMask instance, and switch the network to Rinkeby on the upper right. DO NOT USE YOUR PERSONAL METAMASK SEED PHRASE; USE A DIFFERENT BROWSER WITH AN INDEPENDENT METAMASK INSTALLATION
6. You'll need some Kovan-ETH (it is free) in order to pay the gas costs of deploying the contracts on the TestNet; you can use your GitHub account to authenticate to the [KovanFaucet](https://faucet.kovan.network/) and receive 2 Kovan-ETH for free every 24 hours

### Create an API key with Etherscan 
1. Navigate to [EtherScan](https://etherscan.io/) and create an account 
2. Log in and navigate to [MyAPIKey](https://etherscan.io/myapikey) 
3. Use the Add button to create an API key, and paste it into the indicated section towards the bottom of the `config.ts` file

### Verify contents of config.ts; it should look like this:

```js
	import { NetworksUserConfig } from "hardhat/types";
	import { EtherscanConfig } from "@nomiclabs/hardhat-etherscan/dist/src/types";

	export const networks: NetworksUserConfig = {
	    // Needed for `solidity-coverage`
	    coverage: {
		url: "http://localhost:8555"
	    },

	    // Kovan
	    kovan: {
		url: "https://kovan.infura.io/v3/INFURA-API-KEY",
		chainId: 42,
		accounts: {
		    mnemonic: "YourKovanTestWalletMnemonicPhrase",
		    path: "m/44'/60'/0'/0",
		    initialIndex: 0,
		    count: 10
		},
                gas: 3716887,
                gasPrice: 20000000000, // 20 gwei
                gasMultiplier: 1.5
	    },

	    // Mainnet
	    mainnet: {
		url: "https://mainnet.infura.io/v3/YOUR-INFURA-KEY",
		chainId: 1,
		accounts: ["0xaaaa"],
		gas: "auto",
		gasPrice: 50000000000,
		gasMultiplier: 1.5
	    }
	};

	// Use to verify contracts on Etherscan
	// https://buidler.dev/plugins/nomiclabs-buidler-etherscan.html
	export const etherscan: EtherscanConfig = {
	    apiKey: "YourEtherscanAPIKey"
	};

```
## Installing

### Install NodeJS dependencies which include HardHat
    npm install
    
### Compile the contracts
    npm run compile
    
## Running Tests
    npm run test

**Note:** The result of tests is readily available [here](./test-results.md).
## Running Code Coverage Tests
    npm run coverage

## Deploying to Kovan    
### Use the code in the scripts folder to deploy the Governance contract on Kovan

    npx hardhat run --network kovan scripts/kovan-deploy.js # outputs governance contract address
    
### Use the code in the scripts folder to initialize the contracts
**NOTE:** You can update kovan-init.js with the Governance contract address created in the previous step or keep the BarnBridge Kovan address
**NOTE:** You can update kovan-init.js with your own deployment of Barn from BarnBridge-Barn/scripts/kovan-deploy-barn.ts or keep the BarnBridge Kovan address

    npx hardhat run --network kovan scripts/kovan-init.js


## MainNet Contracts
[Governance.sol](https://etherscan.io/address/0x4cAE362D7F227e3d306f70ce4878E245563F3069)

## Audits
- [QuantStamp](https://github.com/BarnBridge/BarnBridge-PM/blob/master/audits/Quantstamp-DAO.pdf)
- [Haechi](https://github.com/BarnBridge/BarnBridge-PM/blob/master/audits/HAECHI-DAO.pdf)

## Discussion
For any concerns with the platform, open an issue on GitHub or visit us on [Discord](https://discord.gg/9TTQNUzg) to discuss.
For security concerns, please email info@barnbridge.com.

Copyright 2021 BarnBridge DAO
