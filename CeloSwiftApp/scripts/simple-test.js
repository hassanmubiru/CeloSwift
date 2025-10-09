const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Simple CeloSwift Contract Test...");

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
    // Test PhoneRegistry - Read operations
    console.log("\n📱 Testing PhoneRegistry...");
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    const phoneRegistry = PhoneRegistry.attach(contracts.PhoneRegistry);
    
    // Test looking up existing phone number
    const testPhone = "+1234567890";
    console.log("🔍 Looking up phone number:", testPhone);
    const address = await phoneRegistry.getAddressByPhone(testPhone);
    console.log("📞 Phone lookup result:", address);
    console.log("✅ PhoneRegistry working");

    // Test KycAmlContract - Read operations
    console.log("\n🔐 Testing KycAmlContract...");
    const KycAmlContract = await ethers.getContractFactory("KycAmlContract");
    const kycAmlContract = KycAmlContract.attach(contracts.KycAmlContract);
    
    // Test getting KYC record
    console.log("📄 Checking KYC record...");
    const kycRecord = await kycAmlContract.getKycRecord(deployer.address);
    console.log("📋 KYC Record Status:", kycRecord.status);
    console.log("📋 KYC Record Country:", kycRecord.country);
    console.log("📋 KYC Record Document Type:", kycRecord.documentType);
    
    // Test KYC verification check
    const isKycVerified = await kycAmlContract.isKycVerified(deployer.address);
    console.log("✅ KYC Verified:", isKycVerified);
    console.log("✅ KycAmlContract working");

    // Test RemittanceContract - Read operations
    console.log("\n💸 Testing RemittanceContract...");
    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    const remittanceContract = RemittanceContract.attach(contracts.RemittanceContract);
    
    // Test getting supported tokens
    const cusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    const isSupported = await remittanceContract.supportedTokens(cusdAddress);
    console.log("🪙 cUSD supported:", isSupported);
    
    // Test getting fee percentage
    const feePercentage = await remittanceContract.feePercentage();
    console.log("💰 Fee percentage:", feePercentage.toString(), "basis points (0.5%)");
    
    // Test getting remittance counter
    const remittanceCounter = await remittanceContract.remittanceCounter();
    console.log("📊 Remittance counter:", remittanceCounter.toString());
    
    console.log("✅ RemittanceContract working");

    console.log("\n🎉 All contract read tests passed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("PhoneRegistry:", contracts.PhoneRegistry);
    console.log("KycAmlContract:", contracts.KycAmlContract);
    console.log("RemittanceContract:", contracts.RemittanceContract);

    console.log("\n🔗 View contracts on Celoscan:");
    console.log(`PhoneRegistry: https://alfajores.celoscan.io/address/${contracts.PhoneRegistry}`);
    console.log(`KycAmlContract: https://alfajores.celoscan.io/address/${contracts.KycAmlContract}`);
    console.log(`RemittanceContract: https://alfajores.celoscan.io/address/${contracts.RemittanceContract}`);

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
