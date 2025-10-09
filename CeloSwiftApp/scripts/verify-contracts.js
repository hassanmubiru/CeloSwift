const { run } = require("hardhat");

async function main() {
  console.log("🔍 Verifying CeloSwift contracts on Celoscan...");

  // Get deployment info
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments/alfajores.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts } = deploymentInfo;

  try {
    // Verify PhoneRegistry
    console.log("\n📱 Verifying PhoneRegistry...");
    await run("verify:verify", {
      address: contracts.PhoneRegistry,
      constructorArguments: [],
      contract: "contracts/PhoneRegistry.sol:PhoneRegistry",
    });
    console.log("✅ PhoneRegistry verified");

    // Verify KycAmlContract
    console.log("\n🔐 Verifying KycAmlContract...");
    await run("verify:verify", {
      address: contracts.KycAmlContract,
      constructorArguments: [],
      contract: "contracts/KycAmlContract.sol:KycAmlContract",
    });
    console.log("✅ KycAmlContract verified");

    // Verify RemittanceContract
    console.log("\n💸 Verifying RemittanceContract...");
    await run("verify:verify", {
      address: contracts.RemittanceContract,
      constructorArguments: [],
      contract: "contracts/RemittanceContract.sol:RemittanceContract",
    });
    console.log("✅ RemittanceContract verified");

    console.log("\n🎉 All contracts verified successfully!");
    console.log("\n📋 Contract Links:");
    console.log(`PhoneRegistry: https://alfajores.celoscan.io/address/${contracts.PhoneRegistry}`);
    console.log(`KycAmlContract: https://alfajores.celoscan.io/address/${contracts.KycAmlContract}`);
    console.log(`RemittanceContract: https://alfajores.celoscan.io/address/${contracts.RemittanceContract}`);

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
