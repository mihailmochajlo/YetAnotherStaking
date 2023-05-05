const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("StakeAwesomeForTether", function () {
  async function deployStakeContract() {
    const TETHER_INITIAL_SUPPLY = 10_000_000_000_000_000_000_000n;
    const AWESOME_INITIAL_SUPPLY = 10_000_000_000_000_000_000_000n;
    const STAKE_DURATION_IN_SECONDS = 60 * 60 * 24 * 365; // 1 year
    const ANNUAL_INTEREST_RATE = 20; // 20%

    const [owner, otherAccount] = await ethers.getSigners();

    const TetherToken = await ethers.getContractFactory("TetherToken");
    const tetherToken = await TetherToken.deploy(TETHER_INITIAL_SUPPLY);
    await tetherToken.deployed();

    const AwesomeToken = await ethers.getContractFactory("AwesomeToken");
    const awesomeToken = await AwesomeToken.deploy(AWESOME_INITIAL_SUPPLY);
    await awesomeToken.deployed();

    const StakeContract = await ethers.getContractFactory(
      "StakeAwesomeForTether"
    );
    const stakeContract = await StakeContract.deploy(
      awesomeToken.address,
      tetherToken.address,
      STAKE_DURATION_IN_SECONDS,
      ANNUAL_INTEREST_RATE
    );
    await stakeContract.deployed();

    await awesomeToken.grantRole(
      awesomeToken.MINTER_ROLE(),
      stakeContract.address
    );

    return {
      stakeContract,
      tetherToken,
      awesomeToken,
      owner,
      otherAccount,
      TETHER_INITIAL_SUPPLY,
      AWESOME_INITIAL_SUPPLY,
      STAKE_DURATION_IN_SECONDS,
      ANNUAL_INTEREST_RATE,
    };
  }

  describe("Deployment", function () {
    it("Should set the right tether token address", async function () {
      const { stakeContract, tetherToken } = await loadFixture(
        deployStakeContract
      );
      expect(await stakeContract.tetherTokenContract()).to.equal(
        tetherToken.address
      );
    });
    it("Should set the right awesome token address", async function () {
      const { stakeContract, awesomeToken } = await loadFixture(
        deployStakeContract
      );
      expect(await stakeContract.awesomeTokenContract()).to.equal(
        awesomeToken.address
      );
    });
    it("Should set the right stake duration", async function () {
      const { stakeContract, STAKE_DURATION_IN_SECONDS } = await loadFixture(
        deployStakeContract
      );
      expect(await stakeContract.stakeDuration()).to.equal(
        STAKE_DURATION_IN_SECONDS
      );
    });
    it("Should set the right annual interest rate", async function () {
      const { stakeContract, ANNUAL_INTEREST_RATE } = await loadFixture(
        deployStakeContract
      );
      expect(await stakeContract.stakeAnnualRate()).to.equal(
        ANNUAL_INTEREST_RATE
      );
    });
  });

  describe("Buy awesome token", function () {
    it("Should buy", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const { stakeContract, awesomeToken, tetherToken, otherAccount } =
        await loadFixture(deployStakeContract);
      await tetherToken.mint(otherAccount.address, AMOUNT);
      await tetherToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).buyToken(AMOUNT);
      const TIMESTAMP = await time.latest();
      expect(await awesomeToken.balanceOf(stakeContract.address)).to.equal(
        AMOUNT
      );
      expect(await stakeContract.staked(otherAccount.address)).to.equal(AMOUNT);
      expect(await stakeContract.stakedAt(otherAccount.address)).to.equal(
        TIMESTAMP
      );
      expect(await stakeContract.claimedAt(otherAccount.address)).to.equal(
        TIMESTAMP
      );
    });
    it("Should fail to buy due to staked already", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const { stakeContract, awesomeToken, tetherToken, otherAccount } =
        await loadFixture(deployStakeContract);
      await tetherToken.mint(otherAccount.address, AMOUNT);
      await tetherToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).buyToken(AMOUNT - 1n);
      await expect(
        stakeContract.connect(otherAccount).buyToken(1n)
      ).to.be.revertedWith("Already staking");
    });
  });

  describe("Stake", function () {
    it("Should stake", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const { stakeContract, awesomeToken, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT);
      const TIMESTAMP = await time.latest();
      expect(await awesomeToken.balanceOf(stakeContract.address)).to.equal(
        AMOUNT
      );
      expect(await awesomeToken.balanceOf(otherAccount.address)).to.equal(0n);
      expect(await stakeContract.staked(otherAccount.address)).to.equal(AMOUNT);
      expect(await stakeContract.stakedAt(otherAccount.address)).to.equal(
        TIMESTAMP
      );
      expect(await stakeContract.claimedAt(otherAccount.address)).to.equal(
        TIMESTAMP
      );
    });
    it("Should fail to stake due to staked already", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const { stakeContract, awesomeToken, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT - 1n);
      await expect(
        stakeContract.connect(otherAccount).stakeToken(1n)
      ).to.be.revertedWith("Already staking");
    });
    it("Should fail to stake due to not enough awesome token", async function () {
      const { stakeContract, awesomeToken, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await expect(
        stakeContract.connect(otherAccount).stakeToken(1n)
      ).to.be.revertedWith("Insufficient balance to stake");
    });
  });

  describe("Claim", function () {
    it("Should check rewards after lock period", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const REWARD = 200_000_000_000_000_000_000n;
      const {
        stakeContract,
        awesomeToken,
        otherAccount,
        STAKE_DURATION_IN_SECONDS,
        ANNUAL_INTEREST_RATE,
      } = await loadFixture(deployStakeContract);
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT);
      await time.increase(STAKE_DURATION_IN_SECONDS);
      expect(await stakeContract.reward(otherAccount.address)).to.equal(REWARD);
    });
    it("Should check rewards before lock period", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const REWARD = 100_000_000_000_000_000_000n;
      const {
        stakeContract,
        awesomeToken,
        otherAccount,
        STAKE_DURATION_IN_SECONDS,
        ANNUAL_INTEREST_RATE,
      } = await loadFixture(deployStakeContract);
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT);
      await time.increase(STAKE_DURATION_IN_SECONDS / 2);
      expect(await stakeContract.reward(otherAccount.address)).to.equal(REWARD);
    });
    it("Should fail to check rewards due to not staking", async function () {
      const { stakeContract, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await expect(
        stakeContract.reward(otherAccount.address)
      ).to.be.revertedWith("Not staking");
    });
    it("Should claim rewards", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const REWARD = 200_000_000_000_000_000_000n;
      const {
        stakeContract,
        awesomeToken,
        otherAccount,
        STAKE_DURATION_IN_SECONDS,
        ANNUAL_INTEREST_RATE,
      } = await loadFixture(deployStakeContract);
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT);
      const TIMESTAMP_ON_STAKE = await time.latest();
      await time.increase(STAKE_DURATION_IN_SECONDS - 1);
      await stakeContract.connect(otherAccount).claim();
      const TIMESTAMP_ON_CLAIM = await time.latest();
      expect(await awesomeToken.balanceOf(otherAccount.address)).to.equal(
        REWARD
      );
      expect(await stakeContract.staked(otherAccount.address)).to.equal(AMOUNT);
      expect(await stakeContract.stakedAt(otherAccount.address)).to.equal(
        TIMESTAMP_ON_STAKE
      );
      expect(await stakeContract.claimedAt(otherAccount.address)).to.equal(
        TIMESTAMP_ON_CLAIM
      );
    });
    it("Should fail to claim rewards due to not staking", async function () {
      const { stakeContract, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await expect(
        stakeContract.connect(otherAccount).claim()
      ).to.be.revertedWith("Not staking");
    });
  });

  describe("Withdraw", function () {
    it("Should withdraw", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const REWARD = 200_000_000_000_000_000_000n;
      const {
        stakeContract,
        awesomeToken,
        otherAccount,
        STAKE_DURATION_IN_SECONDS,
        ANNUAL_INTEREST_RATE,
      } = await loadFixture(deployStakeContract);
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT);
      const TIMESTAMP_ON_STAKE = await time.latest();
      await time.increase(STAKE_DURATION_IN_SECONDS - 1);
      await stakeContract.connect(otherAccount).withdraw();
      const TIMESTAMP_ON_WITHDRAW = await time.latest();
      expect(await awesomeToken.balanceOf(otherAccount.address)).to.equal(
        AMOUNT + REWARD
      );
      expect(await stakeContract.staked(otherAccount.address)).to.equal(0n);
      expect(await stakeContract.stakedAt(otherAccount.address)).to.equal(0n);
      expect(await stakeContract.claimedAt(otherAccount.address)).to.equal(0n);
    });
    it("Should fail to withdraw due to not staking", async function () {
      const { stakeContract, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await expect(
        stakeContract.connect(otherAccount).withdraw()
      ).to.be.revertedWith("Not staking");
    });
    it("Should fail to withdraw due to lock period", async function () {
      const AMOUNT = 1_000_000_000_000_000_000_000n;
      const { stakeContract, awesomeToken, otherAccount } = await loadFixture(
        deployStakeContract
      );
      await awesomeToken.mint(otherAccount.address, AMOUNT);
      await awesomeToken
        .connect(otherAccount)
        .approve(stakeContract.address, AMOUNT);
      await stakeContract.connect(otherAccount).stakeToken(AMOUNT);
      await expect(stakeContract.connect(otherAccount).withdraw()).to.be.revertedWith("Staked amount still locked");
    });
  });
});
