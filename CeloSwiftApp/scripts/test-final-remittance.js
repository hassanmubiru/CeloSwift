const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Final remittance test with mock token on Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 CELO balance:", ethers.formatEther(balance), "CELO");
  
  // Contract addresses
  const phoneRegistryAddress = "0xF61C82188F0e4DF9082a703D8276647941b4E4f7";
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  const mockTokenAddress = "0x823c8333E17a9A06096F996725673246538EAf40";
  
  const phoneRegistry = await ethers.getContractAt("PhoneRegistry", phoneRegistryAddress);
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  const mockToken = await ethers.getContractAt("MockERC20", mockTokenAddress);
  
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
    
    // Check mock token details
    console.log("\n🪙 Checking mock token details...");
    const tokenBalance = await mockToken.balanceOf(deployer.address);
    console.log("Mock token balance:", ethers.formatEther(tokenBalance), "tcUSD");
    
    const isTokenSupported = await remittance.supportedTokens(mockTokenAddress);
    console.log("Token supported:", isTokenSupported);
    
    if (!isTokenSupported) {
      console.log("❌ Mock token is not supported in RemittanceContract");
      return;
    }
    
    // Check if we have enough token balance
    const remittanceAmount = ethers.parseEther("100"); // 100 tcUSD
    if (tokenBalance < remittanceAmount) {
      console.log("❌ Insufficient token balance for remittance");
      console.log("Required:", ethers.formatEther(remittanceAmount), "tcUSD");
      console.log("Available:", ethers.formatEther(tokenBalance), "tcUSD");
      return;
    }
    
    // Approve tokens for remittance contract
    console.log("\n🔐 Approving tokens for RemittanceContract...");
    const currentAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
    console.log("Current allowance:", ethers.formatEther(currentAllowance), "tcUSD");
    
    if (currentAllowance < remittanceAmount) {
      const approveTx = await mockToken.approve(remittanceAddress, remittanceAmount);
      await approveTx.wait();
      console.log("✅ Tokens approved for RemittanceContract");
      
      // Verify approval
      const newAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
      console.log("New allowance:", ethers.formatEther(newAllowance), "tcUSD");
    } else {
      console.log("✅ Sufficient token allowance already exists");
    }
    
    // Test remittance creation
    console.log("\n💸 Creating remittance...");
    
    const exchangeRate = ethers.parseEther("3700"); // 1 tcUSD = 3700 UGX
    
    console.log("💰 Sending", ethers.formatEther(remittanceAmount), "tcUSD");
    console.log("📱 To Uganda phone:", ugandaPhone);
    console.log("💱 Exchange rate: 1 tcUSD =", ethers.formatEther(exchangeRate), "UGX");
    
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient (same as sender for testing)
      ugandaPhone,      // recipient phone
      mockTokenAddress, // mock token
      remittanceAmount, // amount
      exchangeRate,     // exchange rate
      "Final test remittance to Uganda - Sepolia" // reference
    );
    
    console.log("⏳ Waiting for transaction confirmation...");
    await remittanceTx.wait();
    console.log("✅ Remittance created successfully!");
    
    // Get remittance details
    const remittanceData = await remittance.getRemittance(0);
    console.log("\n📋 Remittance details:");
    console.log("  ID:", remittanceData.id.toString());
    console.log("  Sender:", remittanceData.sender);
    console.log("  Recipient Phone:", remittanceData.recipientPhone);
    console.log("  Token:", remittanceData.token);
    console.log("  Amount:", ethers.formatEther(remittanceData.amount), "tcUSD");
    console.log("  Exchange Rate:", ethers.formatEther(remittanceData.exchangeRate), "UGX per tcUSD");
    console.log("  Reference:", remittanceData.reference);
    console.log("  Status:", remittanceData.status.toString());
    console.log("  KYC Verified:", remittanceData.isKycVerified);
    
    // Check final balances
    const finalTokenBalance = await mockToken.balanceOf(deployer.address);
    console.log("\n💰 Final token balance:", ethers.formatEther(finalTokenBalance), "tcUSD");
    
    console.log("\n🎉 SUCCESS! All tests completed successfully!");
    console.log("\n📊 Final Summary:");
    console.log("✅ Uganda phone number verified:", ugandaPhone);
    console.log("✅ User registered in RemittanceContract");
    console.log("✅ Mock token deployed and configured");
    console.log("✅ Token approval completed");
    console.log("✅ Remittance created successfully");
    console.log("✅ Exchange rate set for Uganda Shilling (UGX)");
    console.log("✅ Full remittance flow working on Sepolia");
    
    console.log("\n🔗 Contract Addresses:");
    console.log("PhoneRegistry:", phoneRegistryAddress);
    console.log("KycAmlContract: 0x0982Cd8B1122bA2134BF44A137bE814708Fd821F");
    console.log("RemittanceContract:", remittanceAddress);
    console.log("MockERC20:", mockTokenAddress);
    
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
