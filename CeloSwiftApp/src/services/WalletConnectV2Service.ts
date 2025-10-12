import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';
import { WALLETCONNECT_CONFIG, CELO_NETWORKS } from '../config/walletconnect';
import { UniversalProvider } from '@walletconnect/universal-provider';
import { WalletConnectModal } from '@walletconnect/modal-react-native';

interface ConnectionStatus {
  connected: boolean;
  address: string | null;
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.Wallet | null;
  walletType: string | null;
  session: any;
  chainId: number | null;
}

class WalletConnectV2Service {
  private static instance: WalletConnectV2Service;
  private connectedWallet: ConnectionStatus = {
    connected: false,
    address: null,
    provider: null,
    signer: null,
    walletType: null,
    session: null,
    chainId: null,
  };
  private universalProvider: UniversalProvider | null = null;
  private walletConnectModal: WalletConnectModal | null = null;

  public static getInstance(): WalletConnectV2Service {
    if (!WalletConnectV2Service.instance) {
      WalletConnectV2Service.instance = new WalletConnectV2Service();
    }
    return WalletConnectV2Service.instance;
  }

  // Initialize WalletConnect v2
  async initialize(): Promise<boolean> {
    try {
      console.log('WalletConnectV2Service: Initializing WalletConnect v2...');
      
      if (Platform.OS === 'web') {
        console.log('WalletConnectV2Service: Web platform detected, skipping mobile WalletConnect initialization');
        return true;
      }

      // Initialize Universal Provider
      this.universalProvider = await UniversalProvider.init({
        projectId: WALLETCONNECT_CONFIG.projectId,
        metadata: WALLETCONNECT_CONFIG.metadata,
        relayUrl: 'wss://relay.walletconnect.com',
      });

      // Initialize WalletConnect Modal
      this.walletConnectModal = new WalletConnectModal({
        projectId: WALLETCONNECT_CONFIG.projectId,
        providerMetadata: WALLETCONNECT_CONFIG.metadata,
      });

      // Set up event listeners
      this.setupEventListeners();

      console.log('WalletConnectV2Service: WalletConnect v2 initialized successfully');
      return true;
    } catch (error) {
      console.error('WalletConnectV2Service: Failed to initialize WalletConnect v2:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.universalProvider) return;

    this.universalProvider.on('display_uri', (uri: string) => {
      console.log('WalletConnectV2Service: Display URI:', uri);
      // Show QR code or deep link
      this.showConnectionOptions(uri);
    });

    this.universalProvider.on('connect', (session: any) => {
      console.log('WalletConnectV2Service: Connected to wallet:', session);
      this.handleConnection(session);
    });

    this.universalProvider.on('disconnect', () => {
      console.log('WalletConnectV2Service: Disconnected from wallet');
      this.handleDisconnection();
    });

    this.universalProvider.on('session_update', (session: any) => {
      console.log('WalletConnectV2Service: Session updated:', session);
      this.handleConnection(session);
    });
  }

  private showConnectionOptions(uri: string): void {
    Alert.alert(
      'Connect to MetaMask',
      'Choose how to connect:',
      [
        {
          text: 'Open MetaMask App',
          onPress: () => {
            // Open MetaMask app with deep link
            const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
            Linking.openURL(deepLink);
          }
        },
        {
          text: 'Copy Link',
          onPress: () => {
            // Copy URI to clipboard (you might want to use a clipboard library)
            console.log('URI to copy:', uri);
            Alert.alert('URI Copied', 'Connection URI copied to console');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  private handleConnection(session: any): void {
    try {
      const accounts = session.namespaces.eip155?.accounts || [];
      if (accounts.length > 0) {
        const address = accounts[0].split(':')[2]; // Extract address from caip format
        
        // Create provider from WalletConnect session
        const provider = new ethers.JsonRpcProvider(CELO_NETWORKS.alfajores.rpcUrl);
        
        // For WalletConnect, we need to use the universal provider for signing
        // This is a simplified approach - in production you'd use the proper WalletConnect provider
        const signer = new ethers.Wallet('0x0000000000000000000000000000000000000000000000000000000000000000', provider);
        
        this.connectedWallet = {
          connected: true,
          address,
          provider,
          signer,
          walletType: 'metamask',
          session,
          chainId: 44787,
        };

        console.log('WalletConnectV2Service: Real MetaMask connected:', address);
        
        Alert.alert(
          'MetaMask Connected!',
          `Successfully connected to MetaMask!\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}`,
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('WalletConnectV2Service: Error handling connection:', error);
    }
  }

  private handleDisconnection(): void {
    this.connectedWallet = {
      connected: false,
      address: null,
      provider: null,
      signer: null,
      walletType: null,
      session: null,
      chainId: null,
    };
  }

  // Connect to MetaMask (handles both web and mobile)
  async connectMetaMask(): Promise<boolean> {
    try {
      console.log('WalletConnectV2Service: Starting MetaMask connection...');
      
      if (Platform.OS === 'web') {
        return await this.connectMetaMaskWeb();
      } else {
        return await this.connectMetaMaskMobile();
      }
    } catch (error) {
      console.error('WalletConnectV2Service: MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask');
      return false;
    }
  }

  // Connect MetaMask on web platform (using window.ethereum)
  private async connectMetaMaskWeb(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        Alert.alert('MetaMask Not Found', 'Please install MetaMask browser extension to connect.');
        return false;
      }

      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        Alert.alert('No Accounts', 'No MetaMask accounts found. Please create an account in MetaMask.');
        return false;
      }
      const address = accounts[0];
      const signer = await provider.getSigner();

      // Ensure Celo Alfajores network
      await this.ensureCeloAlfajoresNetwork(ethereum);

      this.connectedWallet = {
        connected: true,
        provider: provider as any,
        signer: signer as any,
        address,
        walletType: 'metamask',
        session: { id: 'metamask-web-session' },
        chainId: 44787,
      };

      console.log('WalletConnectV2Service: Web MetaMask connected successfully:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}\n\nYou can now use all app features!`,
        [{ text: 'Excellent!' }]
      );

      return true;
    } catch (error) {
      console.error('WalletConnectV2Service: Web MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask on web');
      return false;
    }
  }

  // Connect MetaMask on mobile platform (using WalletConnect v2)
  private async connectMetaMaskMobile(): Promise<boolean> {
    try {
      console.log('WalletConnectV2Service: Starting mobile MetaMask connection...');
      
      if (!this.universalProvider) {
        Alert.alert('WalletConnect Not Ready', 'WalletConnect is not initialized. Please try again.');
        return false;
      }

      // Check if MetaMask mobile app is installed
      const metamaskInstalled = await this.checkWalletInstalled('metamask://');
      console.log('WalletConnectV2Service: MetaMask installed:', metamaskInstalled);
      
      if (!metamaskInstalled) {
        console.log('WalletConnectV2Service: MetaMask not installed, showing install option');
        this.showInstallMetaMask();
        return false;
      }

      // Connect using WalletConnect v2
      const session = await this.universalProvider.connect({
        namespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_requestAccounts'],
            chains: ['eip155:44787'], // Celo Alfajores
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      console.log('WalletConnectV2Service: WalletConnect session established:', session);
      return true;
    } catch (error) {
      console.error('WalletConnectV2Service: Mobile MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask on mobile');
      return false;
    }
  }

  // Ensure Celo Alfajores network is active (web only)
  private async ensureCeloAlfajoresNetwork(ethereum: any): Promise<void> {
    const CELO_ALFAJORES_CHAIN_ID = '0xaef3'; // 44787 in hex
    const network = CELO_NETWORKS.alfajores;

    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });

      if (chainId !== CELO_ALFAJORES_CHAIN_ID) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CELO_ALFAJORES_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: CELO_ALFAJORES_CHAIN_ID,
                    chainName: network.name,
                    rpcUrls: [network.rpcUrl],
                    nativeCurrency: network.currency,
                    blockExplorerUrls: [network.blockExplorerUrl],
                  },
                ],
              });
            } catch (addError) {
              console.error('Failed to add Celo Alfajores network:', addError);
              Alert.alert('Network Error', 'Failed to add Celo Alfajores network. Please add it manually.');
              throw addError;
            }
          } else {
            console.error('Failed to switch to Celo Alfajores network:', switchError);
            Alert.alert('Network Error', 'Failed to switch to Celo Alfajores network. Please switch it manually.');
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

  // Get connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectedWallet;
  }

  // Disconnect wallet
  async disconnect() {
    try {
      if (this.universalProvider && this.connectedWallet.session) {
        await this.universalProvider.disconnect();
      }
      
      this.connectedWallet = {
        connected: false,
        address: null,
        provider: null,
        signer: null,
        walletType: null,
        session: null,
        chainId: null,
      };
      console.log('WalletConnectV2Service: Wallet disconnected');
    } catch (error) {
      console.error('WalletConnectV2Service: Error disconnecting:', error);
    }
  }
}

export default WalletConnectV2Service.getInstance();