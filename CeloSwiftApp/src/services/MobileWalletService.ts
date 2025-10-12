import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';
import WalletConnectService from './WalletConnectService';

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
      console.log('Starting MetaMask connection...');
      const metamaskWallet = this.getMobileWallets().find(w => w.id === 'metamask');
      if (!metamaskWallet) {
        console.log('MetaMask wallet not found in configuration');
        return false;
      }

      const isInstalled = await this.checkWalletInstalled(metamaskWallet.deepLink);
      console.log('MetaMask installed:', isInstalled);
      
      if (isInstalled) {
        // Use WalletConnect service for connection
        console.log('Calling WalletConnectService.connectMetaMask()...');
        const success = await WalletConnectService.connectMetaMask();
        console.log('WalletConnectService.connectMetaMask() result:', success);
        
        if (success) {
          // Check if we actually connected
          const connectionStatus = WalletConnectService.getConnectionStatus();
          console.log('WalletConnect connection status:', connectionStatus);
          
          if (connectionStatus.connected) {
            this.connectedWallet = {
              provider: connectionStatus.provider,
              signer: connectionStatus.signer,
              address: connectionStatus.address,
              walletType: connectionStatus.walletType,
            };
            console.log('MetaMask connected successfully');
            return true;
          }
        }
        
        // If we get here, either the user cancelled or chose "Open MetaMask"
        // For "Open MetaMask", we should not treat this as a failure
        console.log('MetaMask connection process completed (user may have opened app or cancelled)');
        return false;
      } else {
        // Show install option
        console.log('MetaMask not installed, showing install option');
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
        // Use WalletConnect service for connection
        const success = await WalletConnectService.connectTrustWallet();
        if (success) {
          // Check if we actually connected
          const connectionStatus = WalletConnectService.getConnectionStatus();
          if (connectionStatus.connected) {
            this.connectedWallet = {
              provider: connectionStatus.provider,
              signer: connectionStatus.signer,
              address: connectionStatus.address,
              walletType: connectionStatus.walletType,
            };
            return true;
          }
        }
        return false;
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
        // Use WalletConnect service for connection
        const success = await WalletConnectService.connectCoinbaseWallet();
        if (success) {
          // Check if we actually connected
          const connectionStatus = WalletConnectService.getConnectionStatus();
          if (connectionStatus.connected) {
            this.connectedWallet = {
              provider: connectionStatus.provider,
              signer: connectionStatus.signer,
              address: connectionStatus.address,
              walletType: connectionStatus.walletType,
            };
            return true;
          }
        }
        return false;
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
      'Connection Required',
      'Please ensure your wallet is properly configured with the Celo Alfajores network and try connecting again.',
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
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
