# Complete MetaMask Integration Guide for React Native

This guide provides a comprehensive, step-by-step implementation of MetaMask wallet integration in your React Native app, including setup, authentication, transaction signing, and security best practices.

## 🚀 Features Included

- ✅ **Secure Wallet Connection** - Connect to MetaMask on both web and mobile
- ✅ **User Authentication** - Message signing for secure authentication
- ✅ **Transaction Signing** - Send transactions with proper validation
- ✅ **Error Handling** - Comprehensive error management and user feedback
- ✅ **Security Measures** - Rate limiting, suspicious activity detection, and validation
- ✅ **Beautiful UI Components** - Modern, user-friendly interface
- ✅ **Event System** - Real-time updates and state management
- ✅ **Storage Management** - Secure data persistence

## 📋 Prerequisites

- React Native project (Expo or bare React Native)
- Node.js 16+
- Basic understanding of Web3 and blockchain concepts
- MetaMask wallet installed on your device/browser

## 🛠 Installation

### 1. Install Dependencies

```bash
npm install @walletconnect/modal @walletconnect/ethereum-provider @walletconnect/types @walletconnect/utils
npm install @react-native-async-storage/async-storage react-native-keychain
npm install react-native-get-random-values react-native-crypto-js
npm install expo-linear-gradient
```

### 2. Configure WalletConnect

Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) and update the configuration:

```typescript
// src/config/walletconnect.ts
export const WALLETCONNECT_CONFIG = {
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual Project ID
  // ... rest of configuration
};
```

### 3. Set Up Deep Linking (Mobile)

For React Native CLI projects, add URL schemes to your `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTask">
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="celoswift" />
  </intent-filter>
</activity>
```

For iOS, add to `ios/YourApp/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>celoswift</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>celoswift</string>
    </array>
  </dict>
</array>
```

## 🏗 Architecture Overview

### Services

1. **MetaMaskService** - Core wallet connection and transaction handling
2. **AuthService** - User authentication and session management
3. **ErrorHandler** - Comprehensive error handling and reporting
4. **SecurityService** - Security measures and validation

### Components

1. **MetaMaskConnectModal** - Wallet connection interface
2. **WalletStatusCard** - Display wallet status and actions
3. **TransactionModal** - Transaction creation and signing

## 📱 Usage Examples

### Basic Integration

```typescript
import React, { useState, useEffect } from 'react';
import MetaMaskService from './src/services/MetaMaskService';
import AuthService from './src/services/AuthService';
import MetaMaskConnectModal from './src/components/MetaMaskConnectModal';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    await MetaMaskService.initialize();
    await AuthService.initialize();
  };

  const handleConnect = async () => {
    const connected = await MetaMaskService.connect();
    if (connected) {
      const authResult = await AuthService.authenticate();
      if (authResult.success) {
        setUser(authResult.user);
        setIsConnected(true);
      }
    }
  };

  return (
    <View>
      {!isConnected ? (
        <Button title="Connect MetaMask" onPress={handleConnect} />
      ) : (
        <Text>Connected as: {user?.address}</Text>
      )}
    </View>
  );
};
```

### Sending Transactions

```typescript
const sendTransaction = async () => {
  try {
    const transaction = {
      to: '0x...', // Recipient address
      value: '0.1', // Amount in CELO
    };

    const txHash = await MetaMaskService.sendTransaction(transaction);
    console.log('Transaction sent:', txHash);
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

### Signing Messages

```typescript
const signMessage = async () => {
  try {
    const message = 'Hello from my app!';
    const signature = await MetaMaskService.signMessage(message);
    console.log('Message signed:', signature);
  } catch (error) {
    console.error('Signing failed:', error);
  }
};
```

## 🔒 Security Best Practices

### 1. Input Validation

Always validate user inputs:

```typescript
import { ethers } from 'ethers';

const validateAddress = (address: string): boolean => {
  return ethers.isAddress(address);
};

const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};
```

### 2. Transaction Limits

Implement transaction limits for security:

```typescript
const MAX_TRANSACTION_AMOUNT = '1000'; // CELO

const validateTransaction = (amount: string): boolean => {
  return parseFloat(amount) <= parseFloat(MAX_TRANSACTION_AMOUNT);
};
```

### 3. Rate Limiting

Use the SecurityService for rate limiting:

```typescript
const canPerformAction = await SecurityService.checkRateLimit(
  userAddress,
  'send_transaction'
);

if (!canPerformAction) {
  throw new Error('Rate limit exceeded');
}
```

### 4. Error Handling

Always handle errors gracefully:

```typescript
try {
  await MetaMaskService.sendTransaction(transaction);
} catch (error) {
  ErrorHandler.handleTransactionError(error);
}
```

## 🎨 Customization

### Styling Components

Customize the appearance by modifying the styles in each component:

```typescript
// Customize MetaMaskConnectModal
const customStyles = StyleSheet.create({
  modal: {
    backgroundColor: '#YOUR_COLOR',
    borderRadius: 20,
  },
  connectButton: {
    backgroundColor: '#YOUR_BRAND_COLOR',
  },
});
```

### Adding New Networks

Add support for additional networks:

```typescript
// src/config/walletconnect.ts
export const CELO_NETWORKS = {
  // ... existing networks
  polygon: {
    chainId: 137,
    chainName: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    // ... other config
  },
};
```

## 🧪 Testing

### Unit Tests

```typescript
import MetaMaskService from '../src/services/MetaMaskService';

describe('MetaMaskService', () => {
  it('should validate addresses correctly', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    const invalidAddress = 'invalid-address';
    
    expect(MetaMaskService.validateAddress(validAddress)).toBe(true);
    expect(MetaMaskService.validateAddress(invalidAddress)).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Wallet Integration', () => {
  it('should connect to MetaMask', async () => {
    const connected = await MetaMaskService.connect();
    expect(connected).toBe(true);
  });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **"MetaMask not found" error**
   - Ensure MetaMask is installed
   - Check if running on web platform
   - Verify window.ethereum is available

2. **Connection fails on mobile**
   - Check deep linking configuration
   - Ensure MetaMask app is installed
   - Verify URL schemes are correct

3. **Transaction rejected**
   - Check user has sufficient funds
   - Verify network is correct
   - Ensure gas estimation is working

4. **Authentication fails**
   - Check if user signed the message
   - Verify signature validation
   - Ensure session hasn't expired

### Debug Mode

Enable debug logging:

```typescript
// Add to your app initialization
console.log('Debug mode enabled');
MetaMaskService.on('connected', (data) => console.log('Connected:', data));
MetaMaskService.on('error', (error) => console.error('Error:', error));
```

## 📚 Additional Resources

- [MetaMask Documentation](https://docs.metamask.io/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [Celo Documentation](https://docs.celo.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information
4. Join our community Discord

---

**Happy coding! 🚀**

This integration provides a solid foundation for MetaMask wallet integration in React Native apps. The modular architecture makes it easy to extend and customize for your specific needs.
