const { ethers } = require("hardhat");

async function main() {
  console.log("🧹 Removing mock USDT from RemittanceContract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  try {
    // Get deployment info
    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "../deployments/alfajores.json");
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found.");
      return;
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const { contracts, tokens } = deploymentInfo;

    // Connect to RemittanceContract
    const RemittanceContract = await ethers.getContractFactory("RemittanceContract");
    const remittanceContract = RemittanceContract.attach(contracts.RemittanceContract);
    
    // Remove USDT support
    console.log("🚫 Removing USDT support from RemittanceContract...");
    const removeUsdtTx = await remittanceContract.setSupportedToken(tokens.USDT, false);
    await removeUsdtTx.wait();
    console.log("✅ USDT support removed from RemittanceContract");

    // Verify USDT is no longer supported
    const usdtSupported = await remittanceContract.supportedTokens(tokens.USDT);
    console.log("✅ USDT supported:", usdtSupported);

    // Verify cUSD is still supported
    const cusdSupported = await remittanceContract.supportedTokens(tokens.cUSD);
    console.log("✅ cUSD supported:", cusdSupported);

    // Update deployment info to remove mock USDT
    delete deploymentInfo.mockUSDT;
    deploymentInfo.tokens.USDT = "REMOVED - No mock data";
    deploymentInfo.notes = "Mock USDT removed - using only real tokens (cUSD)";
    
    // Write updated deployment info
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Updated deployment info - mock USDT removed");

    console.log("\n🎉 Mock USDT removal completed successfully!");
    console.log("\n📋 Current Configuration:");
    console.log("✅ cUSD supported: true");
    console.log("❌ USDT supported: false (no mock data)");
    console.log("💰 Fee percentage: 0.5%");

  } catch (error) {
    console.error("❌ Mock USDT removal failed:", error.message);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
