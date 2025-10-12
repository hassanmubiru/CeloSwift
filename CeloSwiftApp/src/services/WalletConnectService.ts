import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';

interface WalletConnectConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

class WalletConnectService {
  private static instance: WalletConnectService;
  private connectedWallet: {
    provider: ethers.JsonRpcProvider | null;
    signer: ethers.Wallet | null;
    address: string | null;
    walletType: string | null;
    session: any | null;
  } = {
    provider: null,
    signer: null,
    address: null,
    walletType: null,
    session: null,
  };

  private config: WalletConnectConfig = {
    projectId: 'your-walletconnect-project-id', // You'll need to get this from WalletConnect Cloud
    metadata: {
      name: 'CeloSwift',
      description: 'Mobile-first decentralized remittance application on Celo',
      url: 'https://celoswift.app',
      icons: ['https://celoswift.app/icon.png'],
    },
  };

  public static getInstance(): WalletConnectService {
    if (!WalletConnectService.instance) {
      WalletConnectService.instance = new WalletConnectService();
    }
    return WalletConnectService.instance;
  }

  // Initialize WalletConnect (simplified version for now)
  async initializeWalletConnect(): Promise<boolean> {
    try {
      // For now, we'll use a simplified approach
      // In a full implementation, you'd use @walletconnect/modal-react-native
      console.log('WalletConnect initialization would happen here');
      return true;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      return false;
    }
  }

  // Connect to MetaMask using WalletConnect
  async connectMetaMask(): Promise<boolean> {
    try {
      console.log('WalletConnectService: Starting MetaMask connection...');
      // Check if MetaMask is available
      const metamaskInstalled = await this.checkWalletInstalled('metamask://');
      console.log('WalletConnectService: MetaMask installed:', metamaskInstalled);
      
      if (metamaskInstalled) {
        // For now, show instructions for manual connection
        // In a full implementation, this would use WalletConnect
        console.log('WalletConnectService: Showing MetaMask connection dialog...');
        
        // Create a promise that resolves when the user makes a choice
        return new Promise((resolve) => {
          Alert.alert(
            'MetaMask Connection',
            'To connect MetaMask to CeloSwift:\n\n1. Open MetaMask app\n2. Tap "Connect" or scan QR code\n3. Add Celo Alfajores network if not already added:\n   - Network Name: Celo Alfajores\n   - RPC URL: https://alfajores-forno.celo-testnet.org\n   - Chain ID: 44787\n   - Currency Symbol: CELO\n\n4. Approve the connection request',
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => {
                  console.log('WalletConnectService: User cancelled MetaMask connection');
                  resolve(false);
                }
              },
              { 
                text: 'Open MetaMask', 
                onPress: () => {
                  console.log('WalletConnectService: User chose to open MetaMask app');
                  this.openMetaMaskApp();
                  // Show additional instructions after opening the app
                  setTimeout(() => {
                    Alert.alert(
                      'MetaMask Opened',
                      'MetaMask app has been opened. Please:\n\n1. Add Celo Alfajores network if not already added\n2. Return to this app\n3. Try connecting again and choose "Simulate Connection" for testing',
                      [{ text: 'OK' }]
                    );
                  }, 1000);
                  resolve(false); // Not actually connected yet
                }
              },
              { 
                text: 'Simulate Connection', 
                onPress: async () => {
                  console.log('WalletConnectService: User chose simulation');
                  const success = await this.simulateConnection('metamask');
                  console.log('WalletConnectService: Simulation result:', success);
                  resolve(success);
                }
              }
            ]
          );
        });
      } else {
        console.log('WalletConnectService: MetaMask not installed, showing install option');
        this.showInstallMetaMask();
        return false;
      }
    } catch (error) {
      console.error('WalletConnectService: MetaMask connection error:', error);
      Alert.alert('Error', 'Failed to connect to MetaMask');
      return false;
    }
  }

  // Connect to Trust Wallet
  async connectTrustWallet(): Promise<boolean> {
    try {
      const trustInstalled = await this.checkWalletInstalled('trust://');
      
      if (trustInstalled) {
        return new Promise((resolve) => {
          Alert.alert(
            'Trust Wallet Connection',
            'To connect Trust Wallet to CeloSwift:\n\n1. Open Trust Wallet app\n2. Go to DApp browser\n3. Navigate to CeloSwift or scan QR code\n4. Add Celo Alfajores network if needed\n5. Approve the connection request',
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => resolve(false)
              },
              { 
                text: 'Open Trust Wallet', 
                onPress: () => {
                  this.openTrustWalletApp();
                  resolve(false);
                }
              },
              { 
                text: 'Simulate Connection', 
                onPress: async () => {
                  const success = await this.simulateConnection('trust');
                  resolve(success);
                }
              }
            ]
          );
        });
      } else {
        this.showInstallTrustWallet();
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
      const coinbaseInstalled = await this.checkWalletInstalled('cbwallet://');
      
      if (coinbaseInstalled) {
        return new Promise((resolve) => {
          Alert.alert(
            'Coinbase Wallet Connection',
            'To connect Coinbase Wallet to CeloSwift:\n\n1. Open Coinbase Wallet app\n2. Go to DApp browser\n3. Navigate to CeloSwift or scan QR code\n4. Add Celo Alfajores network if needed\n5. Approve the connection request',
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => resolve(false)
              },
              { 
                text: 'Open Coinbase Wallet', 
                onPress: () => {
                  this.openCoinbaseWalletApp();
                  resolve(false);
                }
              },
              { 
                text: 'Simulate Connection', 
                onPress: async () => {
                  const success = await this.simulateConnection('coinbase');
                  resolve(success);
                }
              }
            ]
          );
        });
      } else {
        this.showInstallCoinbaseWallet();
        return false;
      }
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect to Coinbase Wallet');
      return false;
    }
  }

  // Check if wallet app is installed
  private async checkWalletInstalled(deepLink: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      return canOpen;
    } catch (error) {
      console.log('Error checking wallet installation:', error);
      return false;
    }
  }

  // Open MetaMask app
  private async openMetaMaskApp(): Promise<void> {
    try {
      await Linking.openURL('metamask://');
    } catch (error) {
      console.error('Failed to open MetaMask app:', error);
      Alert.alert('Error', 'Failed to open MetaMask app');
    }
  }

  // Open Trust Wallet app
  private async openTrustWalletApp(): Promise<void> {
    try {
      await Linking.openURL('trust://');
    } catch (error) {
      console.error('Failed to open Trust Wallet app:', error);
      Alert.alert('Error', 'Failed to open Trust Wallet app');
    }
  }

  // Open Coinbase Wallet app
  private async openCoinbaseWalletApp(): Promise<void> {
    try {
      await Linking.openURL('cbwallet://');
    } catch (error) {
      console.error('Failed to open Coinbase Wallet app:', error);
      Alert.alert('Error', 'Failed to open Coinbase Wallet app');
    }
  }

  // Show install MetaMask option
  private showInstallMetaMask(): void {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/metamask/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask';
    
    Alert.alert(
      'Install MetaMask',
      'MetaMask is not installed on your device. Would you like to install it?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Install', 
          onPress: () => Linking.openURL(storeUrl)
        }
      ]
    );
  }

  // Show install Trust Wallet option
  private showInstallTrustWallet(): void {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
      : 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp';
    
    Alert.alert(
      'Install Trust Wallet',
      'Trust Wallet is not installed on your device. Would you like to install it?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Install', 
          onPress: () => Linking.openURL(storeUrl)
        }
      ]
    );
  }

  // Show install Coinbase Wallet option
  private showInstallCoinbaseWallet(): void {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/coinbase-wallet/id1278383455'
      : 'https://play.google.com/store/apps/details?id=org.toshi';
    
    Alert.alert(
      'Install Coinbase Wallet',
      'Coinbase Wallet is not installed on your device. Would you like to install it?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Install', 
          onPress: () => Linking.openURL(storeUrl)
        }
      ]
    );
  }

  // Simulate connection (for testing purposes)
  async simulateConnection(walletType: string): Promise<boolean> {
    try {
      console.log('WalletConnectService: Starting simulation for', walletType);
      // This is a temporary solution for testing
      // In production, this would be replaced with actual WalletConnect integration
      const provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org');
      console.log('WalletConnectService: Provider created');
      
      // For testing, we'll use a demo private key
      // In production, this would come from the actual wallet connection
      const demoPrivateKey = '0x7ce93d1cea9c8e3281af7c8e51b724c437711b0f1aafdb28a2a17fa8b317368b';
      const signer = new ethers.Wallet(demoPrivateKey, provider);
      const address = await signer.getAddress();
      console.log('WalletConnectService: Signer created, address:', address);

      this.connectedWallet = {
        provider,
        signer,
        address,
        walletType,
        session: { id: 'demo-session' },
      };
      console.log('WalletConnectService: Wallet connected successfully');

      Alert.alert(
        'Wallet Connected',
        `Connected to ${walletType}\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}\n\nNote: This is a simulated connection for testing. In production, this would use WalletConnect for real wallet integration.`,
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('WalletConnectService: Simulated connection error:', error);
      Alert.alert('Error', 'Failed to simulate wallet connection');
      return false;
    }
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
      session: null,
    };
    console.log('WalletConnect wallet disconnected');
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

export default WalletConnectService.getInstance();
