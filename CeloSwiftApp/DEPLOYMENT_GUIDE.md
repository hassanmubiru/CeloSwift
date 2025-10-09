# CeloSwift Deployment Guide

This guide will walk you through deploying CeloSwift to the Celo Alfajores testnet and preparing for mainnet deployment.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 16+** and npm
2. **Celo Alfajores testnet CELO** for gas fees
3. **Private key** for deployment account
4. **Celoscan API key** (optional, for contract verification)

### Getting Testnet CELO

1. Visit the [Celo Alfajores Faucet](https://faucet.celo.org/alfajores)
2. Connect your wallet or enter your address
3. Request testnet CELO tokens

## 📋 Deployment Steps

### 1. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Deploy to Alfajores Testnet

```bash
npx hardhat run scripts/deploy.js --network alfajores
```

Expected output:
```
🚀 Starting CeloSwift contract deployment...

📝 Deploying contracts with account: 0x...
💰 Account balance: 1.5 CELO

📱 Deploying PhoneRegistry...
✅ PhoneRegistry deployed to: 0x...

🔐 Deploying KycAmlContract...
✅ KycAmlContract deployed to: 0x...

💸 Deploying RemittanceContract...
✅ RemittanceContract deployed to: 0x...

🪙 Configuring supported tokens...
✅ cUSD added as supported token
✅ USDT added as supported token
✅ Fee percentage set to 0.5%

🎉 Deployment completed successfully!

📋 Contract Addresses:
PhoneRegistry: 0x...
KycAmlContract: 0x...
RemittanceContract: 0x...
```

### 5. Verify Contracts (Optional)

```bash
npx hardhat run scripts/verify-contracts.js --network alfajores
```

### 6. Update Mobile App Configuration

Update contract addresses in your mobile app:

```typescript
// src/services/CeloService.ts
const CONTRACT_ADDRESSES = {
  REMITTANCE_CONTRACT: '0x...', // From deployment output
  PHONE_REGISTRY: '0x...',      // From deployment output
  KYC_AML_CONTRACT: '0x...',    // From deployment output
};
```

## 🧪 Testing Deployment

### 1. Run Smart Contract Tests

```bash
npm run test:contracts
```

### 2. Run Integration Tests

```bash
npm run test:integration
```

### 3. Test Mobile App

```bash
# Start the mobile app
npm run android  # or npm run ios
```

## 📱 Mobile App Deployment

### Development Build

```bash
# Android
npm run build:android

# iOS (macOS only)
npm run build:ios
```

### Production Build

1. **Configure app.json** with production settings
2. **Update contract addresses** to mainnet
3. **Build production APK/IPA**

```bash
# Android
expo build:android --type apk

# iOS
expo build:ios --type archive
```

## 🌐 Mainnet Deployment

### Prerequisites

1. **Mainnet CELO** for deployment
2. **Audited contracts** (recommended)
3. **Production environment** setup
4. **Security review** completed

### Deployment Steps

1. **Update network configuration**:
   ```javascript
   // hardhat.config.js
   celo: {
     url: "https://forno.celo.org",
     accounts: [process.env.PRIVATE_KEY],
     chainId: 42220,
   }
   ```

2. **Deploy to mainnet**:
   ```bash
   npx hardhat run scripts/deploy.js --network celo
   ```

3. **Verify contracts**:
   ```bash
   npx hardhat run scripts/verify-contracts.js --network celo
   ```

4. **Update mobile app** with mainnet addresses

## 🔧 Configuration

### Contract Configuration

After deployment, configure your contracts:

```javascript
// Set supported tokens
await remittanceContract.setSupportedToken(cusdAddress, true);
await remittanceContract.setSupportedToken(usdtAddress, true);

// Update fee percentage
await remittanceContract.updateFeePercentage(50); // 0.5%

// Add KYC verifiers
await kycAmlContract.verifyKyc(userAddress, true);
```

### Mobile App Configuration

```typescript
// App.tsx
const celoConfig = {
  networks: [
    {
      name: 'Alfajores',
      rpcUrl: 'https://alfajores-forno.celo-testnet.org',
      chainId: 44787,
    },
    {
      name: 'Celo',
      rpcUrl: 'https://forno.celo.org',
      chainId: 42220,
    },
  ],
  defaultNetwork: 'Alfajores', // or 'Celo' for mainnet
};
```

## 📊 Monitoring

### Contract Monitoring

1. **Celoscan**: Monitor contract interactions
2. **Events**: Track remittance events
3. **Metrics**: Monitor transaction volume and fees

### Mobile App Monitoring

1. **Analytics**: User engagement and transaction metrics
2. **Error Tracking**: Crash reporting and error logs
3. **Performance**: App performance monitoring

## 🚨 Security Considerations

### Smart Contract Security

- ✅ **Audited contracts** (recommended for mainnet)
- ✅ **Access controls** properly implemented
- ✅ **Pause functionality** for emergencies
- ✅ **Upgradeable architecture** for future improvements

### Mobile App Security

- ✅ **Biometric authentication** for wallet access
- ✅ **Encrypted storage** for sensitive data
- ✅ **Secure communication** with HTTPS/TLS
- ✅ **Private key protection** (never stored in plain text)

## 🔄 Maintenance

### Regular Tasks

1. **Monitor contract events** for unusual activity
2. **Update exchange rates** from oracles
3. **Review and update** KYC/AML lists
4. **Monitor gas prices** and optimize transactions

### Emergency Procedures

1. **Pause contracts** if security issues detected
2. **Emergency deactivate** suspicious phone numbers
3. **Suspend KYC** for flagged users
4. **Contact support** for critical issues

## 📞 Support

### Deployment Issues

- **GitHub Issues**: [Report deployment problems](https://github.com/your-org/celoswift/issues)
- **Discord**: [Join our community](https://discord.gg/celoswift)
- **Email**: deployment@celoswift.app

### Contract Verification

If contract verification fails:

1. Check contract source code matches deployment
2. Verify constructor arguments
3. Ensure all dependencies are available
4. Try manual verification on Celoscan

## 📈 Next Steps

After successful deployment:

1. **Test thoroughly** with real transactions
2. **Monitor performance** and user feedback
3. **Plan mainnet deployment** with security audit
4. **Scale infrastructure** as user base grows
5. **Implement additional features** based on user needs

---

**Happy Deploying! 🚀**

For more information, visit [celoswift.app](https://celoswift.app) or join our [Discord community](https://discord.gg/celoswift).
