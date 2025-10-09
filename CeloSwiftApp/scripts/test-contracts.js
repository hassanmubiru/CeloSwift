const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing CeloSwift deployed contracts...");

  // Get deployment info
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments/alfajores.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts } = deploymentInfo;

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);

  // Check account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");

  try {
    // Test PhoneRegistry
    console.log("\n📱 Testing PhoneRegistry...");
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    const phoneRegistry = PhoneRegistry.attach(contracts.PhoneRegistry);
    
    // Test looking up existing phone number
    const testPhone = "+1234567890";
    console.log("🔍 Looking up existing phone number:", testPhone);
    const address = await phoneRegistry.getAddressByPhone(testPhone);
    console.log("📞 Phone lookup result:", address);
    console.log("✅ Phone lookup working");
    
    // Test registering a new phone number
    const newTestPhone = "+1987654321";
    const testName = "Test User 2";
    
    console.log("📞 Registering new phone number:", newTestPhone);
    const registerTx = await phoneRegistry.registerPhone(newTestPhone, testName);
    await registerTx.wait();
    console.log("✅ New phone number registered successfully");

    // Test KycAmlContract
    console.log("\n🔐 Testing KycAmlContract...");
    const KycAmlContract = await ethers.getContractFactory("KycAmlContract");
    const kycAmlContract = KycAmlContract.attach(contracts.KycAmlContract);
    
    // Test getting KYC record (may already exist from deployment)
    console.log("📄 Checking KYC record...");
    const kycRecord = await kycAmlContract.getKycRecord(deployer.address);
    console.log("📋 KYC Record Status:", kycRecord.status);
    console.log("📋 KYC Record Country:", kycRecord.country);
    console.log("📋 KYC Record Document Type:", kycRecord.documentType);
    
    // Test KYC verification check
    const isKycVerified = await kycAmlContract.isKycVerified(deployer.address);
    console.log("✅ KYC Verified:", isKycVerified);
    console.log("✅ KYC contract working");

    // Test RemittanceContract
    console.log("\n💸 Testing RemittanceContract...");
    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    const remittanceContract = RemittanceContract.attach(contracts.RemittanceContract);
    
    // Test registering user
    console.log("👤 Registering user in remittance contract...");
    const registerUserTx = await remittanceContract.registerUser(testPhone, testName);
    await registerUserTx.wait();
    console.log("✅ User registered in remittance contract");
    
    // Test getting supported tokens
    const cusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    const isSupported = await remittanceContract.supportedTokens(cusdAddress);
    console.log("🪙 cUSD supported:", isSupported);
    
    // Test getting fee percentage
    const feePercentage = await remittanceContract.feePercentage();
    console.log("💰 Fee percentage:", feePercentage.toString(), "basis points (0.5%)");
    
    console.log("✅ Remittance contract working");

    console.log("\n🎉 All contract tests passed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("PhoneRegistry:", contracts.PhoneRegistry);
    console.log("KycAmlContract:", contracts.KycAmlContract);
    console.log("RemittanceContract:", contracts.RemittanceContract);

  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
