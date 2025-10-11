import { Linking, Platform } from 'react-native';

export interface WalletInfo {
  id: string;
  name: string;
  installed: boolean;
  deepLink?: string;
  downloadUrl?: string;
  description: string;
}

class WalletDetectionService {
  private static instance: WalletDetectionService;

  public static getInstance(): WalletDetectionService {
    if (!WalletDetectionService.instance) {
      WalletDetectionService.instance = new WalletDetectionService();
    }
    return WalletDetectionService.instance;
  }

  // Check if MetaMask is installed by trying to open it
  async checkMetaMaskInstalled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, check if window.ethereum exists
        return typeof (window as any).ethereum !== 'undefined';
      } else {
        // For mobile, try to open MetaMask deep link
        const metamaskUrl = 'metamask://';
        const canOpen = await Linking.canOpenURL(metamaskUrl);
        return canOpen;
      }
    } catch (error) {
      console.log('Error checking MetaMask installation:', error);
      return false;
    }
  }

  // Check if Coinbase Wallet is installed
  async checkCoinbaseInstalled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return typeof (window as any).coinbaseWalletExtension !== 'undefined';
      } else {
        const coinbaseUrl = 'cbwallet://';
        const canOpen = await Linking.canOpenURL(coinbaseUrl);
        return canOpen;
      }
    } catch (error) {
      console.log('Error checking Coinbase installation:', error);
      return false;
    }
  }

  // Get wallet information with installation status
  async getWalletInfo(): Promise<WalletInfo[]> {
    const [metamaskInstalled, coinbaseInstalled] = await Promise.all([
      this.checkMetaMaskInstalled(),
      this.checkCoinbaseInstalled(),
    ]);

    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        installed: metamaskInstalled,
        deepLink: 'metamask://',
        downloadUrl: 'https://metamask.io/download/',
        description: metamaskInstalled 
          ? 'Connect using your MetaMask wallet' 
          : 'Install MetaMask browser extension to continue',
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        installed: coinbaseInstalled,
        deepLink: 'cbwallet://',
        downloadUrl: 'https://www.coinbase.com/wallet',
        description: coinbaseInstalled 
          ? 'Connect using your Coinbase Wallet' 
          : 'Install Coinbase Wallet extension to continue',
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        installed: true, // Always available
        description: 'Connect using any WalletConnect compatible wallet',
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        installed: true, // Assume available for mobile
        description: 'Connect using Trust Wallet mobile app',
      },
    ];
  }

  // Open MetaMask directly
  async openMetaMask(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, trigger MetaMask connection
        if (typeof (window as any).ethereum !== 'undefined') {
          await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          return true;
        }
        return false;
      } else {
        // For mobile, open MetaMask app
        const metamaskUrl = 'metamask://';
        const canOpen = await Linking.canOpenURL(metamaskUrl);
        if (canOpen) {
          await Linking.openURL(metamaskUrl);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.log('Error opening MetaMask:', error);
      return false;
    }
  }

  // Open Coinbase Wallet directly
  async openCoinbaseWallet(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof (window as any).coinbaseWalletExtension !== 'undefined') {
          await (window as any).coinbaseWalletExtension.request({ method: 'eth_requestAccounts' });
          return true;
        }
        return false;
      } else {
        const coinbaseUrl = 'cbwallet://';
        const canOpen = await Linking.canOpenURL(coinbaseUrl);
        if (canOpen) {
          await Linking.openURL(coinbaseUrl);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.log('Error opening Coinbase Wallet:', error);
      return false;
    }
  }

  // Open download page for wallet
  async openDownloadPage(walletId: string): Promise<void> {
    const downloadUrls: { [key: string]: string } = {
      metamask: 'https://metamask.io/download/',
      coinbase: 'https://www.coinbase.com/wallet',
      trust: 'https://trustwallet.com/',
    };

    const url = downloadUrls[walletId];
    if (url) {
      await Linking.openURL(url);
    }
  }
}

export default WalletDetectionService.getInstance();
