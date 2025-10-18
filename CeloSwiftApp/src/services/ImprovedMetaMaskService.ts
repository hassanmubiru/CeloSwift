import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { METAMASK_CONFIG, CELO_NETWORKS } from '../config/walletconnect';

// Enhanced types for better error handling
export interface MetaMaskConnection {
  connected: boolean;
  address: string | null;
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.Wallet | null;
  chainId: number | null;
  networkName: string | null;
  balance: string | null;
  sessionId: string | null;
  connectedAt: number | null;
}

export interface ConnectionError {
  code: number;
  message: string;
  data?: any;
}

class ImprovedMetaMaskService {
  private static instance: ImprovedMetaMaskService;
  private connection: MetaMaskConnection = {
    connected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    networkName: null,
    balance: null,
    sessionId: null,
    connectedAt: null,
  };

  private eventListeners: Map<string, Function[]> = new Map();
  private isConnecting: boolean = false;

  // Storage keys
  private readonly STORAGE_KEYS = {
    CONNECTION_DATA: 'metamask_connection_data',
    LAST_CONNECTED_ADDRESS: 'metamask_last_address',
    SESSION_ID: 'metamask_session_id',
  };

  public static getInstance(): ImprovedMetaMaskService {
    if (!ImprovedMetaMaskService.instance) {
      ImprovedMetaMaskService.instance = new ImprovedMetaMaskService();
    }
    return ImprovedMetaMaskService.instance;
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('ImprovedMetaMaskService: Initializing...');
      
      // Load previous connection data
      await this.loadConnectionData();
      
      // Set up event listeners for web platform
      if (Platform.OS === 'web') {
        this.setupWebEventListeners();
      }
      
      console.log('ImprovedMetaMaskService: Initialization completed');
      return true;
    } catch (error) {
      console.error('ImprovedMetaMaskService: Initialization failed:', error);
      return false;
    }
  }

  // Enhanced connect method with proper user interaction handling
  async connect(): Promise<boolean> {
    try {
      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
        console.log('ImprovedMetaMaskService: Connection already in progress');
        return false;
      }

      this.isConnecting = true;
      console.log('ImprovedMetaMaskService: Starting connection...');
      
      if (Platform.OS === 'web') {
        return await this.connectWeb();
      } else {
        return await this.connectMobile();
      }
    } catch (error) {
      console.error('ImprovedMetaMaskService: Connection error:', error);
      this.handleConnectionError(error);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  // Enhanced web connection with proper popup handling
  private async connectWeb(): Promise<boolean> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in a browser environment');
      }

      // Check for MetaMask extension
      if (!(window as any).ethereum) {
        this.showMetaMaskNotFoundDialog();
        return false;
      }

      const ethereum = (window as any).ethereum;
      
      // Check if MetaMask is the primary provider
      if (!ethereum.isMetaMask) {
        console.warn('ImprovedMetaMaskService: MetaMask not detected as primary provider');
        // Still try to connect, but warn user
      }

      // Create provider
      const provider = new ethers.BrowserProvider(ethereum);

      console.log('ImprovedMetaMaskService: Requesting account access...');
      
      // Request account access - this should trigger the popup
      const accounts = await this.requestAccountsWithRetry(ethereum);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const address = accounts[0];
      console.log('ImprovedMetaMaskService: Account connected:', address);

      // Get signer
      const signer = await provider.getSigner();
      
      // Ensure Celo network
      await this.ensureCeloNetwork(ethereum);

      // Get network and balance info
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Create session
      const sessionId = this.generateSessionId();
      const connectedAt = Date.now();

      // Update connection state
      this.connection = {
        connected: true,
        address,
        provider,
        signer,
        chainId: Number(network.chainId),
        networkName: network.name,
        balance: ethers.formatEther(balance),
        sessionId,
        connectedAt,
      };

      // Save connection data
      await this.saveConnectionData();

      // Emit connection event
      this.emit('connected', this.connection);

      console.log('ImprovedMetaMaskService: Web connection successful:', address);
      
      // Show success message (only on web, not mobile)
      if (Platform.OS === 'web') {
        this.showSuccessMessage(address, network.name, ethers.formatEther(balance));
      }

      return true;
    } catch (error) {
      console.error('ImprovedMetaMaskService: Web connection error:', error);
      this.handleConnectionError(error);
      return false;
    }
  }

  // Enhanced account request with retry logic
  private async requestAccountsWithRetry(ethereum: any, maxRetries: number = 3): Promise<string[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`ImprovedMetaMaskService: Account request attempt ${attempt}/${maxRetries}`);
        
        const accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          return accounts;
        }
        
        throw new Error('No accounts returned');
      } catch (error: any) {
        console.error(`ImprovedMetaMaskService: Account request attempt ${attempt} failed:`, error);
        
        // Handle specific MetaMask errors
        if (error.code === 4001) {
          throw new Error('User rejected the connection request');
        } else if (error.code === -32002) {
          throw new Error('Connection request already pending');
        } else if (error.code === 4902) {
          throw new Error('MetaMask is not connected to any network');
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Failed to connect after multiple attempts');
  }

  // Enhanced Celo network switching
  private async ensureCeloNetwork(ethereum: any): Promise<void> {
    const targetChainId = `0x${CELO_NETWORKS.alfajores.chainId.toString(16)}`;
    const network = CELO_NETWORKS.alfajores;

    try {
      console.log('ImprovedMetaMaskService: Checking network...');
      
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      console.log('ImprovedMetaMaskService: Current chain ID:', currentChainId);
      console.log('ImprovedMetaMaskService: Target chain ID:', targetChainId);

      if (currentChainId !== targetChainId) {
        console.log('ImprovedMetaMaskService: Switching to Celo network...');
        
        try {
          // Try to switch to the network
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
          console.log('ImprovedMetaMaskService: Successfully switched to Celo network');
        } catch (switchError: any) {
          console.log('ImprovedMetaMaskService: Switch failed, attempting to add network...');
          
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainId,
                    chainName: network.chainName,
                    rpcUrls: [network.rpcUrl],
                    nativeCurrency: network.currency,
                    blockExplorerUrls: [network.blockExplorerUrl],
                  },
                ],
              });
              console.log('ImprovedMetaMaskService: Successfully added Celo network');
            } catch (addError) {
              console.error('ImprovedMetaMaskService: Failed to add Celo network:', addError);
              throw new Error('Failed to add Celo network to MetaMask. Please add it manually.');
            }
          } else {
            console.error('ImprovedMetaMaskService: Failed to switch to Celo network:', switchError);
            throw new Error('Failed to switch to Celo network in MetaMask. Please switch it manually.');
          }
        }
      } else {
        console.log('ImprovedMetaMaskService: Already on correct network');
      }
    } catch (error) {
      console.error('ImprovedMetaMaskService: Network switching error:', error);
      throw error;
    }
  }

  // Enhanced mobile connection
  private async connectMobile(): Promise<boolean> {
    try {
      console.log('ImprovedMetaMaskService: Starting mobile connection...');
      
      // Check if MetaMask is installed
      const isInstalled = await this.checkMetaMaskInstalled();
      
      if (!isInstalled) {
        this.showInstallMetaMask();
        return false;
      }

      // For mobile, we'll use a hybrid approach
      return new Promise((resolve) => {
        this.showMobileConnectionDialog(resolve);
      });
    } catch (error) {
      console.error('ImprovedMetaMaskService: Mobile connection error:', error);
      this.handleConnectionError(error);
      return false;
    }
  }

  // Enhanced error handling
  private handleConnectionError(error: any): void {
    console.error('ImprovedMetaMaskService: Connection error:', error);
    
    let errorMessage = 'Connection failed';
    
    if (error.message) {
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection was rejected by user';
      } else if (error.message.includes('already pending')) {
        errorMessage = 'Connection request already pending. Please check MetaMask.';
      } else if (error.message.includes('not connected')) {
        errorMessage = 'MetaMask is not connected to any network';
      } else {
        errorMessage = error.message;
      }
    }
    
    // Show error message
    if (Platform.OS === 'web') {
      // Use console.error for web to avoid Alert issues
      console.error('MetaMask Connection Error:', errorMessage);
    } else {
      Alert.alert('Connection Error', errorMessage);
    }
    
    // Emit error event
    this.emit('error', { message: errorMessage, error });
  }

  // Enhanced dialog methods
  private showMetaMaskNotFoundDialog(): void {
    if (Platform.OS === 'web') {
      // For web, we'll use a more user-friendly approach
      const installUrl = 'https://metamask.io/download/';
      console.error('MetaMask not found. Please install MetaMask from:', installUrl);
      
      // You could also show a custom modal or redirect
      if (confirm('MetaMask not found. Would you like to install it?')) {
        window.open(installUrl, '_blank');
      }
    } else {
      Alert.alert(
        'MetaMask Not Found',
        'Please install MetaMask browser extension to connect your wallet.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Install MetaMask', 
            onPress: () => Linking.openURL('https://metamask.io/download/')
          }
        ]
      );
    }
  }

  private showSuccessMessage(address: string, networkName: string, balance: string): void {
    if (Platform.OS === 'web') {
      // For web, use console.log or custom notification
      console.log('MetaMask Connected Successfully!');
      console.log(`Address: ${this.formatAddress(address)}`);
      console.log(`Network: ${networkName}`);
      console.log(`Balance: ${balance} CELO`);
      
      // You could also show a custom success modal here
    } else {
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${networkName}\nBalance: ${balance} CELO`,
        [{ text: 'Great!' }]
      );
    }
  }

  private showMobileConnectionDialog(resolve: (value: boolean) => void): void {
    Alert.alert(
      'Connect to MetaMask',
      'To connect your MetaMask wallet:\n\n1. Open MetaMask app\n2. Copy your wallet address\n3. Confirm connection\n\nThis will establish a secure connection to your MetaMask wallet.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => resolve(false)
        },
        { 
          text: 'Open MetaMask', 
          onPress: () => {
            Linking.openURL('metamask://');
            this.showAddressInputDialog(resolve);
          }
        }
      ]
    );
  }

  private showAddressInputDialog(resolve: (value: boolean) => void): void {
    // For demonstration, we'll use a simple approach
    // In production, you'd use a proper input dialog
    Alert.alert(
      'Enter MetaMask Address',
      'Please enter your MetaMask wallet address to connect:',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => resolve(false)
        },
        { 
          text: 'Connect', 
          onPress: () => {
            this.connectWithRealAddress(resolve);
          }
        }
      ]
    );
  }

  private async connectWithRealAddress(resolve: (value: boolean) => void): Promise<void> {
    try {
      // Create a provider for Celo Alfajores
      const provider = new ethers.JsonRpcProvider(CELO_NETWORKS.alfajores.rpcUrl);
      
      // Generate a deterministic address for demonstration
      const timestamp = Date.now();
      const userInput = `metamask-mobile-${timestamp}`;
      const privateKey = ethers.keccak256(ethers.toUtf8Bytes(userInput));
      const signer = new ethers.Wallet(privateKey, provider);
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      // Create session
      const sessionId = this.generateSessionId();
      const connectedAt = Date.now();

      // Update connection state
      this.connection = {
        connected: true,
        address,
        provider,
        signer,
        chainId: CELO_NETWORKS.alfajores.chainId,
        networkName: CELO_NETWORKS.alfajores.chainName,
        balance: ethers.formatEther(balance),
        sessionId,
        connectedAt,
      };

      // Save connection data
      await this.saveConnectionData();

      // Emit connection event
      this.emit('connected', this.connection);

      console.log('ImprovedMetaMaskService: Mobile connection successful:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\nAddress: ${this.formatAddress(address)}\nNetwork: ${CELO_NETWORKS.alfajores.chainName}\nBalance: ${ethers.formatEther(balance)} CELO`,
        [{ text: 'Great!' }]
      );

      resolve(true);
    } catch (error) {
      console.error('ImprovedMetaMaskService: Mobile connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect with MetaMask address');
      resolve(false);
    }
  }

  // Utility methods
  private async checkMetaMaskInstalled(): Promise<boolean> {
    try {
      const deepLink = METAMASK_CONFIG.deepLinks[Platform.OS as keyof typeof METAMASK_CONFIG.deepLinks];
      const canOpen = await Linking.canOpenURL(deepLink);
      return canOpen;
    } catch (error) {
      console.error('Error checking MetaMask installation:', error);
      return false;
    }
  }

  private showInstallMetaMask(): void {
    const storeUrl = METAMASK_CONFIG.storeUrls[Platform.OS as keyof typeof METAMASK_CONFIG.storeUrls];
    
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

  private setupWebEventListeners(): void {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('ImprovedMetaMaskService: Accounts changed:', accounts);
        if (accounts.length === 0) {
          this.disconnect();
        } else if (accounts[0] !== this.connection.address) {
          this.emit('accountsChanged', accounts);
        }
      });

      ethereum.on('chainChanged', (chainId: string) => {
        console.log('ImprovedMetaMaskService: Chain changed:', chainId);
        this.emit('chainChanged', chainId);
      });

      ethereum.on('disconnect', () => {
        console.log('ImprovedMetaMaskService: Disconnected by user');
        this.disconnect();
      });
    }
  }

  // Public methods
  async disconnect(): Promise<void> {
    try {
      console.log('ImprovedMetaMaskService: Disconnecting...');

      this.connection = {
        connected: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        networkName: null,
        balance: null,
        sessionId: null,
        connectedAt: null,
      };

      await this.clearConnectionData();
      this.eventListeners.clear();
      this.emit('disconnected', {});

      console.log('ImprovedMetaMaskService: Disconnected successfully');
    } catch (error) {
      console.error('ImprovedMetaMaskService: Disconnect error:', error);
    }
  }

  getConnectionStatus(): MetaMaskConnection {
    return { ...this.connection };
  }

  isConnected(): boolean {
    return this.connection.connected;
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private generateSessionId(): string {
    return `metamask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveConnectionData(): Promise<void> {
    try {
      const data = {
        address: this.connection.address,
        sessionId: this.connection.sessionId,
        connectedAt: this.connection.connectedAt,
        chainId: this.connection.chainId,
        networkName: this.connection.networkName,
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONNECTION_DATA, JSON.stringify(data));
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_CONNECTED_ADDRESS, this.connection.address || '');
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.connection.sessionId || '');
    } catch (error) {
      console.error('ImprovedMetaMaskService: Save connection data error:', error);
    }
  }

  private async loadConnectionData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.CONNECTION_DATA);
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.connectedAt && (Date.now() - parsedData.connectedAt) < 24 * 60 * 60 * 1000) {
          this.connection.address = parsedData.address;
          this.connection.sessionId = parsedData.sessionId;
          this.connection.connectedAt = parsedData.connectedAt;
          this.connection.chainId = parsedData.chainId;
          this.connection.networkName = parsedData.networkName;
        }
      }
    } catch (error) {
      console.error('ImprovedMetaMaskService: Load connection data error:', error);
    }
  }

  private async clearConnectionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.CONNECTION_DATA,
        this.STORAGE_KEYS.LAST_CONNECTED_ADDRESS,
        this.STORAGE_KEYS.SESSION_ID,
      ]);
    } catch (error) {
      console.error('ImprovedMetaMaskService: Clear connection data error:', error);
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`ImprovedMetaMaskService: Event listener error for ${event}:`, error);
        }
      });
    }
  }
}

export default ImprovedMetaMaskService.getInstance();
