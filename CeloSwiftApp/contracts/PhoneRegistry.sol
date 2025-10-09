// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
