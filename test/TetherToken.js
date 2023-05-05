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
    const tetherToken = await TetherToken.deploy(
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
      DECIMALS
    );
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

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.transferOwnership(otherAccount.address);
      expect(await tetherToken.owner()).to.equal(otherAccount.address);
    });
    it("Should fail if non-owner tries to transfer ownership", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await expect(
        tetherToken.connect(otherAccount).transferOwnership(owner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should fail transfer ownership to zero address", async function () {
      const { tetherToken, owner } = await loadFixture(deployTetherToken);
      await expect(
        tetherToken.transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });
    it("Should emit OwnershipTransferred event", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await expect(tetherToken.transferOwnership(otherAccount.address))
        .to.emit(tetherToken, "OwnershipTransferred")
        .withArgs(owner.address, otherAccount.address);
    });
  });

  describe("Supply", function () {
    it("Should increase supply and owner balance", async function () {
      const { tetherToken, owner, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.issue(INITIAL_SUPPLY);
      expect(await tetherToken.totalSupply()).to.equal(2n * INITIAL_SUPPLY);
      expect(await tetherToken.balanceOf(owner.address)).to.equal(
        2n * INITIAL_SUPPLY
      );
    });
    it("Should decrease supply and owner balance", async function () {
      const { tetherToken, owner, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.redeem(INITIAL_SUPPLY);
      expect(await tetherToken.totalSupply()).to.equal(0n);
      expect(await tetherToken.balanceOf(owner.address)).to.equal(0n);
    });
    it("Should fail if non-owner tries to increase supply", async function () {
      const { tetherToken, otherAccount, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await expect(
        tetherToken.connect(otherAccount).issue(INITIAL_SUPPLY)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should fail if non-owner tries to decrease supply", async function () {
      const { tetherToken, otherAccount, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await expect(
        tetherToken.connect(otherAccount).redeem(INITIAL_SUPPLY)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should fail if owner balance is lower than amount to decrease supply", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await tetherToken.transfer(otherAccount.address, 1n);
      await expect(tetherToken.redeem(INITIAL_SUPPLY)).to.be.revertedWith(
        "Owner balance is less then amount to redeem"
      );
    });
    it("Should emit Issue event", async function () {
      const { tetherToken, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await expect(tetherToken.issue(INITIAL_SUPPLY))
        .to.emit(tetherToken, "Issue")
        .withArgs(INITIAL_SUPPLY);
    });
    it("Should emit Redeem event", async function () {
      const { tetherToken, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await expect(tetherToken.redeem(INITIAL_SUPPLY))
        .to.emit(tetherToken, "Redeem")
        .withArgs(INITIAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await tetherToken.transfer(otherAccount.address, 1n);
      expect(await tetherToken.balanceOf(otherAccount.address)).to.equal(1n);
      expect(await tetherToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - 1n
      );
    });
    it("Should fail if sender doesn't have enough tokens", async function () {
      const { tetherToken, otherAccount, INITIAL_SUPPLY } = await loadFixture(
        deployTetherToken
      );
      await expect(
        tetherToken.transfer(otherAccount.address, INITIAL_SUPPLY + 1n)
      ).to.be.revertedWith("ERC20: Token balance is less then amount");
    });
    it("Should fail if receiver is zero address", async function () {
      const { tetherToken } = await loadFixture(deployTetherToken);
      await expect(
        tetherToken.transfer(ethers.constants.AddressZero, 1n)
      ).to.be.revertedWith("ERC20: Transfer to the zero address");
    });
    it("Should emit Transfer event", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await expect(tetherToken.transfer(otherAccount.address, 1n))
        .to.emit(tetherToken, "Transfer")
        .withArgs(owner.address, otherAccount.address, 1n);
    });
    it("Should set allowance", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.approve(otherAccount.address, 1n);
      expect(
        await tetherToken.allowance(owner.address, otherAccount.address)
      ).to.equal(1n);
    });
    it("Should fail to update allowance", async function () {
      const { tetherToken, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.approve(otherAccount.address, 1n);
      await expect(
        tetherToken.approve(otherAccount.address, 2n)
      ).to.be.revertedWith("To reduce/increase allowance, first set to 0");
    });
    it("Should reset allowance", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.approve(otherAccount.address, 1n);
      await tetherToken.approve(otherAccount.address, 0n);
      expect(
        await tetherToken.allowance(owner.address, otherAccount.address)
      ).to.equal(0n);
    });
    it("Should transfer with allowance", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await tetherToken.approve(otherAccount.address, 1n);
      await tetherToken
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, 1n);
      expect(await tetherToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - 1n
      );
      expect(await tetherToken.balanceOf(otherAccount.address)).to.equal(1n);
      expect(
        await tetherToken.allowance(owner.address, otherAccount.address)
      ).to.equal(0n);
    });
    it("Should fail transfer from owner", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await expect(
        tetherToken.transferFrom(owner.address, otherAccount.address, 1n)
      ).to.be.revertedWith("ERC20: trying to use transferFrom by owner");
    });
    it("Should fail if no allowance to transfer", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await expect(
        tetherToken
          .connect(otherAccount)
          .transferFrom(owner.address, otherAccount.address, 1n)
      ).to.be.revertedWith("ERC20: Amount exceeds allowance");
    });
    it("Should fail to transfer with allowance if sender doesn't have enough tokens", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await tetherToken.approve(otherAccount.address, INITIAL_SUPPLY + 1n);
      await expect(
        tetherToken
          .connect(otherAccount)
          .transferFrom(
            owner.address,
            otherAccount.address,
            INITIAL_SUPPLY + 1n
          )
      ).to.be.revertedWith("ERC20: Token balance is less then amount");
    });
    it("Should fail to transfer with allowance if receiver is zero address", async function () {
      const { tetherToken, owner, otherAccount } = await loadFixture(
        deployTetherToken
      );
      await tetherToken.approve(otherAccount.address, 1n);
      await expect(
        tetherToken.connect(otherAccount).transferFrom(
          owner.address,
          ethers.constants.AddressZero,
          1n
        )
      ).to.be.revertedWith("ERC20: Transfer to the zero address");
    });
    it("Should emit Transfer event with allowance", async function () {
      const { tetherToken, owner, otherAccount, INITIAL_SUPPLY } =
        await loadFixture(deployTetherToken);
      await tetherToken.approve(otherAccount.address, 1n);
      await expect(
        tetherToken
          .connect(otherAccount)
          .transferFrom(owner.address, otherAccount.address, 1n)
      )
        .to.emit(tetherToken, "Transfer")
        .withArgs(owner.address, otherAccount.address, 1n);
    });
  });
});
