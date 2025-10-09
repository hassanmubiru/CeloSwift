const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Deploying mock token for Sepolia testing...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
  
  try {
    // Deploy MockERC20 token
    console.log("\n🚀 Deploying MockERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy(
      "Test cUSD",      // name
      "tcUSD",          // symbol
      ethers.parseEther("1000000") // initial supply: 1M tokens
    );
    await mockToken.waitForDeployment();
    
    const tokenAddress = await mockToken.getAddress();
    console.log("✅ MockERC20 deployed to:", tokenAddress);
    
    // Check token balance
    const tokenBalance = await mockToken.balanceOf(deployer.address);
    console.log("💰 Token balance:", ethers.formatEther(tokenBalance), "tcUSD");
    
    // Add token to RemittanceContract
    console.log("\n🔧 Adding token to RemittanceContract...");
    const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
    const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
    
    const addTokenTx = await remittance.setSupportedToken(tokenAddress, true);
    await addTokenTx.wait();
    console.log("✅ Token added to RemittanceContract");
    
    // Verify token is supported
    const isSupported = await remittance.supportedTokens(tokenAddress);
    console.log("✅ Token support verified:", isSupported);
    
    console.log("\n🎉 Mock token deployment completed!");
    console.log("\n📊 Summary:");
    console.log("✅ MockERC20 deployed:", tokenAddress);
    console.log("✅ Token added to RemittanceContract");
    console.log("✅ Ready for remittance testing");
    
    console.log("\n📝 Contract addresses for testing:");
    console.log("MockERC20:", tokenAddress);
    console.log("RemittanceContract:", remittanceAddress);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
