const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Testing token approval and remittance creation on Sepolia...");
  
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
  const cusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  
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
    
    // Check cUSD token balance and approval
    console.log("\n🪙 Checking cUSD token details...");
    const cusdContract = await ethers.getContractAt("IERC20", cusdAddress);
    
    const cusdBalance = await cusdContract.balanceOf(deployer.address);
    console.log("cUSD Balance:", ethers.formatEther(cusdBalance), "cUSD");
    
    const currentAllowance = await cusdContract.allowance(deployer.address, remittanceAddress);
    console.log("Current allowance:", ethers.formatEther(currentAllowance), "cUSD");
    
    const isCusdSupported = await remittance.supportedTokens(cusdAddress);
    console.log("cUSD supported:", isCusdSupported);
    
    // Check if we have enough cUSD balance
    const remittanceAmount = ethers.parseEther("2"); // 2 cUSD
    if (cusdBalance < remittanceAmount) {
      console.log("❌ Insufficient cUSD balance for remittance");
      console.log("Required:", ethers.formatEther(remittanceAmount), "cUSD");
      console.log("Available:", ethers.formatEther(cusdBalance), "cUSD");
      return;
    }
    
    // Approve tokens if needed
    if (currentAllowance < remittanceAmount) {
      console.log("\n🔐 Approving cUSD tokens for RemittanceContract...");
      const approveTx = await cusdContract.approve(remittanceAddress, remittanceAmount);
      await approveTx.wait();
      console.log("✅ cUSD tokens approved");
      
      // Verify approval
      const newAllowance = await cusdContract.allowance(deployer.address, remittanceAddress);
      console.log("New allowance:", ethers.formatEther(newAllowance), "cUSD");
    } else {
      console.log("✅ Sufficient token allowance already exists");
    }
    
    // Test remittance creation with Uganda phone
    console.log("\n💸 Testing remittance creation...");
    
    const exchangeRate = ethers.parseEther("3700"); // 1 cUSD = 3700 UGX
    
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient (same as sender for testing)
      ugandaPhone,      // recipient phone
      cusdAddress,      // token
      remittanceAmount, // amount
      exchangeRate,     // exchange rate
      "Test remittance to Uganda - Sepolia with approval" // reference
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
    
    // Check final balances
    const finalCusdBalance = await cusdContract.balanceOf(deployer.address);
    console.log("\n💰 Final cUSD Balance:", ethers.formatEther(finalCusdBalance), "cUSD");
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Summary:");
    console.log("✅ Uganda phone number verified:", ugandaPhone);
    console.log("✅ User registered in RemittanceContract");
    console.log("✅ cUSD tokens approved for RemittanceContract");
    console.log("✅ Remittance created with Uganda phone on Sepolia");
    console.log("✅ Exchange rate set for Uganda Shilling (UGX)");
    console.log("✅ Token approval issue resolved");
    
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
