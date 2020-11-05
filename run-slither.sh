#!/bin/bash

mkdir tmp
npx hardhat flatten > ./tmp/contracts.sol
slither ./tmp/contracts.sol
rm -r tmp
