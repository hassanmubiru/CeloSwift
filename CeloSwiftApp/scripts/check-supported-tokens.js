const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Checking supported tokens on Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Get contract instance
  const remittanceAddress = "0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA";
  const remittance = await ethers.getContractAt("RemittanceContract", remittanceAddress);
  
  try {
    // Check what tokens are supported
    console.log("\n🔍 Checking supported tokens...");
    
    // Common token addresses to test
    const tokensToTest = [
      { name: "cUSD (Alfajores)", address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" },
      { name: "CELO (Alfajores)", address: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9" },
      { name: "Native CELO", address: "0x0000000000000000000000000000000000000000" },
      { name: "Wrapped CELO", address: "0x471EcE3750Da237f93B8E339c536989b8978a438" },
    ];
    
    for (const token of tokensToTest) {
      try {
        const isSupported = await remittance.supportedTokens(token.address);
        console.log(`${token.name}: ${isSupported ? "✅ Supported" : "❌ Not supported"}`);
        
        if (isSupported) {
          // Try to get balance if it's an ERC20 token
          if (token.address !== "0x0000000000000000000000000000000000000000") {
            try {
              const tokenContract = await ethers.getContractAt("IERC20", token.address);
              const balance = await tokenContract.balanceOf(deployer.address);
              console.log(`  Balance: ${ethers.formatEther(balance)} ${token.name.split(' ')[0]}`);
            } catch (balanceError) {
              console.log(`  Balance: Could not fetch (${balanceError.message})`);
            }
          }
        }
      } catch (error) {
        console.log(`${token.name}: ❌ Error checking (${error.message})`);
      }
    }
    
    // Check fee percentage
    console.log("\n💰 Checking fee configuration...");
    const feePercentage = await remittance.feePercentage();
    console.log("Fee percentage:", ethers.formatEther(feePercentage), "%");
    
    // Check owner
    const owner = await remittance.owner();
    console.log("Contract owner:", owner);
    
    console.log("\n📋 Summary:");
    console.log("✅ Contract is deployed and accessible");
    console.log("✅ Fee configuration is set");
    console.log("⚠️  Need to add supported tokens for Sepolia");
    
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
