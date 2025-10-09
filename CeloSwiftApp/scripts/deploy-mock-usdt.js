const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Deploying Mock USDT for testing...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");

  try {
    // Deploy MockERC20 as USDT
    console.log("\n🪙 Deploying Mock USDT...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUSDT = await MockERC20.deploy(
      "Tether USD",           // name
      "USDT",                 // symbol
      ethers.parseEther("1000000") // initial supply: 1M USDT
    );
    await mockUSDT.waitForDeployment();
    
    const usdtAddress = await mockUSDT.getAddress();
    console.log("✅ Mock USDT deployed to:", usdtAddress);

    // Get deployment info
    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "../deployments/alfajores.json");
    
    if (fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      
      // Update USDT address
      deploymentInfo.tokens.USDT = usdtAddress;
      deploymentInfo.mockUSDT = {
        address: usdtAddress,
        name: "Tether USD",
        symbol: "USDT",
        deployedAt: new Date().toISOString()
      };
      
      // Write updated deployment info
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      console.log("📄 Updated deployment info with Mock USDT address");
    }

    // Configure USDT in RemittanceContract
    console.log("\n🔧 Configuring USDT in RemittanceContract...");
    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    const remittanceContract = RemittanceContract.attach("0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd");
    
    const setTokenTx = await remittanceContract.setSupportedToken(usdtAddress, true);
    await setTokenTx.wait();
    console.log("✅ USDT added as supported token in RemittanceContract");

    // Verify USDT is supported
    const isSupported = await remittanceContract.supportedTokens(usdtAddress);
    console.log("✅ USDT supported:", isSupported);

    console.log("\n🎉 Mock USDT deployment completed successfully!");
    console.log("\n📋 Mock USDT Details:");
    console.log("Address:", usdtAddress);
    console.log("Name: Tether USD");
    console.log("Symbol: USDT");
    console.log("Initial Supply: 1,000,000 USDT");
    console.log("Status: Supported in RemittanceContract");

    console.log("\n🔗 View on Celoscan:");
    console.log(`Mock USDT: https://alfajores.celoscan.io/address/${usdtAddress}`);

  } catch (error) {
    console.error("❌ Mock USDT deployment failed:", error.message);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
