# CeloSwift - Mobile-First Decentralized Remittance Application

CeloSwift is a revolutionary mobile-first decentralized application that enables seamless, ultra-low-cost cross-border remittances leveraging the power of the Celo blockchain. Built specifically for emerging markets, it allows users to send and receive stablecoin-based transfers (USDT and cUSD) using only mobile phone numbers, removing the complexities of traditional remittance systems.

## 🌟 Key Features

### 💸 Ultra-Low-Cost Remittances
- **Minimal Fees**: Transaction fees as low as 0.5% compared to traditional 5-10% remittance fees
- **Fast Processing**: Near-instant finality optimized for mobile network conditions
- **Stablecoin Support**: Native support for cUSD and USDT stablecoins

### 📱 Mobile-First Design
- **Intuitive Interface**: Clean, user-friendly design inspired by Celo branding
- **Cross-Platform**: Built with React Native for iOS and Android compatibility
- **Offline Capable**: Core functionality works even with poor network connectivity

### 🔐 Security & Compliance
- **Wallet Integration**: Seamless integration with Valora and other Celo wallets
- **KYC/AML Ready**: Basic compliance features for regulatory readiness
- **Biometric Authentication**: Secure wallet access with fingerprint/face ID
- **Mnemonic Recovery**: Secure wallet creation and recovery with seed phrases

### 🌍 Global Accessibility
- **Phone Number Lookup**: Send funds using only phone numbers
- **QR Code Scanning**: Quick payment requests via QR codes
- **Multi-Currency**: Support for multiple fiat currencies and stablecoins
- **Real-Time Exchange Rates**: Live exchange rate data integration

## 🏗️ Architecture

### Smart Contracts (Solidity)
- **RemittanceContract**: Main contract handling remittance logic and stablecoin transfers
- **PhoneRegistry**: Manages phone number to wallet address mappings
- **KycAmlContract**: Basic KYC/AML compliance for testnet scope

### Mobile Application (React Native)
- **Cross-Platform**: Single codebase for iOS and Android
- **Celo Integration**: Full integration with Celo Payments SDK
- **Wallet Connectivity**: Support for Valora, WalletConnect, and Ledger

### Backend Services
- **Exchange Rate Oracles**: Real-time exchange rate data
- **Phone Number Validation**: International phone number formatting and validation
- **Transaction Analytics**: Comprehensive transaction tracking and reporting

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- React Native development environment
- Celo Alfajores testnet access
- Mobile device or emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/celoswift.git
   cd celoswift
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Deploy smart contracts**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network alfajores
   ```

5. **Start the mobile app**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS (macOS only)
   npm run web      # For web development
   ```

### Configuration

#### Environment Variables
```env
# Celo Network Configuration
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here

# Celo Alfajores Testnet
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
ALFAJORES_CHAIN_ID=44787

# Token Addresses (Alfajores Testnet)
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
USDT_ADDRESS=0x88eeC4922c8c5fC3B8B8d9d3d8F8e8e8e8e8e8e8
```

#### Contract Addresses
After deployment, update the contract addresses in your configuration:
- RemittanceContract: `0x...`
- PhoneRegistry: `0x...`
- KycAmlContract: `0x...`

## 📱 Usage

### For Users

1. **Connect Wallet**
   - Open CeloSwift app
   - Connect with Valora, WalletConnect, or Ledger
   - Verify connection to Alfajores testnet

2. **Register Phone Number**
   - Go to Profile screen
   - Register your phone number
   - Complete KYC verification (optional)

3. **Send Money**
   - Tap "Send" tab
   - Enter recipient's phone number or scan QR code
   - Select token (cUSD/USDT) and amount
   - Confirm transaction

4. **Receive Money**
   - Tap "Receive" tab
   - Share your QR code or wallet address
   - Wait for incoming payments

### For Developers

#### Smart Contract Integration
```typescript
import CeloService from './src/services/CeloService';

// Get token balance
const balance = await CeloService.getTokenBalance(address, 'cUSD');

// Create remittance
const txHash = await CeloService.createRemittance(
  recipient,
  phoneNumber,
  tokenAddress,
  amount,
  exchangeRate,
  reference
);
```

#### Phone Number Service
```typescript
import PhoneService from './src/services/PhoneService';

// Validate phone number
const validation = PhoneService.validatePhoneNumber('+1234567890');

// Look up wallet address
const lookup = await PhoneService.lookupPhoneNumber('+1234567890');
```

## 🧪 Testing

### Smart Contract Tests
```bash
npx hardhat test
```

### Mobile App Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## 📊 Analytics Dashboard

CeloSwift includes a comprehensive analytics dashboard for tracking:
- Transaction volume and status
- Remittance corridors and popular routes
- User engagement metrics
- Fee collection and revenue
- Network performance metrics

## 🔒 Security Considerations

### Smart Contract Security
- **Audited Contracts**: All contracts undergo security audits
- **Upgradeable Design**: Modular architecture for future improvements
- **Access Controls**: Proper role-based access controls
- **Pause Functionality**: Emergency pause capabilities

### Mobile Security
- **Biometric Authentication**: Secure wallet access
- **Encrypted Storage**: Sensitive data encryption
- **Secure Communication**: HTTPS/TLS for all API calls
- **Wallet Isolation**: Private keys never leave the device

## 🌐 Network Support

### Current Networks
- **Alfajores Testnet**: Development and testing
- **Celo Mainnet**: Production deployment (planned)

### Planned Networks
- **Polygon**: Layer 2 scaling solution
- **Arbitrum**: Additional scaling option
- **Base**: Coinbase's Layer 2 network

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write comprehensive tests
- Document all public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](docs/USER_GUIDE.md)
- [Developer Documentation](docs/DEVELOPER_GUIDE.md)
- [API Reference](docs/API_REFERENCE.md)

### Community
- [Discord](https://discord.gg/celoswift)
- [Telegram](https://t.me/celoswift)
- [Twitter](https://twitter.com/celoswift)

### Support Channels
- Email: support@celoswift.app
- GitHub Issues: [Report bugs and request features](https://github.com/your-org/celoswift/issues)

## 🗺️ Roadmap

### Phase 1: Core Functionality ✅
- [x] Smart contract development
- [x] Mobile app UI/UX
- [x] Wallet integration
- [x] Basic remittance flows

### Phase 2: Enhanced Features 🚧
- [ ] Advanced KYC/AML integration
- [ ] Multi-language support
- [ ] Offline transaction queuing
- [ ] Advanced analytics dashboard

### Phase 3: Scale & Optimize 📋
- [ ] Mainnet deployment
- [ ] Additional token support
- [ ] Cross-chain bridges
- [ ] Enterprise features

### Phase 4: Global Expansion 🌍
- [ ] Regulatory compliance per region
- [ ] Local payment methods
- [ ] Banking partnerships
- [ ] Advanced security features

## 🙏 Acknowledgments

- **Celo Foundation**: For the amazing blockchain infrastructure
- **Valora Team**: For the excellent mobile wallet
- **OpenZeppelin**: For secure smart contract libraries
- **React Native Community**: For the cross-platform framework

## 📈 Impact

CeloSwift aims to:
- **Reduce Remittance Costs**: From 5-10% to under 1%
- **Increase Financial Inclusion**: Serve the unbanked population
- **Enable Instant Transfers**: Near-instant cross-border payments
- **Promote Economic Growth**: Facilitate global commerce

---

**Built with ❤️ for financial inclusion and global accessibility**

For more information, visit [celoswift.app](https://celoswift.app)
