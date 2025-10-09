const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CeloSwift Integration Tests", function () {
  let remittanceContract;
  let phoneRegistry;
  let kycAmlContract;
  let cusdToken;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    cusdToken = await MockERC20.deploy("Celo USD", "cUSD", ethers.utils.parseEther("1000000"));

    // Deploy contracts
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    phoneRegistry = await PhoneRegistry.deploy();

    const KycAmlContract = await ethers.getContractFactory("KycAmlContract");
    kycAmlContract = await KycAmlContract.deploy();

    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    remittanceContract = await RemittanceContract.deploy();

    // Configure supported tokens
    await remittanceContract.setSupportedToken(cusdToken.address, true);

    // Mint tokens to users
    await cusdToken.mint(user1.address, ethers.utils.parseEther("1000"));
    await cusdToken.mint(user2.address, ethers.utils.parseEther("1000"));
    await cusdToken.mint(user3.address, ethers.utils.parseEther("1000"));

    // Approve tokens for remittance contract
    await cusdToken.connect(user1).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
    await cusdToken.connect(user2).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
    await cusdToken.connect(user3).approve(remittanceContract.address, ethers.utils.parseEther("1000"));
  });

  describe("Complete Remittance Flow", function () {
    it("Should complete a full remittance flow from registration to completion", async function () {
      // Step 1: Register users with phone numbers
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
      await remittanceContract.connect(user3).registerUser("+1122334455", "Charlie");

      // Verify user registration
      const user1Profile = await remittanceContract.getUserProfile(user1.address);
      expect(user1Profile.phoneNumber).to.equal("+1234567890");
      expect(user1Profile.name).to.equal("Alice");

      // Step 2: Complete KYC verification for users
      await kycAmlContract.verifyKyc(user1.address, true);
      await kycAmlContract.verifyKyc(user2.address, true);

      // Verify KYC status
      const isUser1KycVerified = await kycAmlContract.isKycVerified(user1.address);
      expect(isUser1KycVerified).to.be.true;

      // Step 3: Create remittance from Alice to Bob
      const amount = ethers.utils.parseEther("100");
      const exchangeRate = ethers.utils.parseEther("1");
      const reference = "Test remittance";

      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          amount,
          exchangeRate,
          reference
        )
      ).to.emit(remittanceContract, "RemittanceCreated");

      // Verify remittance creation
      const remittance = await remittanceContract.getRemittance(1);
      expect(remittance.sender).to.equal(user1.address);
      expect(remittance.recipient).to.equal(user2.address);
      expect(remittance.amount).to.equal(amount);
      expect(remittance.status).to.equal(0); // Pending

      // Step 4: Complete remittance
      await expect(
        remittanceContract.connect(user2).completeRemittance(1)
      ).to.emit(remittanceContract, "RemittanceCompleted");

      // Verify remittance completion
      const completedRemittance = await remittanceContract.getRemittance(1);
      expect(completedRemittance.status).to.equal(2); // Completed

      // Verify token balances
      const user2Balance = await cusdToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(ethers.utils.parseEther("1100")); // 1000 + 100

      // Step 5: Verify user statistics
      const user1UpdatedProfile = await remittanceContract.getUserProfile(user1.address);
      const user2UpdatedProfile = await remittanceContract.getUserProfile(user2.address);

      expect(user1UpdatedProfile.totalSent).to.equal(amount);
      expect(user1UpdatedProfile.transactionCount).to.equal(1);
      expect(user2UpdatedProfile.totalReceived).to.equal(amount);
      expect(user2UpdatedProfile.transactionCount).to.equal(1);
    });

    it("Should handle multiple remittances between different users", async function () {
      // Register all users
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");
      await remittanceContract.connect(user3).registerUser("+1122334455", "Charlie");

      // Create multiple remittances
      const amount1 = ethers.utils.parseEther("50");
      const amount2 = ethers.utils.parseEther("75");
      const amount3 = ethers.utils.parseEther("25");

      // Alice sends to Bob
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        amount1,
        ethers.utils.parseEther("1"),
        "Payment 1"
      );

      // Bob sends to Charlie
      await remittanceContract.connect(user2).createRemittance(
        user3.address,
        "+1122334455",
        cusdToken.address,
        amount2,
        ethers.utils.parseEther("1"),
        "Payment 2"
      );

      // Charlie sends to Alice
      await remittanceContract.connect(user3).createRemittance(
        user1.address,
        "+1234567890",
        cusdToken.address,
        amount3,
        ethers.utils.parseEther("1"),
        "Payment 3"
      );

      // Complete all remittances
      await remittanceContract.connect(user2).completeRemittance(1);
      await remittanceContract.connect(user3).completeRemittance(2);
      await remittanceContract.connect(user1).completeRemittance(3);

      // Verify final balances
      const user1Balance = await cusdToken.balanceOf(user1.address);
      const user2Balance = await cusdToken.balanceOf(user2.address);
      const user3Balance = await cusdToken.balanceOf(user3.address);

      // Alice: 1000 - 50 (sent) + 25 (received) = 975
      expect(user1Balance).to.equal(ethers.utils.parseEther("975"));
      
      // Bob: 1000 + 50 (received) - 75 (sent) = 975
      expect(user2Balance).to.equal(ethers.utils.parseEther("975"));
      
      // Charlie: 1000 + 75 (received) - 25 (sent) = 1050
      expect(user3Balance).to.equal(ethers.utils.parseEther("1050"));
    });

    it("Should handle remittance cancellation", async function () {
      // Register users
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      const amount = ethers.utils.parseEther("100");
      const initialBalance = await cusdToken.balanceOf(user1.address);

      // Create remittance
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        amount,
        ethers.utils.parseEther("1"),
        "Cancelled payment"
      );

      // Cancel remittance
      await expect(
        remittanceContract.connect(user1).cancelRemittance(1)
      ).to.emit(remittanceContract, "RemittanceFailed");

      // Verify refund
      const finalBalance = await cusdToken.balanceOf(user1.address);
      const fee = await remittanceContract.feePercentage();
      const expectedRefund = amount.add(amount.mul(fee).div(10000));
      
      expect(finalBalance).to.equal(initialBalance.sub(expectedRefund).add(expectedRefund));
    });

    it("Should enforce KYC requirements for large amounts", async function () {
      // Register users
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      // Verify KYC requirement for large amount
      const largeAmount = ethers.utils.parseEther("1000");
      const requiresKyc = await kycAmlContract.requiresKyc(largeAmount);
      expect(requiresKyc).to.be.true;

      // Create remittance with large amount (should work but mark as non-KYC)
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        largeAmount,
        ethers.utils.parseEther("1"),
        "Large payment"
      );

      const remittance = await remittanceContract.getRemittance(1);
      expect(remittance.isKycVerified).to.be.false;
    });

    it("Should handle phone number lookup and validation", async function () {
      // Register users with phone numbers
      await phoneRegistry.connect(user1).registerPhone("+1234567890", "Alice");
      await phoneRegistry.connect(user2).registerPhone("+0987654321", "Bob");

      // Test phone number lookup
      const aliceAddress = await phoneRegistry.getAddressByPhone("+1234567890");
      const bobAddress = await phoneRegistry.getAddressByPhone("+0987654321");

      expect(aliceAddress).to.equal(user1.address);
      expect(bobAddress).to.equal(user2.address);

      // Test phone verification
      await phoneRegistry.connect(user1).requestVerification("+1234567890");
      const verificationRequest = await phoneRegistry.getVerificationRequest("+1234567890");
      
      expect(verificationRequest.requester).to.equal(user1.address);
      expect(verificationRequest.isVerified).to.be.false;
    });

    it("Should handle fee collection and distribution", async function () {
      // Register users
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      const amount = ethers.utils.parseEther("100");
      const initialOwnerBalance = await cusdToken.balanceOf(owner.address);

      // Create and complete remittance
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        amount,
        ethers.utils.parseEther("1"),
        "Fee test"
      );

      await remittanceContract.connect(user2).completeRemittance(1);

      // Verify fee collection
      const finalOwnerBalance = await cusdToken.balanceOf(owner.address);
      const fee = await remittanceContract.feePercentage();
      const expectedFee = amount.mul(fee).div(10000);
      
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(expectedFee));
    });

    it("Should handle contract pause and unpause", async function () {
      // Register users
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      // Pause contract
      await remittanceContract.pause();

      // Try to create remittance (should fail)
      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          ethers.utils.parseEther("100"),
          ethers.utils.parseEther("1"),
          "Paused test"
        )
      ).to.be.revertedWith("Pausable: paused");

      // Unpause contract
      await remittanceContract.unpause();

      // Create remittance (should succeed)
      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          ethers.utils.parseEther("100"),
          ethers.utils.parseEther("1"),
          "Unpaused test"
        )
      ).to.emit(remittanceContract, "RemittanceCreated");
    });

    it("Should handle emergency scenarios", async function () {
      // Register users
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      // Create remittance
      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("1"),
        "Emergency test"
      );

      // Emergency deactivate phone (only owner can do this)
      await phoneRegistry.emergencyDeactivatePhone("+0987654321");
      
      const phoneRecord = await phoneRegistry.getPhoneRecord("+0987654321");
      expect(phoneRecord.isActive).to.be.false;

      // Suspend KYC
      await kycAmlContract.suspendKyc(user1.address);
      
      const kycRecord = await kycAmlContract.getKycRecord(user1.address);
      expect(kycRecord.status).to.equal(3); // Suspended
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should handle invalid phone numbers", async function () {
      await expect(
        remittanceContract.connect(user1).registerUser("", "Alice")
      ).to.be.revertedWith("Phone number required");

      await expect(
        remittanceContract.connect(user1).registerUser("invalid", "Alice")
      ).to.be.revertedWith("Phone number required");
    });

    it("Should handle insufficient token balance", async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      const largeAmount = ethers.utils.parseEther("2000"); // More than user1's balance

      await expect(
        remittanceContract.connect(user1).createRemittance(
          user2.address,
          "+0987654321",
          cusdToken.address,
          largeAmount,
          ethers.utils.parseEther("1"),
          "Insufficient balance test"
        )
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle unauthorized access", async function () {
      await remittanceContract.connect(user1).registerUser("+1234567890", "Alice");
      await remittanceContract.connect(user2).registerUser("+0987654321", "Bob");

      await remittanceContract.connect(user1).createRemittance(
        user2.address,
        "+0987654321",
        cusdToken.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("1"),
        "Unauthorized test"
      );

      // Try to complete remittance with wrong user
      await expect(
        remittanceContract.connect(user3).completeRemittance(1)
      ).to.be.revertedWith("Unauthorized");
    });

    it("Should handle contract upgrades and configuration changes", async function () {
      // Update fee percentage
      await remittanceContract.updateFeePercentage(100); // 1%
      
      const newFee = await remittanceContract.feePercentage();
      expect(newFee).to.equal(100);

      // Add new supported token
      const newToken = await ethers.getContractFactory("MockERC20");
      const usdtToken = await newToken.deploy("Tether USD", "USDT", ethers.utils.parseEther("1000000"));
      
      await remittanceContract.setSupportedToken(usdtToken.address, true);
      
      const isSupported = await remittanceContract.supportedTokens(usdtToken.address);
      expect(isSupported).to.be.true;
    });
  });
});
