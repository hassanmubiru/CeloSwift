// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RemittanceContract
 * @dev Main contract for handling cross-border remittances on Celo
 * @author CeloSwift Team
 */
contract RemittanceContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    constructor() Ownable(msg.sender) {
        // Initialize with Celo native tokens
        // These addresses are for Alfajores testnet
        // cUSD: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
        // USDT: 0x88eeC4922c8c5fC3B8B8d9d3d8F8e8e8e8e8e8e8 (placeholder)
    }

    // Structs
    struct Remittance {
        uint256 id;
        address sender;
        address recipient;
        string senderPhone;
        string recipientPhone;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 exchangeRate;
        uint256 timestamp;
        RemittanceStatus status;
        string remittanceReference;
        bool isKycVerified;
    }

    struct UserProfile {
        string phoneNumber;
        string name;
        bool isKycVerified;
        uint256 totalSent;
        uint256 totalReceived;
        uint256 transactionCount;
        uint256 lastActivity;
    }

    enum RemittanceStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled
    }

    // State variables
    mapping(uint256 => Remittance) public remittances;
    mapping(address => UserProfile) public userProfiles;
    mapping(string => address) public phoneToAddress;
    mapping(address => string) public addressToPhone;
    
    uint256 public remittanceCounter;
    uint256 public constant MAX_FEE_PERCENTAGE = 500; // 5% max fee
    uint256 public feePercentage = 50; // 0.5% default fee
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    // Events
    event RemittanceCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        string remittanceReference
    );
    
    event RemittanceCompleted(
        uint256 indexed id,
        address indexed recipient,
        uint256 amount
    );
    
    event RemittanceFailed(
        uint256 indexed id,
        string reason
    );
    
    event UserRegistered(
        address indexed user,
        string phoneNumber,
        string name
    );
    
    event KycVerified(
        address indexed user,
        bool verified
    );
    
    event FeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );
    
    event TokenAdded(
        address indexed token,
        bool supported
    );

    // Modifiers
    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }
    
    modifier onlyRegisteredUser(address user) {
        require(bytes(userProfiles[user].phoneNumber).length > 0, "User not registered");
        _;
    }


    /**
     * @dev Register a new user with phone number
     */
    function registerUser(
        string memory phoneNumber,
        string memory name
    ) external {
        require(bytes(phoneNumber).length > 0, "Phone number required");
        require(bytes(name).length > 0, "Name required");
        require(phoneToAddress[phoneNumber] == address(0), "Phone already registered");
        require(bytes(userProfiles[msg.sender].phoneNumber).length == 0, "User already registered");
        
        userProfiles[msg.sender] = UserProfile({
            phoneNumber: phoneNumber,
            name: name,
            isKycVerified: false,
            totalSent: 0,
            totalReceived: 0,
            transactionCount: 0,
            lastActivity: block.timestamp
        });
        
        phoneToAddress[phoneNumber] = msg.sender;
        addressToPhone[msg.sender] = phoneNumber;
        
        emit UserRegistered(msg.sender, phoneNumber, name);
    }

    /**
     * @dev Create a new remittance
     */
    function createRemittance(
        address recipient,
        string memory recipientPhone,
        address token,
        uint256 amount,
        uint256 exchangeRate,
        string memory remittanceReference
    ) external 
        onlySupportedToken(token)
        onlyRegisteredUser(msg.sender)
        whenNotPaused
        nonReentrant
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(recipientPhone).length > 0, "Recipient phone required");
        
        uint256 fee = (amount * feePercentage) / 10000;
        uint256 totalAmount = amount + fee;
        
        // Transfer tokens from sender to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        remittanceCounter++;
        
        remittances[remittanceCounter] = Remittance({
            id: remittanceCounter,
            sender: msg.sender,
            recipient: recipient,
            senderPhone: userProfiles[msg.sender].phoneNumber,
            recipientPhone: recipientPhone,
            token: token,
            amount: amount,
            fee: fee,
            exchangeRate: exchangeRate,
            timestamp: block.timestamp,
            status: RemittanceStatus.Pending,
            remittanceReference: remittanceReference,
            isKycVerified: userProfiles[msg.sender].isKycVerified
        });
        
        // Update user stats
        userProfiles[msg.sender].totalSent += amount;
        userProfiles[msg.sender].transactionCount++;
        userProfiles[msg.sender].lastActivity = block.timestamp;
        
        emit RemittanceCreated(
            remittanceCounter,
            msg.sender,
            recipient,
            token,
            amount,
            remittanceReference
        );
    }

    /**
     * @dev Complete a remittance (called by recipient or authorized party)
     */
    function completeRemittance(uint256 remittanceId) external whenNotPaused nonReentrant {
        Remittance storage remittance = remittances[remittanceId];
        require(remittance.id > 0, "Remittance not found");
        require(remittance.status == RemittanceStatus.Pending, "Invalid status");
        require(
            msg.sender == remittance.recipient || msg.sender == owner(),
            "Unauthorized"
        );
        
        remittance.status = RemittanceStatus.Processing;
        
        // Transfer tokens to recipient
        IERC20(remittance.token).safeTransfer(remittance.recipient, remittance.amount);
        
        // Transfer fee to contract owner
        if (remittance.fee > 0) {
            IERC20(remittance.token).safeTransfer(owner(), remittance.fee);
        }
        
        remittance.status = RemittanceStatus.Completed;
        
        // Update recipient stats
        if (bytes(userProfiles[remittance.recipient].phoneNumber).length > 0) {
            userProfiles[remittance.recipient].totalReceived += remittance.amount;
            userProfiles[remittance.recipient].transactionCount++;
            userProfiles[remittance.recipient].lastActivity = block.timestamp;
        }
        
        emit RemittanceCompleted(remittanceId, remittance.recipient, remittance.amount);
    }

    /**
     * @dev Cancel a remittance (only sender can cancel pending remittances)
     */
    function cancelRemittance(uint256 remittanceId) external nonReentrant {
        Remittance storage remittance = remittances[remittanceId];
        require(remittance.id > 0, "Remittance not found");
        require(remittance.status == RemittanceStatus.Pending, "Cannot cancel");
        require(msg.sender == remittance.sender, "Unauthorized");
        
        remittance.status = RemittanceStatus.Cancelled;
        
        // Refund tokens to sender
        uint256 totalAmount = remittance.amount + remittance.fee;
        IERC20(remittance.token).safeTransfer(remittance.sender, totalAmount);
        
        emit RemittanceFailed(remittanceId, "Cancelled by sender");
    }

    /**
     * @dev Mark KYC verification for a user
     */
    function verifyKyc(address user, bool verified) external onlyOwner {
        require(bytes(userProfiles[user].phoneNumber).length > 0, "User not registered");
        userProfiles[user].isKycVerified = verified;
        emit KycVerified(user, verified);
    }

    /**
     * @dev Add or remove supported token
     */
    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        
        if (supported) {
            // Add to token list if not already present
            bool exists = false;
            for (uint i = 0; i < tokenList.length; i++) {
                if (tokenList[i] == token) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                tokenList.push(token);
            }
        }
        
        emit TokenAdded(token, supported);
    }

    /**
     * @dev Update fee percentage
     */
    function updateFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        uint256 oldFee = feePercentage;
        feePercentage = newFeePercentage;
        emit FeeUpdated(oldFee, newFeePercentage);
    }

    /**
     * @dev Pause contract in case of emergency
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
     * @dev Get remittance details
     */
    function getRemittance(uint256 remittanceId) external view returns (Remittance memory) {
        return remittances[remittanceId];
    }

    /**
     * @dev Get user profile
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @dev Get address by phone number
     */
    function getAddressByPhone(string memory phoneNumber) external view returns (address) {
        return phoneToAddress[phoneNumber];
    }

    /**
     * @dev Get supported tokens list
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    /**
     * @dev Get remittances by user
     */
    function getUserRemittances(address user) external view returns (uint256[] memory) {
        uint256[] memory userRemittances = new uint256[](remittanceCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= remittanceCounter; i++) {
            if (remittances[i].sender == user || remittances[i].recipient == user) {
                userRemittances[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userRemittances[i];
        }
        
        return result;
    }
}
