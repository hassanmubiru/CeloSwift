// Sources flattened with hardhat v2.26.3 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File contracts/KycAmlContract.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;


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
