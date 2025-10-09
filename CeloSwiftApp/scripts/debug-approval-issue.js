const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging approval issue...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Contract addresses
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  const mockTokenAddress = "0x823c8333E17a9A06096F996725673246538EAf40";
  
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  const mockToken = await ethers.getContractAt("MockERC20", mockTokenAddress);
  
  try {
    console.log("\n🔍 Checking approval details...");
    
    // Check current allowance
    const currentAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
    console.log("Current allowance (deployer -> remittance):", ethers.formatEther(currentAllowance), "tcUSD");
    
    // Check if the contract can transfer from deployer to itself
    console.log("\n🔍 Checking contract's ability to transfer...");
    
    // The contract needs to transfer from deployer to itself (address(this))
    // So the allowance should be: deployer -> remittanceAddress
    // And the transfer should be: from deployer to remittanceAddress
    
    const remittanceAmount = ethers.parseEther("100");
    const feePercentage = await remittance.feePercentage();
    const fee = (remittanceAmount * feePercentage) / 10000n;
    const totalAmount = remittanceAmount + fee;
    
    console.log("Remittance amount:", ethers.formatEther(remittanceAmount), "tcUSD");
    console.log("Fee amount:", ethers.formatEther(fee), "tcUSD");
    console.log("Total amount needed:", ethers.formatEther(totalAmount), "tcUSD");
    console.log("Current allowance:", ethers.formatEther(currentAllowance), "tcUSD");
    
    if (currentAllowance < totalAmount) {
      console.log("❌ Insufficient allowance!");
      console.log("Need to approve more tokens...");
      
      const approveTx = await mockToken.approve(remittanceAddress, totalAmount);
      await approveTx.wait();
      console.log("✅ Approved additional tokens");
      
      const newAllowance = await mockToken.allowance(deployer.address, remittanceAddress);
      console.log("New allowance:", ethers.formatEther(newAllowance), "tcUSD");
    } else {
      console.log("✅ Sufficient allowance exists");
    }
    
    // Check token balance
    const tokenBalance = await mockToken.balanceOf(deployer.address);
    console.log("Token balance:", ethers.formatEther(tokenBalance), "tcUSD");
    
    if (tokenBalance < totalAmount) {
      console.log("❌ Insufficient token balance!");
      return;
    }
    
    console.log("\n🎯 The issue might be in the contract logic itself.");
    console.log("Let's try a simple test transfer to see if the approval works...");
    
    // Try a simple transfer to test the approval
    try {
      const testAmount = ethers.parseEther("1");
      const transferTx = await mockToken.transferFrom(deployer.address, remittanceAddress, testAmount);
      await transferTx.wait();
      console.log("✅ Test transfer successful - approval is working");
      
      // Transfer back
      const transferBackTx = await mockToken.transferFrom(remittanceAddress, deployer.address, testAmount);
      await transferBackTx.wait();
      console.log("✅ Test transfer back successful");
      
    } catch (transferError) {
      console.log("❌ Test transfer failed:", transferError.message);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
