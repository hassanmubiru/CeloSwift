import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';

interface ConnectionStatus {
  connected: boolean;
  address: string | null;
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.Wallet | null;
  walletType: string | null;
  session: any;
}

class WalletConnectService {
  private static instance: WalletConnectService;
  private connectedWallet: ConnectionStatus = {
    connected: false,
    address: null,
    provider: null,
    signer: null,
    walletType: null,
    session: null,
  };
  public static getInstance(): WalletConnectService {
    if (!WalletConnectService.instance) {
      WalletConnectService.instance = new WalletConnectService();
    }
    return WalletConnectService.instance;
  }

  // Connect to MetaMask using real connection
  async connectMetaMask(): Promise<boolean> {
    try {
      console.log('WalletConnectService: Starting real MetaMask connection...');
      
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        return await this.connectMetaMaskWeb();
      } else {
        return await this.connectMetaMaskMobile();
      }
    } catch (error) {
      console.error('WalletConnectService: MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask');
      return false;
    }
  }

  // Connect MetaMask on web platform
  private async connectMetaMaskWeb(): Promise<boolean> {
    try {
      // Check if MetaMask is available
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        Alert.alert('MetaMask Not Found', 'Please install MetaMask browser extension to connect.');
        return false;
      }

      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        Alert.alert('No Accounts', 'No MetaMask accounts found. Please create an account in MetaMask.');
        return false;
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check and switch to Celo Alfajores network
      await this.ensureCeloAlfajoresNetwork(ethereum);

      // Set up the connected wallet
      this.connectedWallet = {
        provider: provider as any, // Type conversion for compatibility
        signer: signer as any,
        address,
        walletType: 'metamask',
        session: { id: 'metamask-web-session' },
      };

      console.log('WalletConnectService: MetaMask connected successfully:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}\n\nYou can now use all app features!`,
        [{ text: 'Great!' }]
      );

      return true;
    } catch (error: any) {
      console.error('WalletConnectService: Web MetaMask connection error:', error);
      
      if (error.code === 4001) {
        Alert.alert('Connection Rejected', 'MetaMask connection was rejected. Please try again and approve the connection.');
      } else if (error.code === -32002) {
        Alert.alert('Connection Pending', 'MetaMask connection is already pending. Please check MetaMask and approve the connection.');
      } else {
        Alert.alert('Connection Error', `Failed to connect to MetaMask: ${error.message}`);
      }
      
      return false;
    }
  }

  // Connect MetaMask on mobile platform
  private async connectMetaMaskMobile(): Promise<boolean> {
    try {
      console.log('WalletConnectService: Starting mobile MetaMask connection...');
      
      // Check if MetaMask mobile app is installed
      const metamaskInstalled = await this.checkWalletInstalled('metamask://');
      console.log('WalletConnectService: MetaMask installed:', metamaskInstalled);
      
      if (!metamaskInstalled) {
        console.log('WalletConnectService: MetaMask not installed, showing install option');
        this.showInstallMetaMask();
        return false;
      }

      // For mobile, we need to show a clear message about the current limitations
      // and provide a working solution for development/testing
      Alert.alert(
        'MetaMask Mobile Connection',
        'MetaMask mobile connection requires WalletConnect v2 integration.\n\nFor development and testing:\n\n1. Use MetaMask browser extension on desktop\n2. Or use the web version of this app\n3. Mobile WalletConnect integration coming soon\n\nWould you like to open MetaMask app for setup?',
        [
          { 
            text: 'Open MetaMask', 
            onPress: () => {
              Linking.openURL('metamask://');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );

      return false; // Return false since real mobile connection requires WalletConnect v2
    } catch (error) {
      console.error('WalletConnectService: Mobile MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask on mobile');
      return false;
    }
  }

  // Connect to Trust Wallet
  async connectTrustWallet(): Promise<boolean> {
    try {
      const trustInstalled = await this.checkWalletInstalled('trust://');
      
      if (!trustInstalled) {
        this.showInstallTrustWallet();
        return false;
      }

      Alert.alert(
        'Trust Wallet Connection',
        'Trust Wallet connection requires WalletConnect v2 implementation. This feature is coming soon.\n\nFor now, please use MetaMask or connect via web browser.',
        [
          { 
            text: 'Open Trust Wallet', 
            onPress: () => {
              Linking.openURL('trust://');
            }
          },
          { text: 'OK' }
        ]
      );

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
      const coinbaseInstalled = await this.checkWalletInstalled('cbwallet://');
      
      if (!coinbaseInstalled) {
        this.showInstallCoinbaseWallet();
        return false;
      }

      Alert.alert(
        'Coinbase Wallet Connection',
        'Coinbase Wallet connection requires WalletConnect v2 implementation. This feature is coming soon.\n\nFor now, please use MetaMask or connect via web browser.',
        [
          { 
            text: 'Open Coinbase Wallet', 
            onPress: () => {
              Linking.openURL('cbwallet://');
            }
          },
          { text: 'OK' }
        ]
      );

      return false;
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect to Coinbase Wallet');
      return false;
    }
  }

  // Ensure Celo Alfajores network is active
  private async ensureCeloAlfajoresNetwork(ethereum: any): Promise<void> {
    const CELO_ALFAJORES_CHAIN_ID = '0xaef3'; // 44787 in hex
    const CELO_ALFAJORES_RPC_URL = 'https://alfajores-forno.celo-testnet.org';
    const CELO_ALFAJORES_CHAIN_NAME = 'Celo Alfajores Testnet';
    const CELO_ALFAJORES_CURRENCY_SYMBOL = 'CELO';
    const CELO_ALFAJORES_BLOCK_EXPLORER_URL = 'https://alfajores.celoscan.io';

    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });

      if (chainId !== CELO_ALFAJORES_CHAIN_ID) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CELO_ALFAJORES_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: CELO_ALFAJORES_CHAIN_ID,
                    chainName: CELO_ALFAJORES_CHAIN_NAME,
                    rpcUrls: [CELO_ALFAJORES_RPC_URL],
                    nativeCurrency: {
                      name: CELO_ALFAJORES_CURRENCY_SYMBOL,
                      symbol: CELO_ALFAJORES_CURRENCY_SYMBOL,
                      decimals: 18,
                    },
                    blockExplorerUrls: [CELO_ALFAJORES_BLOCK_EXPLORER_URL],
                  },
                ],
              });
            } catch (addError) {
              console.error('Failed to add Celo Alfajores network:', addError);
              Alert.alert('Network Error', 'Failed to add Celo Alfajores network to MetaMask. Please add it manually.');
              throw addError;
            }
          } else {
            console.error('Failed to switch to Celo Alfajores network:', switchError);
            Alert.alert('Network Error', 'Failed to switch to Celo Alfajores network. Please switch it manually in MetaMask.');
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring Celo Alfajores network:', error);
      throw error;
    }
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

  // Get connection status
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
      session: null,
    };
    console.log('WalletConnect service disconnected');
  }
}

export default WalletConnectService.getInstance();