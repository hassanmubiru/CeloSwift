const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Checking and verifying KYC status...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Get contract instances
  const kycAmlAddress = "0x0982Cd8B1122bA2134BF44A137bE814708Fd821F";
  const kycAml = await ethers.getContractAt("KycAmlContract", kycAmlAddress);
  
  try {
    // Check current KYC status
    console.log("\n🔍 Checking current KYC status...");
    const currentKycStatus = await kycAml.isKycVerified(deployer.address);
    console.log("🔍 Current KYC Verified:", currentKycStatus);
    
    // Get KYC record
    console.log("\n📋 Getting KYC record...");
    const kycRecord = await kycAml.getKycRecord(deployer.address);
    console.log("📄 KYC Record:");
    console.log("  User:", kycRecord.user);
    console.log("  Document Hash:", kycRecord.documentHash);
    console.log("  Document Type:", kycRecord.documentType);
    console.log("  Country:", kycRecord.country);
    console.log("  Status:", kycRecord.status);
    console.log("  Verification Date:", kycRecord.verificationDate.toString());
    console.log("  Expiry Date:", kycRecord.expiryDate.toString());
    console.log("  Is Active:", kycRecord.isActive);
    
    // If KYC is not verified, try to verify it
    if (!currentKycStatus && kycRecord.status === 0) { // 0 = Pending
      console.log("\n✅ Attempting to verify KYC...");
      
      const ugandaPhone = "+256752271548";
      
      const verifyKycTx = await kycAml.verifyKyc(
        deployer.address,
        "John Doe",
        "1234567890",
        "Uganda",
        "Kampala",
        "Kampala Central",
        "Nakawa Division",
        "Makerere University",
        "Software Engineer",
        "john.doe@example.com",
        ugandaPhone
      );
      await verifyKycTx.wait();
      console.log("✅ KYC verification completed");
      
      // Check status again
      const finalKycStatus = await kycAml.isKycVerified(deployer.address);
      console.log("🔍 Final KYC Verified:", finalKycStatus);
      
    } else if (kycRecord.status === 1) { // 1 = Verified
      console.log("✅ KYC is already verified");
    } else {
      console.log("⚠️  KYC status:", kycRecord.status, "(0=Pending, 1=Verified, 2=Rejected, 3=Expired, 4=Suspended)");
    }
    
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
