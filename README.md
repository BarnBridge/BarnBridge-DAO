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

## Updating the .env file
### Create an API key with a Provider such as Infura to deploy to Ethereum Public Testnet. In this guide, we are using Kovan.

1. Navigate to [Infura.io](https://infura.io/) and create an account
2. Log in and select "Get started and create your first project to access the Ethereum network"
3. Create a project and name it appropriately
4. Then, copy the URL and paste it into the section named PROVIDER in the .env file

### Create an API key with Etherscan 
5. Navigate to [EtherScan](https://etherscan.io/) and create an account 
6. Log in and navigate to [MyAPIKey](https://etherscan.io/myapikey) 
7. Use the Add button to create an API key, and paste it into the indicated section towards the bottom of the `config.ts` file
### Update .env file with the address of the Barn contract from [BarnBridge-Barn](https://github.com/BarnBridge/BarnBridge-Barn)
8. Get the Barn address given by deploying BarnBridge-Barn and paste it into the .env file section labeled BARN
### Update .env with your wallet information
9. Finally, insert the mnemonic phrase for your testing wallet. You can use a MetaMask instance, and switch the network to Rinkeby on the upper right. DO NOT USE YOUR PERSONAL METAMASK SEED PHRASE; USE A DIFFERENT BROWSER WITH AN INDEPENDENT METAMASK INSTALLATION
10. You'll need some Kovan-ETH (it is free) in order to pay the gas costs of deploying the contracts on the TestNet; you can use your GitHub account to authenticate to the [KovanFaucet](https://faucet.kovan.network/) and receive 2 Kovan-ETH for free every 24 hours


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
    npm run deploy-from-env
    
## MainNet Contracts
[Governance.sol](https://etherscan.io/address/0x4cAE362D7F227e3d306f70ce4878E245563F3069)

## Audits
- [QuantStamp](https://github.com/BarnBridge/BarnBridge-PM/blob/master/audits/Quantstamp-DAO.pdf)
- [Haechi](https://github.com/BarnBridge/BarnBridge-PM/blob/master/audits/HAECHI-DAO.pdf)

## Discussion
For any concerns with the platform, open an issue on GitHub or visit us on [Discord](https://discord.gg/9TTQNUzg) to discuss.
For security concerns, please email info@barnbridge.com.

Copyright 2021 BarnBridge DAO
