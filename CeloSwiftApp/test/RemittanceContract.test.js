const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RemittanceContract", function () {
  let remittanceContract;
  let phoneRegistry;
  let kycAmlContract;
  let owner;
  let user1;
  let user2;
  let cusdToken;
  let usdtToken;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    cusdToken = await MockERC20.deploy("Celo USD", "cUSD", ethers.utils.parseEther("1000000"));
    usdtToken = await MockERC20.deploy("Tether USD", "USDT", ethers.utils.parseEther("1000000"));

    // Deploy contracts
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    phoneRegistry = await PhoneRegistry.deploy();

    const KycAmlContract = await ethers.getContractFactory("KycAmlContract");
    kycAmlContract = await KycAmlContract.deploy();

    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    remittanceContract = await RemittanceContract.deploy();

    // Configure supported tokens
    await remittanceContract.setSupportedToken(cusdToken.address, true);
    await remittanceContract.setSupportedToken(usdtToken.address, true);

    // Mint tokens to users
    await cusdToken.mint(user1.address, ethers.utils.parseEther("1000"));
    await cusdToken.mint(user2.address, ethers.utils.parseEther("1000"));
    await usdtToken.mint(user1.address, ethers.utils.parseEther("1000"));
    await usdtToken.mint(user2.address, ethers.utils.parseEther("1000"));

    // Approve tokens for remittance contract
    await cusdToken.connect(user1).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
    await cusdToken.connect(user2).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
    await usdtToken.connect(user1).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
    await usdtToken.connect(user2).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
  });

  describe("User Registration", function () {
    it("Should register a new user", async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      
      const userProfile = await remittanceContract.getUserProfile(user1.address);
      expect(userProfile.phoneNumber).to.equal("+1234567890");
      expect(userProfile.name).to.equal("Alice");
      expect(userProfile.isKycVerified).to.be.false;
    });

    it("Should not allow duplicate phone registration", async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      
      await expect(
        remittanceContract.connect(user2).registerUser("+1234567890", "Bob")
      ).to.be.revertedWith("Phone already registered");
    });

    it("Should not allow duplicate user registration", async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      
      await expect(
        remittanceContract.connect(user1).registerUser("+0987654321", "Alice2")
      ).to.be.revertedWith("User already registered");
    });
  });

  describe("Remittance Creation", function () {
    beforeEach(async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
    });

    it("Should create a remittance successfully", async function () {
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      
      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          amount,
          exchangeRate,
          "Test remittance"
        )
      ).to.emit(remittanceContract, "RemittanceCreated");

      const remittance = await remittanceContract.getRemittance(1);
      expect(remittance.sender).to.equal(user1.address);
      expect(remittance.recipient).to.equal(user2.address);
      expect(remittance.amount).to.equal(amount);
      expect(remittance.status).to.equal(0); // Pending
    });

    it("Should not allow remittance with unsupported token", async function () {
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      
      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          owner.address, // Invalid token
          amount,
          exchangeRate,
          "Test remittance"
        )
      ).to.be.revertedWith("Token not supported");
    });

    it("Should not allow remittance from unregistered user", async function () {
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      
      await expect(
        remittanceContract.connect(owner).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          amount,
          exchangeRate,
          "Test remittance"
        )
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Remittance Completion", function () {
    beforeEach(async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
      
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        amount,
        exchangeRate,
        "Test remittance"
      );
    });

    it("Should complete remittance successfully", async function () {
      const initialBalance = await cusdToken.balanceOf(user2.address);
      
      await expect(
        remittanceContract.connect(user2).completeRemittance(1)
      ).to.emit(remittanceContract, "RemittanceCompleted");

      const finalBalance = await cusdToken.balanceOf(user2.address);
      expect(finalBalance).to.equal(initialBalance.add(ethers.utils.parseEther("100")));

      const remittance = await remittanceContract.getRemittance(1);
      expect(remittance.status).to.equal(2); // Completed
    });

    it("Should not allow completion by unauthorized user", async function () {
      await expect(
        remittanceContract.connect(owner).completeRemittance(1)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Remittance Cancellation", function () {
    beforeEach(async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
      
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        amount,
        exchangeRate,
        "Test remittance"
      );
    });

    it("Should cancel remittance successfully", async function () {
      const initialBalance = await cusdToken.balanceOf(user1.address);
      
      await expect(
        remittanceContract.connect(user1).cancelRemittance(1)
      ).to.emit(remittanceContract, "RemittanceFailed");

      const finalBalance = await cusdToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance.add(ethers.utils.parseEther("100.5"))); // Amount + fee

      const remittance = await remittanceContract.getRemittance(1);
      expect(remittance.status).to.equal(4); // Cancelled
    });

    it("Should not allow cancellation by unauthorized user", async function () {
      await expect(
        remittanceContract.connect(user2).cancelRemittance(1)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Fee Management", function () {
    it("Should update fee percentage", async function () {
      await expect(
        remittanceContract.updateFeePercentage(100) // 1%
      ).to.emit(remittanceContract, "FeeUpdated");

      // Test with a remittance
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
      
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        amount,
        exchangeRate,
        "Test remittance"
      );

      const remittance = await remittanceContract.getRemittance(1);
      expect(remittance.fee).to.equal(ethers.utils.parseEther("1")); // 1% of 100
    });

    it("Should not allow fee percentage above maximum", async function () {
      await expect(
        remittanceContract.updateFeePercentage(600) // 6%
      ).to.be.revertedWith("Fee too high");
    });
  });

  describe("Token Management", function () {
    it("Should add supported token", async function () {
      await expect(
        remittanceContract.setSupportedToken(cusdToken.address, true)
      ).to.emit(remittanceContract, "TokenAdded");

      const supportedTokens = await remittanceContract.getSupportedTokens();
      expect(supportedTokens).to.include(cusdToken.address);
    });

    it("Should remove supported token", async function () {
      await remittanceContract.setSupportedToken(cusdToken.address, false);
      
      const isSupported = await remittanceContract.supportedTokens(cusdToken.address);
      expect(isSupported).to.be.false;
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause contract", async function () {
      await remittanceContract.pause();
      
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      
      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          ethers.utils.parseEther("100"),
          ethers.utils.parseEther("1"),
          "Test remittance"
        )
      ).to.be.revertedWith("Pausable: paused");

      await remittanceContract.unpause();
      
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
      
      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          ethers.utils.parseEther("100"),
          ethers.utils.parseEther("1"),
          "Test remittance"
        )
      ).to.emit(remittanceContract, "RemittanceCreated");
    });
  });
});
