# WalletConnect Setup Guide

This guide will help you set up wallet connections for CeloSwift. Currently, the app supports real MetaMask connections on web browsers, with mobile WalletConnect integration in development.

## Current Status

### ✅ What Works Now:
- **Web Browser**: Full MetaMask connection with browser extension
- **Network Switching**: Automatic Celo Alfajores network configuration
- **Real Transactions**: All blockchain operations use real MetaMask
- **Account Management**: Multiple account support

### 🚧 In Development:
- **Mobile WalletConnect**: Full mobile wallet integration
- **Additional Wallets**: Coinbase Wallet, Trust Wallet support
- **Session Persistence**: Mobile session management

## 1. Web MetaMask Connection (Ready Now)

### How It Works:
1. Open CeloSwift in a web browser
2. Click "Connect Wallet" → "MetaMask"
3. MetaMask popup appears
4. Approve the connection
5. Network automatically switches to Celo Alfajores
6. Full app functionality available

### Requirements:
- MetaMask browser extension installed
- MetaMask unlocked with at least one account
- Internet connection

## 2. Mobile Development (Coming Soon)

### Current Mobile Experience:
- App detects installed wallets
- Shows clear instructions for mobile setup
- Provides links to install MetaMask mobile app
- Explains current limitations

### Future Mobile Features:
- Full WalletConnect v2 integration
- Real mobile wallet connections
- Session persistence
- Multi-wallet support

## 3. Configure Deep Linking (Mobile)

### For React Native / Expo
1. **App Scheme**: Update your app's custom URL scheme
2. **Universal Links**: Set up universal links for iOS
3. **Intent Filters**: Configure Android intent filters

### Example Configuration
```json
// app.json (Expo)
{
  "expo": {
    "scheme": "celoswift",
    "web": {
      "bundler": "metro"
    }
  }
}
```

## 4. Test Your Integration

### Web Testing
1. Open your app in a web browser
2. Click "Connect Wallet" → "MetaMask"
3. MetaMask should open and request connection
4. Approve the connection
5. You should see "MetaMask Connected!" message

### Mobile Testing
1. Install MetaMask mobile app on your device
2. Open your React Native app
3. Click "Connect Wallet" → "MetaMask"
4. WalletConnect modal should appear
5. Select MetaMask from the list
6. MetaMask app should open for approval
7. Approve the connection
8. Return to your app

## 5. Production Considerations

### Security
- Keep your Project ID secure
- Use environment variables for sensitive data
- Validate all wallet connections
- Implement proper error handling

### Performance
- Initialize WalletConnect early in your app lifecycle
- Handle connection state properly
- Implement reconnection logic
- Cache connection sessions

### User Experience
- Provide clear connection instructions
- Handle connection failures gracefully
- Show connection status clearly
- Implement proper loading states

## 6. Troubleshooting

### Common Issues

**"Project ID not found"**
- Verify your Project ID is correct
- Check that your project is active in WalletConnect Cloud

**"Connection failed"**
- Ensure MetaMask is installed and unlocked
- Check network connectivity
- Verify deep linking configuration

**"Session not found"**
- Clear app data and try again
- Check WalletConnect session storage
- Verify event listeners are set up

### Debug Mode
Enable debug logging by adding this to your app:

```typescript
// In your app initialization
console.log('WalletConnect Debug Mode Enabled');
```

## 7. Advanced Features

### Multiple Wallets
The current implementation supports:
- ✅ MetaMask (Web & Mobile)
- 🚧 Coinbase Wallet (Coming Soon)
- 🚧 Trust Wallet (Coming Soon)
- 🚧 Rainbow Wallet (Coming Soon)

### Custom Networks
You can add more networks by updating the configuration:

```typescript
// Add more chains to requiredNamespaces
chains: ['eip155:44787', 'eip155:42220', 'eip155:1'], // Celo Alfajores, Celo Mainnet, Ethereum
```

### Session Management
The service automatically handles:
- Session persistence
- Reconnection on app restart
- Event listening
- Clean disconnection

## 8. Support

If you encounter issues:
1. Check the [WalletConnect Documentation](https://docs.walletconnect.com/)
2. Review the [React Native Integration Guide](https://docs.walletconnect.com/wallet-sdk/react-native/)
3. Check the [Troubleshooting Guide](https://docs.walletconnect.com/wallet-sdk/react-native/troubleshooting)

## 9. Next Steps

After setting up WalletConnect v2:
1. Test thoroughly on both iOS and Android
2. Implement additional wallet support
3. Add transaction signing capabilities
4. Implement session persistence
5. Add proper error handling and user feedback

---

**Note**: The demo Project ID in the configuration is for testing only. For production, you must use your own Project ID from WalletConnect Cloud.
