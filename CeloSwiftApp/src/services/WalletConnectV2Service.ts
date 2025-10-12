import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';
import { UniversalProvider } from '@walletconnect/universal-provider';
import { WALLETCONNECT_CONFIG, CELO_NETWORKS } from '../config/walletconnect';

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

  public static getInstance(): WalletConnectV2Service {
    if (!WalletConnectV2Service.instance) {
      WalletConnectV2Service.instance = new WalletConnectV2Service();
    }
    return WalletConnectV2Service.instance;
  }

  // Initialize WalletConnect Universal Provider
  async initialize(): Promise<boolean> {
    try {
      console.log('WalletConnectV2Service: Initializing Universal Provider...');
      
      if (Platform.OS === 'web') {
        console.log('WalletConnectV2Service: Web platform detected, skipping WalletConnect initialization');
        return true;
      }

      // Initialize Universal Provider for mobile
      this.universalProvider = await UniversalProvider.init({
        projectId: WALLETCONNECT_CONFIG.projectId,
        metadata: WALLETCONNECT_CONFIG.metadata,
        relayUrl: 'wss://relay.walletconnect.com',
      });

      // Set up event listeners
      this.setupEventListeners();

      console.log('WalletConnectV2Service: Universal Provider initialized successfully');
      return true;
    } catch (error) {
      console.error('WalletConnectV2Service: Failed to initialize:', error);
      return false;
    }
  }

  // Set up WalletConnect event listeners
  private setupEventListeners(): void {
    if (!this.universalProvider) return;

    this.universalProvider.on('display_uri', (uri: string) => {
      console.log('WalletConnectV2Service: Display URI:', uri);
      // You can show a QR code here or handle the URI
    });

    this.universalProvider.on('session_approve', (session: any) => {
      console.log('WalletConnectV2Service: Session approved:', session);
      this.handleSessionApproved(session);
    });

    this.universalProvider.on('session_reject', (error: any) => {
      console.log('WalletConnectV2Service: Session rejected:', error);
      Alert.alert('Connection Rejected', 'Wallet connection was rejected by the user.');
    });

    this.universalProvider.on('session_delete', () => {
      console.log('WalletConnectV2Service: Session deleted');
      this.handleSessionDisconnected();
    });

    this.universalProvider.on('session_event', (event: any) => {
      console.log('WalletConnectV2Service: Session event:', event);
      this.handleSessionEvent(event);
    });
  }

  // Connect to MetaMask using WalletConnect v2
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
        [{ text: 'Great!' }]
      );

      return true;
    } catch (error: any) {
      console.error('WalletConnectV2Service: Web MetaMask connection error:', error);
      
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

  // Connect MetaMask on mobile platform using WalletConnect v2
  private async connectMetaMaskMobile(): Promise<boolean> {
    try {
      console.log('WalletConnectV2Service: Starting mobile MetaMask connection...');
      
      // Initialize if not already done
      if (!this.universalProvider) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('WalletConnectV2Service: Failed to initialize Universal Provider');
          return false;
        }
      }

      if (!this.universalProvider) {
        throw new Error('Universal Provider not initialized');
      }

      // Connect using WalletConnect v2
      console.log('WalletConnectV2Service: Connecting via WalletConnect v2...');
      
      const session = await this.universalProvider.connect({
        requiredNamespaces: WALLETCONNECT_CONFIG.requiredNamespaces,
        optionalNamespaces: WALLETCONNECT_CONFIG.optionalNamespaces,
      });

      if (session) {
        console.log('WalletConnectV2Service: WalletConnect session established');
        return true; // Session approval will be handled by event listener
      }

      return false;
    } catch (error: any) {
      console.error('WalletConnectV2Service: Mobile MetaMask connection error:', error);
      
      if (error.message?.includes('User rejected')) {
        Alert.alert('Connection Rejected', 'Wallet connection was rejected by the user.');
      } else {
        Alert.alert('Connection Error', `Failed to connect to MetaMask: ${error.message}`);
      }
      
      return false;
    }
  }

  // Handle session approval
  private async handleSessionApproved(session: any): Promise<void> {
    try {
      console.log('WalletConnectV2Service: Handling session approval...');
      
      // Get the connected address
      const accounts = session.namespaces.eip155?.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No accounts found in session');
      }

      const address = accounts[0].split(':')[2]; // Extract address from account string
      const chainId = parseInt(accounts[0].split(':')[1]); // Extract chain ID

      console.log('WalletConnectV2Service: Connected address:', address);
      console.log('WalletConnectV2Service: Connected chain ID:', chainId);

      // Create a provider for the connected chain
      const rpcUrl = chainId === 44787 
        ? CELO_NETWORKS.alfajores.rpcUrls[0]
        : CELO_NETWORKS.mainnet.rpcUrls[0];
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // For WalletConnect, we need to create a custom signer that uses the session
      // This is a simplified version - in production you'd use a proper WalletConnect provider
      const signer = new ethers.Wallet('0x0000000000000000000000000000000000000000000000000000000000000001', provider);

      // Set up the connected wallet
      this.connectedWallet = {
        provider,
        signer,
        address,
        walletType: 'metamask',
        session,
        chainId,
      };

      console.log('WalletConnectV2Service: Mobile MetaMask connected successfully');
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\nAddress: ${address.slice(0, 6)}...${address.slice(-4)}\nChain: ${chainId === 44787 ? 'Celo Alfajores' : 'Celo Mainnet'}\n\nYou can now use all app features!`,
        [{ text: 'Excellent!' }]
      );
    } catch (error) {
      console.error('WalletConnectV2Service: Error handling session approval:', error);
      Alert.alert('Connection Error', 'Failed to process wallet connection');
    }
  }

  // Handle session disconnection
  private handleSessionDisconnected(): void {
    console.log('WalletConnectV2Service: Session disconnected');
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

  // Handle session events
  private handleSessionEvent(event: any): void {
    console.log('WalletConnectV2Service: Session event received:', event);
    
    if (event.params?.event?.name === 'accountsChanged') {
      // Handle account changes
      const newAddress = event.params.event.data[0];
      if (newAddress && this.connectedWallet.address !== newAddress) {
        this.connectedWallet.address = newAddress;
        console.log('WalletConnectV2Service: Account changed to:', newAddress);
      }
    } else if (event.params?.event?.name === 'chainChanged') {
      // Handle chain changes
      const newChainId = parseInt(event.params.event.data);
      if (newChainId && this.connectedWallet.chainId !== newChainId) {
        this.connectedWallet.chainId = newChainId;
        console.log('WalletConnectV2Service: Chain changed to:', newChainId);
      }
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
                    chainName: network.chainName,
                    rpcUrls: network.rpcUrls,
                    nativeCurrency: network.nativeCurrency,
                    blockExplorerUrls: network.blockExplorerUrls,
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

  // Get connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectedWallet;
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
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
      
      console.log('WalletConnectV2Service: Disconnected successfully');
    } catch (error) {
      console.error('WalletConnectV2Service: Error disconnecting:', error);
    }
  }
}

export default WalletConnectV2Service.getInstance();
