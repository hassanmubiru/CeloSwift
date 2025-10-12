import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';
import WalletConnectService from './WalletConnectService';

interface MobileWalletInfo {
  id: string;
  name: string;
  deepLink: string;
  appStoreUrl: string;
  playStoreUrl: string;
  icon: string;
  color: string;
}

interface ConnectionStatus {
  connected: boolean;
  address: string | null;
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.Wallet | null;
  walletType: string | null;
}

class MobileWalletService {
  private static instance: MobileWalletService;
  private connectedWallet: ConnectionStatus = {
    connected: false,
    address: null,
    provider: null,
    signer: null,
    walletType: null,
  };

  public static getInstance(): MobileWalletService {
    if (!MobileWalletService.instance) {
      MobileWalletService.instance = new MobileWalletService();
    }
    return MobileWalletService.instance;
  }

  private getMobileWallets(): MobileWalletInfo[] {
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        deepLink: 'metamask://',
        appStoreUrl: 'https://apps.apple.com/app/metamask/id1438144202',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
        icon: 'logo-bitcoin',
        color: '#F6851B',
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        deepLink: 'trust://',
        appStoreUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
        icon: 'shield-checkmark',
        color: '#3375BB',
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        deepLink: 'cbwallet://',
        appStoreUrl: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=org.toshi',
        icon: 'wallet',
        color: '#0052FF',
      },
    ];
  }

  async getWalletInfo(): Promise<any[]> {
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
      console.log('Starting real MetaMask connection...');
      const success = await WalletConnectService.connectMetaMask();
      
      if (success) {
        // Update our connection status
        const connectionStatus = WalletConnectService.getConnectionStatus();
        this.connectedWallet = {
          connected: connectionStatus.connected,
          address: connectionStatus.address,
          provider: connectionStatus.provider,
          signer: connectionStatus.signer,
          walletType: connectionStatus.walletType,
        };
        console.log('MetaMask connected successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('MetaMask connection error:', error);
      Alert.alert('Error', 'Failed to connect to MetaMask');
      return false;
    }
  }

  // Connect to Trust Wallet
  async connectTrustWallet(): Promise<boolean> {
    try {
      const success = await WalletConnectService.connectTrustWallet();
      
      if (success) {
        // Update our connection status
        const connectionStatus = WalletConnectService.getConnectionStatus();
        this.connectedWallet = {
          connected: connectionStatus.connected,
          address: connectionStatus.address,
          provider: connectionStatus.provider,
          signer: connectionStatus.signer,
          walletType: connectionStatus.walletType,
        };
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Trust Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect to Trust Wallet');
      return false;
    }
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet(): Promise<boolean> {
    try {
      const success = await WalletConnectService.connectCoinbaseWallet();
      
      if (success) {
        // Update our connection status
        const connectionStatus = WalletConnectService.getConnectionStatus();
        this.connectedWallet = {
          connected: connectionStatus.connected,
          address: connectionStatus.address,
          provider: connectionStatus.provider,
          signer: connectionStatus.signer,
          walletType: connectionStatus.walletType,
        };
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect to Coinbase Wallet');
      return false;
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectedWallet;
  }

  // Disconnect wallet
  disconnect() {
    this.connectedWallet = {
      connected: false,
      address: null,
      provider: null,
      signer: null,
      walletType: null,
    };
    WalletConnectService.disconnect(); // Also disconnect WalletConnect session
    console.log('Mobile wallet disconnected');
  }

  // Check if wallet app is installed
  private async checkWalletInstalled(deepLink: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      return canOpen;
    } catch (error) {
      console.error('Error checking wallet installation:', error);
      return false;
    }
  }
}

export default MobileWalletService.getInstance();