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


// File contracts/PhoneRegistry.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;


/**
 * @title PhoneRegistry
 * @dev Contract for managing phone number to address mappings
 * @author CeloSwift Team
 */
contract PhoneRegistry is Ownable, Pausable {
    
    constructor() Ownable(msg.sender) {}
    
    struct PhoneRecord {
        string phoneNumber;
        address walletAddress;
        string name;
        bool isActive;
        uint256 registrationDate;
        uint256 lastUpdate;
        bool isVerified;
    }
    
    struct VerificationRequest {
        string phoneNumber;
        address requester;
        uint256 timestamp;
        bool isVerified;
        string verificationCode;
    }
    
    // State variables
    mapping(string => PhoneRecord) public phoneRecords;
    mapping(address => string) public addressToPhone;
    mapping(string => VerificationRequest) public verificationRequests;
    
    string[] public registeredPhones;
    uint256 public verificationCounter;
    
    // Verification settings
    uint256 public constant VERIFICATION_EXPIRY = 10 minutes;
    uint256 public constant MAX_VERIFICATION_ATTEMPTS = 3;
    
    mapping(string => uint256) public verificationAttempts;
    
    // Events
    event PhoneRegistered(
        string indexed phoneNumber,
        address indexed walletAddress,
        string name
    );
    
    event PhoneUpdated(
        string indexed phoneNumber,
        address indexed newAddress,
        string name
    );
    
    event PhoneDeactivated(
        string indexed phoneNumber,
        address indexed walletAddress
    );
    
    event VerificationRequested(
        string indexed phoneNumber,
        address indexed requester,
        uint256 timestamp
    );
    
    event PhoneVerified(
        string indexed phoneNumber,
        address indexed walletAddress
    );
    
    event VerificationFailed(
        string indexed phoneNumber,
        string reason
    );

    // Modifiers
    modifier onlyPhoneOwner(string memory phoneNumber) {
        require(
            phoneRecords[phoneNumber].walletAddress == msg.sender,
            "Not phone owner"
        );
        _;
    }
    
    modifier onlyActivePhone(string memory phoneNumber) {
        require(
            phoneRecords[phoneNumber].isActive,
            "Phone not active"
        );
        _;
    }

    /**
     * @dev Register a phone number with wallet address
     */
    function registerPhone(
        string memory phoneNumber,
        string memory name
    ) external whenNotPaused {
        require(bytes(phoneNumber).length > 0, "Phone number required");
        require(bytes(name).length > 0, "Name required");
        require(
            phoneRecords[phoneNumber].walletAddress == address(0),
            "Phone already registered"
        );
        require(
            bytes(addressToPhone[msg.sender]).length == 0,
            "Address already has phone"
        );
        
        phoneRecords[phoneNumber] = PhoneRecord({
            phoneNumber: phoneNumber,
            walletAddress: msg.sender,
            name: name,
            isActive: true,
            registrationDate: block.timestamp,
            lastUpdate: block.timestamp,
            isVerified: false
        });
        
        addressToPhone[msg.sender] = phoneNumber;
        registeredPhones.push(phoneNumber);
        
        emit PhoneRegistered(phoneNumber, msg.sender, name);
    }

    /**
     * @dev Update phone record (only owner)
     */
    function updatePhone(
        string memory phoneNumber,
        string memory newName
    ) external 
        onlyPhoneOwner(phoneNumber)
        onlyActivePhone(phoneNumber)
    {
        require(bytes(newName).length > 0, "Name required");
        
        phoneRecords[phoneNumber].name = newName;
        phoneRecords[phoneNumber].lastUpdate = block.timestamp;
        
        emit PhoneUpdated(phoneNumber, msg.sender, newName);
    }

    /**
     * @dev Deactivate phone record
     */
    function deactivatePhone(string memory phoneNumber) external 
        onlyPhoneOwner(phoneNumber)
        onlyActivePhone(phoneNumber)
    {
        phoneRecords[phoneNumber].isActive = false;
        phoneRecords[phoneNumber].lastUpdate = block.timestamp;
        
        emit PhoneDeactivated(phoneNumber, msg.sender);
    }

    /**
     * @dev Reactivate phone record
     */
    function reactivatePhone(string memory phoneNumber) external 
        onlyPhoneOwner(phoneNumber)
    {
        require(!phoneRecords[phoneNumber].isActive, "Phone already active");
        
        phoneRecords[phoneNumber].isActive = true;
        phoneRecords[phoneNumber].lastUpdate = block.timestamp;
        
        emit PhoneUpdated(phoneNumber, msg.sender, phoneRecords[phoneNumber].name);
    }

    /**
     * @dev Request phone verification
     */
    function requestVerification(string memory phoneNumber) external 
        onlyPhoneOwner(phoneNumber)
        onlyActivePhone(phoneNumber)
    {
        require(
            verificationAttempts[phoneNumber] < MAX_VERIFICATION_ATTEMPTS,
            "Max verification attempts reached"
        );
        
        verificationCounter++;
        string memory verificationCode = generateVerificationCode();
        
        verificationRequests[phoneNumber] = VerificationRequest({
            phoneNumber: phoneNumber,
            requester: msg.sender,
            timestamp: block.timestamp,
            isVerified: false,
            verificationCode: verificationCode
        });
        
        verificationAttempts[phoneNumber]++;
        
        emit VerificationRequested(phoneNumber, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify phone with code
     */
    function verifyPhone(
        string memory phoneNumber,
        string memory verificationCode
    ) external onlyPhoneOwner(phoneNumber) {
        VerificationRequest storage request = verificationRequests[phoneNumber];
        
        require(request.requester == msg.sender, "Invalid requester");
        require(!request.isVerified, "Already verified");
        require(
            block.timestamp <= request.timestamp + VERIFICATION_EXPIRY,
            "Verification expired"
        );
        require(
            keccak256(bytes(request.verificationCode)) == keccak256(bytes(verificationCode)),
            "Invalid verification code"
        );
        
        request.isVerified = true;
        phoneRecords[phoneNumber].isVerified = true;
        phoneRecords[phoneNumber].lastUpdate = block.timestamp;
        
        emit PhoneVerified(phoneNumber, msg.sender);
    }

    /**
     * @dev Get address by phone number
     */
    function getAddressByPhone(string memory phoneNumber) external view returns (address) {
        require(phoneRecords[phoneNumber].isActive, "Phone not active");
        return phoneRecords[phoneNumber].walletAddress;
    }

    /**
     * @dev Get phone by address
     */
    function getPhoneByAddress(address walletAddress) external view returns (string memory) {
        return addressToPhone[walletAddress];
    }

    /**
     * @dev Get phone record
     */
    function getPhoneRecord(string memory phoneNumber) external view returns (PhoneRecord memory) {
        return phoneRecords[phoneNumber];
    }

    /**
     * @dev Check if phone is registered and active
     */
    function isPhoneRegistered(string memory phoneNumber) external view returns (bool) {
        return phoneRecords[phoneNumber].isActive;
    }

    /**
     * @dev Check if phone is verified
     */
    function isPhoneVerified(string memory phoneNumber) external view returns (bool) {
        return phoneRecords[phoneNumber].isActive && phoneRecords[phoneNumber].isVerified;
    }

    /**
     * @dev Get all registered phones
     */
    function getAllRegisteredPhones() external view returns (string[] memory) {
        return registeredPhones;
    }

    /**
     * @dev Get verification request
     */
    function getVerificationRequest(string memory phoneNumber) external view returns (VerificationRequest memory) {
        return verificationRequests[phoneNumber];
    }

    /**
     * @dev Search phones by name (partial match)
     */
    function searchPhonesByName(string memory searchTerm) external view returns (string[] memory) {
        string[] memory results = new string[](registeredPhones.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < registeredPhones.length; i++) {
            string memory phone = registeredPhones[i];
            if (phoneRecords[phone].isActive) {
                string memory name = phoneRecords[phone].name;
                if (containsString(name, searchTerm)) {
                    results[count] = phone;
                    count++;
                }
            }
        }
        
        // Resize array to actual count
        string[] memory finalResults = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResults[i] = results[i];
        }
        
        return finalResults;
    }

    /**
     * @dev Emergency deactivate phone (only owner)
     */
    function emergencyDeactivatePhone(string memory phoneNumber) external onlyOwner {
        phoneRecords[phoneNumber].isActive = false;
        phoneRecords[phoneNumber].lastUpdate = block.timestamp;
        
        emit PhoneDeactivated(phoneNumber, phoneRecords[phoneNumber].walletAddress);
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
     * @dev Generate verification code (simplified for testnet)
     */
    function generateVerificationCode() internal view returns (string memory) {
        // In production, this would be a secure random code
        // For testnet, we'll use a simple deterministic code
        uint256 code = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            block.difficulty
        ))) % 1000000;
        
        return string(abi.encodePacked(uint2str(code)));
    }

    /**
     * @dev Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @dev Check if string contains substring
     */
    function containsString(string memory str, string memory substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);
        
        if (substrBytes.length > strBytes.length) {
            return false;
        }
        
        for (uint256 i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        
        return false;
    }
}
