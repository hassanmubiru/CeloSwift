const { ethers } = require("hardhat");

async function main() {
  console.log("💎 Testing CELO native token remittance on Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
  
  // Get contract instances
  const phoneRegistryAddress = "0xF61C82188F0e4DF9082a703D8276647941b4E4f7";
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  
  const phoneRegistry = await ethers.getContractAt("PhoneRegistry", phoneRegistryAddress);
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  
  // Uganda phone number
  const ugandaPhone = "+256752271548";
  
  console.log("\n📱 Checking phone registration...");
  
  try {
    // Check if Uganda phone is already registered
    const ugandaAddress = await phoneRegistry.getAddressByPhone(ugandaPhone);
    console.log(`📍 Uganda phone ${ugandaPhone} -> ${ugandaAddress}`);
    
    if (ugandaAddress !== "0x0000000000000000000000000000000000000000") {
      console.log("✅ Uganda phone is already registered in PhoneRegistry");
    } else {
      console.log("❌ Uganda phone is not registered in PhoneRegistry");
      return;
    }
    
    // Check if user is registered in RemittanceContract
    console.log("\n📋 Checking user registration in RemittanceContract...");
    const userProfile = await remittance.userProfiles(deployer.address);
    console.log("User profile phone:", userProfile.phoneNumber);
    console.log("User profile name:", userProfile.name);
    console.log("User profile KYC verified:", userProfile.isKycVerified);
    
    if (userProfile.phoneNumber === "") {
      console.log("📝 Registering user in RemittanceContract...");
      const registerTx = await remittance.registerUser(ugandaPhone, "Uganda User");
      await registerTx.wait();
      console.log("✅ User registered in RemittanceContract");
    } else {
      console.log("✅ User already registered in RemittanceContract");
    }
    
    // Test remittance creation with CELO (native token)
    console.log("\n💸 Testing remittance creation with CELO...");
    
    // Use zero address for native CELO token
    const celoTokenAddress = "0x0000000000000000000000000000000000000000";
    const remittanceAmount = ethers.parseEther("0.1"); // 0.1 CELO
    const exchangeRate = ethers.parseEther("3700"); // 1 CELO = 3700 UGX (example rate)
    
    // Check if we have enough CELO balance
    if (balance < remittanceAmount) {
      console.log("❌ Insufficient CELO balance for remittance");
      console.log("Required:", ethers.formatEther(remittanceAmount), "CELO");
      console.log("Available:", ethers.formatEther(balance), "CELO");
      return;
    }
    
    console.log("💰 Sending", ethers.formatEther(remittanceAmount), "CELO");
    console.log("📱 To Uganda phone:", ugandaPhone);
    console.log("💱 Exchange rate: 1 CELO =", ethers.formatEther(exchangeRate), "UGX");
    
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient (same as sender for testing)
      ugandaPhone,      // recipient phone
      celoTokenAddress, // native CELO token (zero address)
      remittanceAmount, // amount
      exchangeRate,     // exchange rate
      "Test CELO remittance to Uganda - Sepolia" // reference
    );
    
    console.log("⏳ Waiting for transaction confirmation...");
    await remittanceTx.wait();
    console.log("✅ Remittance created successfully");
    
    // Get remittance details
    const remittanceData = await remittance.getRemittance(0);
    console.log("📋 Remittance details:");
    console.log("  ID:", remittanceData.id.toString());
    console.log("  Sender:", remittanceData.sender);
    console.log("  Recipient Phone:", remittanceData.recipientPhone);
    console.log("  Token:", remittanceData.token);
    console.log("  Amount:", ethers.formatEther(remittanceData.amount), "CELO");
    console.log("  Exchange Rate:", ethers.formatEther(remittanceData.exchangeRate), "UGX per CELO");
    console.log("  Reference:", remittanceData.reference);
    console.log("  Status:", remittanceData.status.toString());
    console.log("  KYC Verified:", remittanceData.isKycVerified);
    
    // Check final balance
    const finalBalance = await deployer.provider.getBalance(deployer.address);
    console.log("\n💰 Final CELO Balance:", ethers.formatEther(finalBalance), "CELO");
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Uganda phone number verified:", ugandaPhone);
    console.log("✅ User registered in RemittanceContract");
    console.log("✅ CELO remittance created successfully");
    console.log("✅ Exchange rate set for Uganda Shilling (UGX)");
    console.log("✅ Native token (CELO) remittance working");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
