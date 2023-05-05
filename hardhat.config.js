require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.18",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  networks: {
    hardhat: {},
    bsctestnet: {
      url: "https://data-seed-prebsc-1-s3.binance.org:8545",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
};
