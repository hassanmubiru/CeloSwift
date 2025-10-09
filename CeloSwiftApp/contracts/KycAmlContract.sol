// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title KycAmlContract
 * @dev Basic KYC/AML compliance contract for CeloSwift
 * @author CeloSwift Team
 */
contract KycAmlContract is Ownable, Pausable {
    
    constructor() Ownable(msg.sender) {}
    
    struct KycRecord {
        address user;
        string documentHash;
        string documentType; // "passport", "id_card", "drivers_license"
        uint256 verificationDate;
        uint256 expiryDate;
        KycStatus status;
        string country;
        string riskLevel; // "low", "medium", "high"
        bool isActive;
    }
    
    struct AmlCheck {
        address user;
        uint256 checkDate;
        bool isSanctioned;
        bool isPep; // Politically Exposed Person
        string riskScore;
        string notes;
    }
    
    enum KycStatus {
        Pending,
        Verified,
        Rejected,
        Expired,
        Suspended
    }
    
    // State variables
    mapping(address => KycRecord) public kycRecords;
    mapping(address => AmlCheck[]) public amlChecks;
    mapping(string => bool) public sanctionedAddresses;
    mapping(string => bool) public pepAddresses;
    
    address[] public verifiedUsers;
    uint256 public kycCounter;
    
    // KYC requirements
    uint256 public constant KYC_EXPIRY_DAYS = 365; // 1 year
    uint256 public constant MIN_AMOUNT_REQUIRING_KYC = 1000 * 10**18; // 1000 tokens
    
    // Events
    event KycSubmitted(
        address indexed user,
        string documentHash,
        string documentType,
        string country
    );
    
    event KycVerified(
        address indexed user,
        KycStatus status,
        uint256 expiryDate
    );
    
    event KycRejected(
        address indexed user,
        string reason
    );
    
    event AmlCheckPerformed(
        address indexed user,
        bool isSanctioned,
        bool isPep,
        string riskScore
    );
    
    event SanctionedAddressAdded(
        string indexed addressHash,
        bool sanctioned
    );
    
    event PepAddressAdded(
        string indexed addressHash,
        bool pep
    );

    // Modifiers
    modifier onlyKycVerified(address user) {
        require(
            kycRecords[user].status == KycStatus.Verified && 
            kycRecords[user].isActive &&
            kycRecords[user].expiryDate > block.timestamp,
            "KYC verification required"
        );
        _;
    }

    /**
     * @dev Submit KYC documents for verification
     */
    function submitKyc(
        string memory documentHash,
        string memory documentType,
        string memory country
    ) external whenNotPaused {
        require(bytes(documentHash).length > 0, "Document hash required");
        require(bytes(documentType).length > 0, "Document type required");
        require(bytes(country).length > 0, "Country required");
        
        // Check if user already has pending or verified KYC
        require(
            kycRecords[msg.sender].status == KycStatus.Rejected ||
            kycRecords[msg.sender].status == KycStatus.Expired ||
            kycRecords[msg.sender].status == KycStatus.Suspended,
            "KYC already submitted or verified"
        );
        
        kycCounter++;
        
        kycRecords[msg.sender] = KycRecord({
            user: msg.sender,
            documentHash: documentHash,
            documentType: documentType,
            verificationDate: 0,
            expiryDate: 0,
            status: KycStatus.Pending,
            country: country,
            riskLevel: "medium", // Default risk level
            isActive: false
        });
        
        emit KycSubmitted(msg.sender, documentHash, documentType, country);
    }

    /**
     * @dev Verify KYC (only owner or authorized verifier)
     */
    function verifyKyc(
        address user,
        KycStatus status,
        string memory riskLevel
    ) external onlyOwner {
        require(kycRecords[user].status == KycStatus.Pending, "Invalid status");
        require(bytes(riskLevel).length > 0, "Risk level required");
        
        kycRecords[user].status = status;
        kycRecords[user].riskLevel = riskLevel;
        kycRecords[user].verificationDate = block.timestamp;
        
        if (status == KycStatus.Verified) {
            kycRecords[user].expiryDate = block.timestamp + (KYC_EXPIRY_DAYS * 1 days);
            kycRecords[user].isActive = true;
            verifiedUsers.push(user);
        } else {
            kycRecords[user].isActive = false;
        }
        
        emit KycVerified(user, status, kycRecords[user].expiryDate);
    }

    /**
     * @dev Reject KYC with reason
     */
    function rejectKyc(address user, string memory reason) external onlyOwner {
        require(kycRecords[user].status == KycStatus.Pending, "Invalid status");
        
        kycRecords[user].status = KycStatus.Rejected;
        kycRecords[user].isActive = false;
        
        emit KycRejected(user, reason);
    }

    /**
     * @dev Perform AML check
     */
    function performAmlCheck(address user) external onlyOwner {
        // In a real implementation, this would integrate with AML databases
        // For testnet, we'll simulate the check
        
        bool isSanctioned = sanctionedAddresses[addressToHash(user)];
        bool isPep = pepAddresses[addressToHash(user)];
        
        string memory riskScore = "low";
        if (isSanctioned) {
            riskScore = "high";
        } else if (isPep) {
            riskScore = "medium";
        }
        
        amlChecks[user].push(AmlCheck({
            user: user,
            checkDate: block.timestamp,
            isSanctioned: isSanctioned,
            isPep: isPep,
            riskScore: riskScore,
            notes: "Automated AML check"
        }));
        
        emit AmlCheckPerformed(user, isSanctioned, isPep, riskScore);
    }

    /**
     * @dev Add sanctioned address
     */
    function addSanctionedAddress(string memory addressHash, bool sanctioned) external onlyOwner {
        sanctionedAddresses[addressHash] = sanctioned;
        emit SanctionedAddressAdded(addressHash, sanctioned);
    }

    /**
     * @dev Add PEP address
     */
    function addPepAddress(string memory addressHash, bool pep) external onlyOwner {
        pepAddresses[addressHash] = pep;
        emit PepAddressAdded(addressHash, pep);
    }

    /**
     * @dev Suspend user KYC
     */
    function suspendKyc(address user) external onlyOwner {
        require(kycRecords[user].status == KycStatus.Verified, "User not verified");
        kycRecords[user].status = KycStatus.Suspended;
        kycRecords[user].isActive = false;
    }

    /**
     * @dev Reactivate suspended KYC
     */
    function reactivateKyc(address user) external onlyOwner {
        require(kycRecords[user].status == KycStatus.Suspended, "User not suspended");
        kycRecords[user].status = KycStatus.Verified;
        kycRecords[user].isActive = true;
    }

    /**
     * @dev Check if amount requires KYC
     */
    function requiresKyc(uint256 amount) external pure returns (bool) {
        return amount >= MIN_AMOUNT_REQUIRING_KYC;
    }

    /**
     * @dev Get KYC record
     */
    function getKycRecord(address user) external view returns (KycRecord memory) {
        return kycRecords[user];
    }

    /**
     * @dev Get AML checks for user
     */
    function getAmlChecks(address user) external view returns (AmlCheck[] memory) {
        return amlChecks[user];
    }

    /**
     * @dev Get latest AML check
     */
    function getLatestAmlCheck(address user) external view returns (AmlCheck memory) {
        require(amlChecks[user].length > 0, "No AML checks found");
        return amlChecks[user][amlChecks[user].length - 1];
    }

    /**
     * @dev Get all verified users
     */
    function getVerifiedUsers() external view returns (address[] memory) {
        return verifiedUsers;
    }

    /**
     * @dev Check if user is KYC verified
     */
    function isKycVerified(address user) external view returns (bool) {
        return kycRecords[user].status == KycStatus.Verified && 
               kycRecords[user].isActive &&
               kycRecords[user].expiryDate > block.timestamp;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Internal function to convert address to hash string
     */
    function addressToHash(address addr) internal pure returns (string memory) {
        return string(abi.encodePacked("0x", toHexString(uint160(addr), 20)));
    }

    /**
     * @dev Internal function to convert uint to hex string
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length);
        bytes memory hexChars = "0123456789abcdef";
        for (uint256 i = 2 * length; i > 0; --i) {
            buffer[i - 1] = hexChars[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }
}
