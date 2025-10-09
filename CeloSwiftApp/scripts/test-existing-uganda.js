const { ethers } = require("hardhat");

async function main() {
  console.log("🇺🇬 Testing CeloSwift with existing Uganda phone number...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
  
  // Get contract instances
  const phoneRegistryAddress = "0xF61C82188F0e4DF9082a703D8276647941b4E4f7";
  const kycAmlAddress = "0x0982Cd8B1122bA2134BF44A137bE814708Fd821F";
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  
  const phoneRegistry = await ethers.getContractAt("PhoneRegistry", phoneRegistryAddress);
  const kycAml = await ethers.getContractAt("KycAmlContract", kycAmlAddress);
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  
  // Uganda phone number
  const ugandaPhone = "+256752271548";
  
  console.log("\n📱 Checking existing phone registrations...");
  
  try {
    // Check if Uganda phone is already registered
    const ugandaAddress = await phoneRegistry.getAddressByPhone(ugandaPhone);
    console.log(`📍 Uganda phone ${ugandaPhone} -> ${ugandaAddress}`);
    
    if (ugandaAddress !== "0x0000000000000000000000000000000000000000") {
      console.log("✅ Uganda phone is already registered");
    } else {
      console.log("❌ Uganda phone is not registered");
    }
    
    // Check KYC status
    console.log("\n🔐 Checking KYC status...");
    const kycStatus = await kycAml.isKycVerified(deployer.address);
    console.log("🔍 KYC Verified:", kycStatus);
    
    // Test remittance creation with Uganda phone
    console.log("\n💸 Testing remittance creation...");
    
    const cusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    const amount = ethers.parseEther("5"); // 5 cUSD
    const exchangeRate = ethers.parseEther("3700"); // 1 cUSD = 3700 UGX
    
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient (same as sender for testing)
      ugandaPhone,      // recipient phone
      cusdAddress,      // token
      amount,           // amount
      exchangeRate,     // exchange rate
      "Test remittance to Uganda - Sepolia" // reference
    );
    await remittanceTx.wait();
    console.log("✅ Remittance created successfully");
    
    // Get remittance details
    const remittanceData = await remittance.getRemittance(0);
    console.log("📋 Remittance details:");
    console.log("  ID:", remittanceData.id.toString());
    console.log("  Sender:", remittanceData.sender);
    console.log("  Recipient Phone:", remittanceData.recipientPhone);
    console.log("  Amount:", ethers.formatEther(remittanceData.amount), "cUSD");
    console.log("  Exchange Rate:", ethers.formatEther(remittanceData.exchangeRate), "UGX per cUSD");
    console.log("  Reference:", remittanceData.reference);
    console.log("  Status:", remittanceData.status.toString());
    console.log("  KYC Verified:", remittanceData.isKycVerified);
    
    console.log("\n🎉 Test completed successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Uganda phone number verified:", ugandaPhone);
    console.log("✅ KYC status checked");
    console.log("✅ Remittance created with Uganda phone on Sepolia");
    console.log("✅ Exchange rate set for Uganda Shilling (UGX)");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
