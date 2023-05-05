const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("AwesomeToken", function () {
  async function deployAwesomeToken() {
    const NAME = "Awesome Token";
    const SYMBOL = "AWT";
    const DECIMALS = 18;
    const INITIAL_SUPPLY = 10_000_000_000_000_000_000_000n;

    const [owner, otherAccount] = await ethers.getSigners();
    const AwesomeToken = await ethers.getContractFactory("AwesomeToken");
    const awesomeToken = await AwesomeToken.deploy(INITIAL_SUPPLY);
    await awesomeToken.deployed();
    return {
      awesomeToken,
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
      const { awesomeToken, NAME } = await loadFixture(deployAwesomeToken);
      expect(await awesomeToken.name()).to.equal(NAME);
    });
    it("Should set the right symbol", async function () {
      const { awesomeToken, SYMBOL } = await loadFixture(deployAwesomeToken);
      expect(await awesomeToken.symbol()).to.equal(SYMBOL);
    });
    it("Should set the right decimals", async function () {
      const { awesomeToken, DECIMALS } = await loadFixture(deployAwesomeToken);
      expect(await awesomeToken.decimals()).to.equal(DECIMALS);
    });
    it("Should set the right total supply", async function () {
      const { awesomeToken, INITIAL_SUPPLY } = await loadFixture(
        deployAwesomeToken
      );
      expect(await awesomeToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
    it("Owner should have the right balance", async function () {
      const { awesomeToken, owner, INITIAL_SUPPLY } = await loadFixture(
        deployAwesomeToken
      );
      expect(await awesomeToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY
      );
    });
  });

  describe("Minting", function () {
    it("Should mint tokens", async function () {
      const { awesomeToken, otherAccount } = await loadFixture(
        deployAwesomeToken
      );
      await awesomeToken.mint(otherAccount.address, 1n);
      expect(await awesomeToken.balanceOf(otherAccount.address)).to.equal(1n);
    });
    it("Should fail if minter is not minter", async function () {
      const { awesomeToken, otherAccount } = await loadFixture(
        deployAwesomeToken
      );
      await expect(
        awesomeToken.connect(otherAccount).mint(otherAccount.address, 1n)
      ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
    });
  });
});
