import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';

interface MobileWalletInfo {
  id: string;
  name: string;
  deepLink: string;
  appStoreUrl: string;
  playStoreUrl: string;
  installed: boolean;
}

class MobileWalletService {
  private static instance: MobileWalletService;
  private connectedWallet: {
    provider: ethers.JsonRpcProvider | null;
    signer: ethers.Wallet | null;
    address: string | null;
    walletType: string | null;
  } = {
    provider: null,
    signer: null,
    address: null,
    walletType: null,
  };

  public static getInstance(): MobileWalletService {
    if (!MobileWalletService.instance) {
      MobileWalletService.instance = new MobileWalletService();
    }
    return MobileWalletService.instance;
  }

  // Mobile wallet configurations
  private getMobileWallets(): MobileWalletInfo[] {
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        deepLink: 'metamask://',
        appStoreUrl: 'https://apps.apple.com/app/metamask/id1438144202',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
        installed: false,
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        deepLink: 'trust://',
        appStoreUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
        installed: false,
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        deepLink: 'cbwallet://',
        appStoreUrl: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=org.toshi',
        installed: false,
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        deepLink: 'rainbow://',
        appStoreUrl: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=me.rainbow',
        installed: false,
      },
    ];
  }

  // Check if a wallet app is installed
  async checkWalletInstalled(deepLink: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      return canOpen;
    } catch (error) {
      console.log('Error checking wallet installation:', error);
      return false;
    }
  }

  // Get wallet information with installation status
  async getWalletInfo(): Promise<MobileWalletInfo[]> {
    const wallets = this.getMobileWallets();
    const walletInfo = await Promise.all(
      wallets.map(async (wallet) => ({
        ...wallet,
        installed: await this.checkWalletInstalled(wallet.deepLink),
      }))
    );
    return walletInfo;
  }

  // Connect to MetaMask mobile
  async connectMetaMask(): Promise<boolean> {
    try {
      const metamaskWallet = this.getMobileWallets().find(w => w.id === 'metamask');
      if (!metamaskWallet) return false;

      const isInstalled = await this.checkWalletInstalled(metamaskWallet.deepLink);
      
      if (isInstalled) {
        // Open MetaMask app
        await Linking.openURL(metamaskWallet.deepLink);
        
        // Show instructions for manual connection
        Alert.alert(
          'Connect to MetaMask',
          'MetaMask app has been opened. Please:\n\n1. Open MetaMask app\n2. Go to Settings > Advanced > Developer Options\n3. Enable "Custom RPC"\n4. Add Celo Alfajores network:\n   - Network Name: Celo Alfajores\n   - RPC URL: https://alfajores-forno.celo-testnet.org\n   - Chain ID: 44787\n   - Currency Symbol: CELO\n\n5. Return to this app and try connecting again',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'I\'ve Added the Network', 
              onPress: () => this.handleManualConnection('metamask')
            }
          ]
        );
        return true;
      } else {
        // Show install option
        this.showInstallOption(metamaskWallet);
        return false;
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      Alert.alert('Error', 'Failed to connect to MetaMask');
      return false;
    }
  }

  // Connect to Trust Wallet
  async connectTrustWallet(): Promise<boolean> {
    try {
      const trustWallet = this.getMobileWallets().find(w => w.id === 'trust');
      if (!trustWallet) return false;

      const isInstalled = await this.checkWalletInstalled(trustWallet.deepLink);
      
      if (isInstalled) {
        // Open Trust Wallet app
        await Linking.openURL(trustWallet.deepLink);
        
        Alert.alert(
          'Connect to Trust Wallet',
          'Trust Wallet app has been opened. Please:\n\n1. Open Trust Wallet app\n2. Go to Settings > Networks\n3. Add Celo Alfajores network\n4. Return to this app and try connecting again',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'I\'ve Added the Network', 
              onPress: () => this.handleManualConnection('trust')
            }
          ]
        );
        return true;
      } else {
        this.showInstallOption(trustWallet);
        return false;
      }
    } catch (error) {
      console.error('Trust Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect to Trust Wallet');
      return false;
    }
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet(): Promise<boolean> {
    try {
      const coinbaseWallet = this.getMobileWallets().find(w => w.id === 'coinbase');
      if (!coinbaseWallet) return false;

      const isInstalled = await this.checkWalletInstalled(coinbaseWallet.deepLink);
      
      if (isInstalled) {
        await Linking.openURL(coinbaseWallet.deepLink);
        
        Alert.alert(
          'Connect to Coinbase Wallet',
          'Coinbase Wallet app has been opened. Please add Celo Alfajores network and return to this app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'I\'ve Added the Network', 
              onPress: () => this.handleManualConnection('coinbase')
            }
          ]
        );
        return true;
      } else {
        this.showInstallOption(coinbaseWallet);
        return false;
      }
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect to Coinbase Wallet');
      return false;
    }
  }

  // Handle manual connection after user adds network
  private async handleManualConnection(walletType: string): Promise<void> {
    Alert.alert(
      'Manual Connection',
      'For now, please use the demo wallet connection. In a production app, this would integrate with WalletConnect or the wallet\'s SDK for automatic connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Demo Wallet', 
          onPress: () => this.connectDemoWallet(walletType)
        }
      ]
    );
  }

  // Connect demo wallet for testing
  private async connectDemoWallet(walletType: string): Promise<void> {
    try {
      // Use a demo private key for testing
      const demoPrivateKey = '0x7ce93d1cea9c8e3281af7c8e51b724c437711b0f1aafdb28a2a17fa8b317368b';
      
      // Create provider and signer
      const provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org');
      const signer = new ethers.Wallet(demoPrivateKey, provider);
      const address = await signer.getAddress();

      this.connectedWallet = {
        provider,
        signer,
        address,
        walletType,
      };

      Alert.alert(
        'Demo Wallet Connected',
        `Connected to ${walletType} (Demo Mode)\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}\n\nThis is a demo connection for testing purposes.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Demo wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect demo wallet');
    }
  }

  // Show install option for wallet
  private showInstallOption(wallet: MobileWalletInfo): void {
    const storeUrl = Platform.OS === 'ios' ? wallet.appStoreUrl : wallet.playStoreUrl;
    
    Alert.alert(
      `Install ${wallet.name}`,
      `${wallet.name} is not installed on your device. Would you like to install it?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Install', 
          onPress: () => Linking.openURL(storeUrl)
        }
      ]
    );
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean;
    address: string | null;
    walletType: string | null;
    provider: ethers.JsonRpcProvider | null;
    signer: ethers.Wallet | null;
  } {
    return {
      connected: !!this.connectedWallet.signer,
      address: this.connectedWallet.address,
      walletType: this.connectedWallet.walletType,
      provider: this.connectedWallet.provider,
      signer: this.connectedWallet.signer,
    };
  }

  // Disconnect wallet
  disconnect(): void {
    this.connectedWallet = {
      provider: null,
      signer: null,
      address: null,
      walletType: null,
    };
    console.log('Mobile wallet disconnected');
  }

  // Get account balance
  async getBalance(): Promise<string> {
    if (!this.connectedWallet.provider || !this.connectedWallet.address) {
      return '0';
    }

    try {
      const balance = await this.connectedWallet.provider.getBalance(this.connectedWallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }
}

export default MobileWalletService.getInstance();
