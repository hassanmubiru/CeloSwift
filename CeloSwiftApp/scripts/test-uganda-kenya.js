const { ethers } = require("hardhat");

async function main() {
  console.log("🇺🇬🇰🇪 Testing CeloSwift with Uganda and Kenya phone numbers...");
  
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
  
  // Uganda and Kenya phone numbers
  const ugandaPhone = "+256752271548"; // Uganda mobile format
  const kenyaPhone = "+254712345678";  // Kenya mobile format
  
  console.log("\n📱 Testing PhoneRegistry with Uganda and Kenya numbers...");
  
  try {
    // Register Uganda phone number
    console.log(`📞 Registering Uganda phone: ${ugandaPhone}`);
    const ugandaTx = await phoneRegistry.registerPhone(ugandaPhone, "Uganda User");
    await ugandaTx.wait();
    console.log("✅ Uganda phone registered successfully");
    
    // Register Kenya phone number
    console.log(`📞 Registering Kenya phone: ${kenyaPhone}`);
    const kenyaTx = await phoneRegistry.registerPhone(kenyaPhone, "Kenya User");
    await kenyaTx.wait();
    console.log("✅ Kenya phone registered successfully");
    
    // Verify registrations
    const ugandaAddress = await phoneRegistry.getAddressByPhone(ugandaPhone);
    const kenyaAddress = await phoneRegistry.getAddressByPhone(kenyaPhone);
    
    console.log(`📍 Uganda phone ${ugandaPhone} -> ${ugandaAddress}`);
    console.log(`📍 Kenya phone ${kenyaPhone} -> ${kenyaAddress}`);
    
    // Test KYC verification
    console.log("\n🔐 Testing KYC verification...");
    
    const kycTx = await kycAml.verifyUser(
      deployer.address,
      "John Doe",
      "1234567890",
      "Uganda",
      "Kampala",
      "Kampala Central",
      "Nakawa Division",
      "Makerere University",
      "Software Engineer",
      "john.doe@example.com",
      ugandaPhone
    );
    await kycTx.wait();
    console.log("✅ KYC verification completed");
    
    // Check KYC status
    const kycStatus = await kycAml.getUserKycStatus(deployer.address);
    console.log("🔍 KYC Status:", kycStatus);
    
    // Test remittance creation with Uganda phone
    console.log("\n💸 Testing remittance creation...");
    
    const cusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    const amount = ethers.parseEther("10"); // 10 cUSD
    const exchangeRate = ethers.parseEther("3700"); // 1 cUSD = 3700 UGX
    
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient (same as sender for testing)
      ugandaPhone,      // recipient phone
      cusdAddress,      // token
      amount,           // amount
      exchangeRate,     // exchange rate
      "Test remittance to Uganda" // reference
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
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Uganda phone number registered:", ugandaPhone);
    console.log("✅ Kenya phone number registered:", kenyaPhone);
    console.log("✅ KYC verification completed");
    console.log("✅ Remittance created with Uganda phone");
    
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
