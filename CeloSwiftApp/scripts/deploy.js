const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting CeloSwift contract deployment...");

  // Get the contract factories
  const PhoneRegistry = await ethers.getContractFactory("PhoneRegistry");
  const KycAmlContract = await ethers.getContractFactory("KycAmlContract");
  const RemittanceContract = await ethers.getContractFactory("RemittanceContract");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");

  // Deploy PhoneRegistry first
  console.log("\n📱 Deploying PhoneRegistry...");
  const phoneRegistry = await PhoneRegistry.deploy();
  await phoneRegistry.waitForDeployment();
  console.log("✅ PhoneRegistry deployed to:", await phoneRegistry.getAddress());

  // Deploy KycAmlContract
  console.log("\n🔐 Deploying KycAmlContract...");
  const kycAmlContract = await KycAmlContract.deploy();
  await kycAmlContract.waitForDeployment();
  console.log("✅ KycAmlContract deployed to:", await kycAmlContract.getAddress());

  // Deploy RemittanceContract
  console.log("\n💸 Deploying RemittanceContract...");
  const remittanceContract = await RemittanceContract.deploy();
  await remittanceContract.waitForDeployment();
  console.log("✅ RemittanceContract deployed to:", await remittanceContract.getAddress());

  // Configure supported tokens (Alfajores testnet addresses)
  console.log("\n🪙 Configuring supported tokens...");
  
  // cUSD on Alfajores
  const cusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  await remittanceContract.setSupportedToken(cusdAddress, true);
  console.log("✅ cUSD added as supported token");

  // USDT on Alfajores - using a valid testnet address
  // Note: This is a placeholder address for testing. Replace with actual USDT address on Alfajores
  const usdtAddress = "0x88eeC4922c8c5fC3B8B8d9d3d8F8e8e8e8e8e8e8";
  // Skip USDT for now due to invalid checksum
  // await remittanceContract.setSupportedToken(usdtAddress, true);
  console.log("⚠️  USDT configuration skipped (placeholder address)");

  // Set initial fee percentage (0.5%)
  await remittanceContract.updateFeePercentage(50);
  console.log("✅ Fee percentage set to 0.5%");

  // Save deployment info
  const deploymentInfo = {
    network: "alfajores",
    chainId: 44787,
    deployer: deployer.address,
    contracts: {
      PhoneRegistry: await phoneRegistry.getAddress(),
      KycAmlContract: await kycAmlContract.getAddress(),
      RemittanceContract: await remittanceContract.getAddress(),
    },
    tokens: {
      cUSD: cusdAddress,
      USDT: usdtAddress,
    },
    deploymentTime: new Date().toISOString(),
  };

  // Write deployment info to file
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, "alfajores.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("PhoneRegistry:", await phoneRegistry.getAddress());
  console.log("KycAmlContract:", await kycAmlContract.getAddress());
  console.log("RemittanceContract:", await remittanceContract.getAddress());
  
  console.log("\n🔗 Network Info:");
  console.log("Network: Alfajores Testnet");
  console.log("Chain ID: 44787");
  console.log("RPC URL: https://alfajores-forno.celo-testnet.org");
  console.log("Explorer: https://alfajores.celoscan.io");

  console.log("\n📄 Deployment info saved to deployments/alfajores.json");
  
  console.log("\n⚠️  Next Steps:");
  console.log("1. Verify contracts on Celoscan");
  console.log("2. Update frontend with contract addresses");
  console.log("3. Test contract functionality");
  console.log("4. Deploy to mainnet when ready");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
