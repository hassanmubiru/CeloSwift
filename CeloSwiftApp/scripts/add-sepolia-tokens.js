const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Adding Sepolia token support to RemittanceContract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  // Get contract instance
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  
  try {
    // Check if we're the owner
    const owner = await remittance.owner();
    console.log("Contract owner:", owner);
    console.log("Our address:", deployer.address);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ Not the contract owner, cannot add tokens");
      return;
    }
    
    // For Sepolia, we'll use the native CELO token
    // In Celo, the native token is represented by the zero address in some contexts
    // But for ERC20-like operations, we need to use the actual CELO token address
    
    // Let's try to add support for native CELO by using a special address
    // or we can deploy a simple mock token for testing
    
    console.log("\n🔧 Adding token support...");
    
    // First, let's remove the old Alfajores cUSD that doesn't work
    console.log("🗑️  Removing old Alfajores cUSD support...");
    const oldCusdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    const removeTx = await remittance.setSupportedToken(oldCusdAddress, false);
    await removeTx.wait();
    console.log("✅ Old cUSD support removed");
    
    // For now, let's create a simple test by adding a mock token
    // In a real deployment, you would use the actual Sepolia token addresses
    
    console.log("\n📝 Note: For production, you need to:");
    console.log("1. Find the correct cUSD and CELO token addresses on Sepolia");
    console.log("2. Add them using: remittance.setSupportedToken(tokenAddress, true)");
    console.log("3. Or deploy mock tokens for testing");
    
    // Check current supported tokens
    console.log("\n🔍 Current supported tokens:");
    const tokensToCheck = [
      { name: "Old cUSD", address: oldCusdAddress },
      { name: "Native CELO", address: "0x0000000000000000000000000000000000000000" },
    ];
    
    for (const token of tokensToCheck) {
      const isSupported = await remittance.supportedTokens(token.address);
      console.log(`${token.name}: ${isSupported ? "✅ Supported" : "❌ Not supported"}`);
    }
    
    console.log("\n✅ Token configuration updated");
    console.log("⚠️  You need to add valid Sepolia token addresses for full functionality");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
