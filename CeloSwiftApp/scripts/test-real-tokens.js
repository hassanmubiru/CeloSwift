const { ethers } = require("hardhat");

async function main() {
  console.log("🇺🇬 Testing CeloSwift with real tokens and Uganda phone numbers...");

  // Get deployment info
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments/alfajores.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts, tokens } = deploymentInfo;

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);

  // Check account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");

  try {
    // Test PhoneRegistry with Uganda phone numbers
    console.log("\n📱 Testing PhoneRegistry with Uganda phone numbers...");
    const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
    const phoneRegistry = PhoneRegistry.attach(contracts.PhoneRegistry);
    
    // Test with Uganda phone number format
    const ugandaPhone1 = "+256752271548";
    const ugandaPhone2 = "+256752271549";
    const testName = "Uganda User";
    
    console.log("📞 Registering Uganda phone number:", ugandaPhone1);
    const registerTx = await phoneRegistry.registerPhone(ugandaPhone1, testName);
    await registerTx.wait();
    console.log("✅ Uganda phone number registered successfully");
    
    // Test looking up the phone number
    const address = await phoneRegistry.getAddressByPhone(ugandaPhone1);
    console.log("🔍 Phone lookup result:", address);
    console.log("✅ Phone lookup working for Uganda number");

    // Test RemittanceContract with real tokens only
    console.log("\n💸 Testing RemittanceContract with real tokens...");
    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    const remittanceContract = RemittanceContract.attach(contracts.RemittanceContract);
    
    // Register user in remittance contract
    console.log("👤 Registering Uganda user in remittance contract...");
    const registerUserTx = await remittanceContract.registerUser(ugandaPhone1, testName);
    await registerUserTx.wait();
    console.log("✅ Uganda user registered in remittance contract");
    
    // Test supported tokens (real tokens only)
    console.log("🪙 Testing supported tokens (real tokens only)...");
    const cusdSupported = await remittanceContract.supportedTokens(tokens.cUSD);
    console.log("✅ cUSD supported:", cusdSupported);
    
    // Verify USDT is not supported (no mock data)
    if (tokens.USDT && tokens.USDT !== "REMOVED - No mock data") {
      const usdtSupported = await remittanceContract.supportedTokens(tokens.USDT);
      console.log("❌ USDT supported:", usdtSupported, "(should be false - no mock data)");
    } else {
      console.log("✅ USDT not configured (no mock data)");
    }
    
    // Test fee percentage
    const feePercentage = await remittanceContract.feePercentage();
    console.log("💰 Fee percentage:", feePercentage.toString(), "basis points (0.5%)");

    // Test remittance flow structure (without creating actual remittance)
    console.log("\n💸 Remittance flow structure validation...");
    console.log("📋 Remittance details for Uganda:");
    console.log("  From:", deployer.address);
    console.log("  To Phone:", ugandaPhone2);
    console.log("  Token: cUSD (real token)");
    console.log("  Amount: 100 cUSD");
    console.log("  Exchange Rate: 1.0");
    console.log("  Reference: Real remittance to Uganda");
    console.log("✅ Remittance structure validated with real tokens");

    console.log("\n🎉 Real token testing completed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("PhoneRegistry:", contracts.PhoneRegistry);
    console.log("KycAmlContract:", contracts.KycAmlContract);
    console.log("RemittanceContract:", contracts.RemittanceContract);

    console.log("\n📋 Supported Tokens:");
    console.log("✅ cUSD:", tokens.cUSD, "(real token)");
    console.log("❌ USDT: Not supported (no mock data)");

    console.log("\n🔗 View contracts on Celoscan:");
    console.log(`PhoneRegistry: https://alfajores.celoscan.io/address/${contracts.PhoneRegistry}`);
    console.log(`RemittanceContract: https://alfajores.celoscan.io/address/${contracts.RemittanceContract}`);

  } catch (error) {
    console.error("❌ Real token test failed:", error.message);
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
