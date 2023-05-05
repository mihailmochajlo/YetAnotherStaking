// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const accounts = await ethers.getSigners();

  const TetherToken = await ethers.getContractFactory("TetherToken");
  const AwesomeToken = await ethers.getContractFactory("AwesomeToken");
  const StakeAwesomeForTether = await ethers.getContractFactory(
    "StakeAwesomeForTether"
  );

  const tetherToken = await TetherToken.deploy(
    ethers.utils.parseEther("100000")
  );
  await tetherToken.deployed();
  console.log(`TetherToken contract was deployed to ${tetherToken.address}`);

  const awesomeToken = await AwesomeToken.deploy(
    ethers.utils.parseEther("100000")
  );
  await awesomeToken.deployed();
  console.log(`AwesomeToken contract was deployed to ${awesomeToken.address}`);

  const stakeContract = await StakeAwesomeForTether.deploy(
    awesomeToken.address,
    tetherToken.address,
    365 * 24 * 60 * 60,
    20
  );
  await stakeContract.deployed();
  console.log(`Stake contract was deployed to ${stakeContract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
