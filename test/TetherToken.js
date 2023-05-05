const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("TetherToken", function () {
  async function deployTetherToken() {
    const NAME = "Tether USD";
    const SYMBOL = "USDT";
    const DECIMALS = 18;
    const INITIAL_SUPPLY = 10_000_000_000_000_000_000_000n;

    const [owner, otherAccount] = await ethers.getSigners();
    const TetherToken = await ethers.getContractFactory("TetherToken");
    const tetherToken = await TetherToken.deploy(INITIAL_SUPPLY);
    await tetherToken.deployed();
    return {
      tetherToken,
      NAME,
      SYMBOL,
      DECIMALS,
      INITIAL_SUPPLY,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      const { tetherToken, NAME } = await loadFixture(deployTetherToken);
      expect(await tetherToken.name()).to.equal(NAME);
    });
    it("Should set the right symbol", async function () {
      const { tetherToken, SYMBOL } = await loadFixture(deployTetherToken);
      expect(await tetherToken.symbol()).to.equal(SYMBOL);
    });
    it("Should set the right decimals", async function () {
      const { tetherToken, DECIMALS } = await loadFixture(deployTetherToken);
      expect(await tetherToken.decimals()).to.equal(DECIMALS);
    });
    it("Should set the right total supply", async function () {
      const { tetherToken, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      expect(await tetherToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
    it("Should set the right owner", async function () {
      const { tetherToken, owner } = await loadFixture(deployTetherToken);
      expect(await tetherToken.owner()).to.equal(owner.address);
    });
    it("Owner should have the right balance", async function () {
      const { tetherToken, owner, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      expect(await tetherToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY
      );
    });
  });

  describe("Minting", function () {
    it("Should mint tokens", async function () {
      const { tetherToken, otherAccount, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.mint(otherAccount.address, 1n);
      expect(await tetherToken.balanceOf(otherAccount.address)).to.equal(1n);
    });
    it("Should fail if minter is not the owner", async function () {
      const { tetherToken, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await expect(
        tetherToken.connect(otherAccount).mint(otherAccount.address, 1n)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
