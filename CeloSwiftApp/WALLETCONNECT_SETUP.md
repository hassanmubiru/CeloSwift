# WalletConnect v2 Setup Guide

This guide will help you set up WalletConnect v2 for real mobile MetaMask connections in CeloSwift.

## 1. Get Your WalletConnect Project ID

### Step 1: Visit WalletConnect Cloud
1. Go to [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Create a new project

### Step 2: Configure Your Project
1. **Project Name**: `CeloSwift`
2. **Description**: `Mobile-first decentralized remittance application on Celo`
3. **Website URL**: `https://celoswift.app` (or your domain)
4. **App Icon**: Upload your app icon (recommended: 512x512 PNG)

### Step 3: Get Your Project ID
1. After creating the project, you'll see your **Project ID**
2. Copy this Project ID (it looks like: `2f05a7f74c1f039807b52bcc32f9c62a`)

## 2. Update Your Configuration

### Update the Project ID
1. Open `src/config/walletconnect.ts`
2. Replace the demo Project ID with your own:

```typescript
export const WALLETCONNECT_CONFIG = {
  // Replace this with your actual Project ID from WalletConnect Cloud
  projectId: 'YOUR_ACTUAL_PROJECT_ID_HERE',
  
  // Update these with your actual app details
  metadata: {
    name: 'CeloSwift',
    description: 'Mobile-first decentralized remittance application on Celo',
    url: 'https://your-actual-domain.com', // Update with your domain
    icons: ['https://your-actual-domain.com/icon.png'], // Update with your icon URL
  },
  
  // Update these with your app's deep link scheme
  redirect: {
    native: 'your-app-scheme://', // Replace with your app's scheme
    universal: 'https://your-actual-domain.com', // Update with your domain
  },
  
  // ... rest of the configuration
};
```

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
