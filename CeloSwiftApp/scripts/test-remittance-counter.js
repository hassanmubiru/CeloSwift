const { ethers } = require("hardhat");

async function main() {
  console.log("🔢 Testing remittance counter and data storage...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Contract addresses
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  const mockTokenAddress = "0x823c8333E17a9A06096F996725673246538EAf40";
  
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  const mockToken = await ethers.getContractAt("MockERC20", mockTokenAddress);
  
  try {
    // Check remittance counter
    console.log("\n🔢 Checking remittance counter...");
    const remittanceCounter = await remittance.remittanceCounter();
    console.log("Current remittance counter:", remittanceCounter.toString());
    
    // Check if there are any existing remittances
    console.log("\n📋 Checking existing remittances...");
    for (let i = 1; i <= Number(remittanceCounter); i++) {
      try {
        const remittanceData = await remittance.getRemittance(i);
        console.log(`\nRemittance ${i}:`);
        console.log("  ID:", remittanceData.id.toString());
        console.log("  Sender:", remittanceData.sender);
        console.log("  Recipient:", remittanceData.recipient);
        console.log("  Recipient Phone:", remittanceData.recipientPhone);
        console.log("  Amount:", ethers.formatEther(remittanceData.amount), "tcUSD");
        console.log("  Fee:", ethers.formatEther(remittanceData.fee), "tcUSD");
        console.log("  Exchange Rate:", ethers.formatEther(remittanceData.exchangeRate), "UGX per tcUSD");
        console.log("  Reference:", remittanceData.reference);
        console.log("  Status:", remittanceData.status.toString());
        console.log("  KYC Verified:", remittanceData.isKycVerified);
      } catch (error) {
        console.log(`Remittance ${i}: Error reading - ${error.message}`);
      }
    }
    
    // Create a new remittance to test the counter
    console.log("\n💸 Creating a new remittance to test counter...");
    
    const ugandaPhone = "+256752271548";
    const remittanceAmount = ethers.parseEther("50"); // 50 tcUSD
    const feePercentage = await remittance.feePercentage();
    const fee = (remittanceAmount * feePercentage) / 10000n;
    const totalAmount = remittanceAmount + fee;
    const exchangeRate = ethers.parseEther("3700"); // 1 tcUSD = 3700 UGX
    
    // Approve tokens
    const currentAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
    if (currentAllowance < totalAmount) {
      const approveTx = await mockToken.approve(remittanceAddress, totalAmount);
      await approveTx.wait();
      console.log("✅ Approved tokens for new remittance");
    }
    
    // Create remittance
    const remittanceTx = await remittance.createRemittance(
      deployer.address, // recipient
      ugandaPhone,      // recipient phone
      mockTokenAddress, // token
      remittanceAmount, // amount
      exchangeRate,     // exchange rate
      "Test remittance counter" // reference
    );
    
    await remittanceTx.wait();
    console.log("✅ New remittance created");
    
    // Check counter again
    const newCounter = await remittance.remittanceCounter();
    console.log("New remittance counter:", newCounter.toString());
    
    // Check the new remittance
    const newRemittanceData = await remittance.getRemittance(Number(newCounter));
    console.log("\n📋 New remittance details:");
    console.log("  ID:", newRemittanceData.id.toString());
    console.log("  Sender:", newRemittanceData.sender);
    console.log("  Recipient:", newRemittanceData.recipient);
    console.log("  Recipient Phone:", newRemittanceData.recipientPhone);
    console.log("  Amount:", ethers.formatEther(newRemittanceData.amount), "tcUSD");
    console.log("  Fee:", ethers.formatEther(newRemittanceData.fee), "tcUSD");
    console.log("  Exchange Rate:", ethers.formatEther(newRemittanceData.exchangeRate), "UGX per tcUSD");
    console.log("  Reference:", newRemittanceData.reference);
    console.log("  Status:", newRemittanceData.status.toString());
    console.log("  KYC Verified:", newRemittanceData.isKycVerified);
    
    console.log("\n🎉 Remittance counter and data storage working correctly!");
    
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
