const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Testing remittance with proper fee calculation...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Contract addresses
  const phoneRegistryAddress = "0xF61C82188F0e4DF9082a703D8276647941b4E4f7";
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  const mockTokenAddress = "0x823c8333E17a9A06096F996725673246538EAf40";
  
  const phoneRegistry = await ethers.getContractAt("PhoneRegistry", phoneRegistryAddress);
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  const mockToken = await ethers.getContractAt("MockERC20", mockTokenAddress);
  
  // Uganda phone number
  const ugandaPhone = "+256752271548";
  
  try {
    // Check phone registration
    const ugandaAddress = await phoneRegistry.getAddressByPhone(ugandaPhone);
    console.log(`📍 Uganda phone ${ugandaPhone} -> ${ugandaAddress}`);
    
    if (ugandaAddress === "0x0000000000000000000000000000000000000000") {
      console.log("❌ Uganda phone not registered");
      return;
    }
    
    // Check user registration
    const userProfile = await remittance.userProfiles(deployer.address);
    if (userProfile.phoneNumber === "") {
      console.log("❌ User not registered in RemittanceContract");
      return;
    }
    
    console.log("✅ Phone and user registration verified");
    
    // Calculate proper amounts including fee
    const remittanceAmount = ethers.parseEther("100"); // 100 tcUSD
    const feePercentage = await remittance.feePercentage();
    const fee = (remittanceAmount * feePercentage) / 10000n;
    const totalAmount = remittanceAmount + fee;
    
    console.log("\n💰 Fee calculation:");
    console.log("Remittance amount:", ethers.formatEther(remittanceAmount), "tcUSD");
    console.log("Fee percentage:", ethers.formatEther(feePercentage), "%");
    console.log("Fee amount:", ethers.formatEther(fee), "tcUSD");
    console.log("Total amount needed:", ethers.formatEther(totalAmount), "tcUSD");
    
    // Check token balance
    const tokenBalance = await mockToken.balanceOf(deployer.address);
    console.log("Token balance:", ethers.formatEther(tokenBalance), "tcUSD");
    
    if (tokenBalance < totalAmount) {
      console.log("❌ Insufficient token balance");
      return;
    }
    
    // Approve the correct total amount (including fee)
    console.log("\n🔐 Approving tokens with proper fee calculation...");
    const currentAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
    console.log("Current allowance:", ethers.formatEther(currentAllowance), "tcUSD");
    
    if (currentAllowance < totalAmount) {
      const approveTx = await mockToken.approve(remittanceAddress, totalAmount);
      await approveTx.wait();
      console.log("✅ Approved tokens for total amount (including fee)");
      
      const newAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
      console.log("New allowance:", ethers.formatEther(newAllowance), "tcUSD");
    } else {
      console.log("✅ Sufficient allowance already exists");
    }
    
    // Create remittance
    console.log("\n💸 Creating remittance with proper fee calculation...");
    
    const exchangeRate = ethers.parseEther("3700"); // 1 tcUSD = 3700 UGX
    
    console.log("📤 Sending remittance:");
    console.log("  Amount:", ethers.formatEther(remittanceAmount), "tcUSD");
    console.log("  Fee:", ethers.formatEther(fee), "tcUSD");
    console.log("  Total:", ethers.formatEther(totalAmount), "tcUSD");
    console.log("  To:", ugandaPhone);
    console.log("  Exchange rate: 1 tcUSD =", ethers.formatEther(exchangeRate), "UGX");
    
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient
      ugandaPhone,      // recipient phone
      mockTokenAddress, // token
      remittanceAmount, // amount (without fee)
      exchangeRate,     // exchange rate
      "Test remittance with proper fee calculation" // reference
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
    console.log("  Amount:", ethers.formatEther(remittanceData.amount), "tcUSD");
    console.log("  Fee:", ethers.formatEther(remittanceData.fee), "tcUSD");
    console.log("  Exchange Rate:", ethers.formatEther(remittanceData.exchangeRate), "UGX per tcUSD");
    console.log("  Reference:", remittanceData.reference);
    console.log("  Status:", remittanceData.status.toString());
    console.log("  KYC Verified:", remittanceData.isKycVerified);
    
    // Check final balances
    const finalTokenBalance = await mockToken.balanceOf(deployer.address);
    const contractBalance = await mockToken.balanceOf(remittanceAddress);
    
    console.log("\n💰 Final balances:");
    console.log("Deployer balance:", ethers.formatEther(finalTokenBalance), "tcUSD");
    console.log("Contract balance:", ethers.formatEther(contractBalance), "tcUSD");
    
    console.log("\n🎉 SUCCESS! Remittance creation working perfectly!");
    console.log("\n📊 Summary:");
    console.log("✅ Fee calculation issue resolved");
    console.log("✅ Proper token approval implemented");
    console.log("✅ Remittance creation successful");
    console.log("✅ Uganda phone number working");
    console.log("✅ Full remittance flow operational");
    
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
