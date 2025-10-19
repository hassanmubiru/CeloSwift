import { Alert, Platform } from 'react-native';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';
import { CELO_NETWORKS } from '../config/walletconnect';

interface ConnectionStatus {
  connected: boolean;
  address?: string;
  provider?: ethers.BrowserProvider | ethers.JsonRpcProvider;
  signer?: ethers.JsonRpcSigner;
  chainId?: number;
  networkName?: string;
  balance?: string;
  walletType?: string;
  sessionId?: string;
  connectedAt?: number;
}

class SimpleWalletService extends EventEmitter {
  private static instance: SimpleWalletService;
  private connection: ConnectionStatus = {
    connected: false,
  };

  private readonly STORAGE_KEYS = {
    CONNECTION_DATA: 'simple_wallet_connection',
  };

  public static getInstance(): SimpleWalletService {
    if (!SimpleWalletService.instance) {
      SimpleWalletService.instance = new SimpleWalletService();
    }
    return SimpleWalletService.instance;
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('SimpleWalletService: Initializing...');
      await this.loadConnectionData();
      console.log('SimpleWalletService: Initialization completed');
      return true;
    } catch (error) {
      console.error('SimpleWalletService: Initialization failed:', error);
      return false;
    }
  }

  // Main connect method
  async connect(): Promise<boolean> {
    try {
      console.log('SimpleWalletService: Starting connection...');
      
      if (Platform.OS === 'web') {
        return await this.connectWeb();
      } else {
        return await this.connectMobile();
      }
    } catch (error) {
      console.error('SimpleWalletService: Connection error:', error);
      this.handleError('Connection failed', error);
      return false;
    }
  }

  // Web connection
  private async connectWeb(): Promise<boolean> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        this.showMetaMaskNotFoundDialog();
        return false;
      }

      const ethereum = (window as any).ethereum;
      
      console.log('SimpleWalletService: MetaMask detected, requesting accounts...');

      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      console.log('SimpleWalletService: Accounts received:', accounts);

      const address = accounts[0];
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Ensure we're on the correct network (Celo Alfajores)
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
        walletType: 'MetaMask',
        sessionId,
        connectedAt,
      };

      // Save connection data
      await this.saveConnectionData();

      // Emit connection event
      this.emit('connected', this.connection);

      console.log('SimpleWalletService: Web connection successful:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${network.name}\nBalance: ${ethers.formatEther(balance)} CELO`,
        [{ text: 'Great!' }]
      );

      return true;

    } catch (error: any) {
      console.error('SimpleWalletService: Web connection error:', error);
      
      // Handle specific MetaMask errors
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check MetaMask.');
      } else if (error.code === 4902) {
        throw new Error('MetaMask is not connected to any network');
      }
      
      throw error;
    }
  }

  // Mobile connection
  private async connectMobile(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'MetaMask Connection',
        'To connect your MetaMask wallet on mobile:\n\n1. Make sure MetaMask app is installed\n2. Open MetaMask and unlock your wallet\n3. Copy your wallet address\n4. Paste it below to connect\n\nNote: This establishes a connection to your MetaMask wallet.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          { 
            text: 'Connect', 
            onPress: () => this.showAddressInputDialog(resolve)
          }
        ]
      );
    });
  }

  // Show address input dialog for mobile
  private showAddressInputDialog(resolve: (value: boolean) => void): void {
    Alert.prompt(
      'Enter MetaMask Address',
      'Please enter your MetaMask wallet address:',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => resolve(false)
        },
        { 
          text: 'Connect', 
          onPress: (address) => this.connectWithAddress(address, resolve)
        }
      ],
      'plain-text'
    );
  }

  // Connect with provided address (mobile)
  private async connectWithAddress(address: string | undefined, resolve: (value: boolean) => void): Promise<void> {
    try {
      if (!address || !address.startsWith('0x') || address.length !== 42) {
        Alert.alert('Invalid Address', 'Please enter a valid Ethereum address (0x...)');
        resolve(false);
        return;
      }

      console.log('SimpleWalletService: Connecting with address:', address);

      // Create provider for Celo Alfajores
      const provider = new ethers.JsonRpcProvider(CELO_NETWORKS.alfajores.rpcUrl);
      
      // Get balance for the address
      const balance = await provider.getBalance(address);

      // Create session
      const sessionId = this.generateSessionId();
      const connectedAt = Date.now();

      // Update connection state
      this.connection = {
        connected: true,
        address,
        provider,
        signer: undefined, // No signer available for mobile connection
        chainId: CELO_NETWORKS.alfajores.chainId,
        networkName: CELO_NETWORKS.alfajores.chainName,
        balance: ethers.formatEther(balance),
        walletType: 'MetaMask Mobile',
        sessionId,
        connectedAt,
      };

      // Save connection data
      await this.saveConnectionData();

      // Emit connection event
      this.emit('connected', this.connection);

      console.log('SimpleWalletService: Mobile connection successful:', address);

      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${CELO_NETWORKS.alfajores.chainName}\nBalance: ${ethers.formatEther(balance)} CELO\n\nNote: For transactions, you'll need to use MetaMask app directly.`,
        [{ text: 'Great!' }]
      );

      resolve(true);

    } catch (error) {
      console.error('SimpleWalletService: Error connecting with address:', error);
      Alert.alert('Connection Error', 'Failed to connect with the provided address');
      resolve(false);
    }
  }

  // Ensure Celo network is active
  private async ensureCeloNetwork(ethereum: any): Promise<void> {
    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const celoChainId = '0x' + CELO_NETWORKS.alfajores.chainId.toString(16);

      if (chainId !== celoChainId) {
        console.log('SimpleWalletService: Switching to Celo Alfajores network...');
        
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: celoChainId }],
          });
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: celoChainId,
                chainName: CELO_NETWORKS.alfajores.chainName,
                nativeCurrency: CELO_NETWORKS.alfajores.nativeCurrency,
                rpcUrls: CELO_NETWORKS.alfajores.rpcUrls,
                blockExplorerUrls: CELO_NETWORKS.alfajores.blockExplorerUrls,
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error('SimpleWalletService: Network switching error:', error);
      throw new Error('Failed to switch to Celo network');
    }
  }

  // Show MetaMask not found dialog
  private showMetaMaskNotFoundDialog(): void {
    Alert.alert(
      'MetaMask Not Found',
      'MetaMask browser extension is not installed. Please install MetaMask to connect your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Install MetaMask', 
          onPress: () => {
            if (typeof window !== 'undefined') {
              window.open('https://metamask.io/download/', '_blank');
            }
          }
        }
      ]
    );
  }

  // Generate session ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Format address for display
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Handle errors
  private handleError(message: string, error: any): void {
    console.error(`SimpleWalletService: ${message}:`, error);
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    Alert.alert(
      'MetaMask Error',
      `${message}\n\n${errorMessage}`,
      [{ text: 'OK' }]
    );
    
    this.emit('error', { message, error });
  }

  // Get connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connection };
  }

  // Check if connected
  isConnected(): boolean {
    return this.connection.connected;
  }

  // Get address
  getAddress(): string | undefined {
    return this.connection.address;
  }

  // Get balance
  getBalance(): string | undefined {
    return this.connection.balance;
  }

  // Disconnect
  async disconnect(): Promise<void> {
    try {
      this.connection = { connected: false };
      await this.clearConnectionData();
      this.emit('disconnected');
      console.log('SimpleWalletService: Disconnected successfully');
    } catch (error) {
      console.error('SimpleWalletService: Disconnect error:', error);
    }
  }

  // Save connection data
  private async saveConnectionData(): Promise<void> {
    try {
      const data = {
        connected: this.connection.connected,
        address: this.connection.address,
        walletType: this.connection.walletType,
        sessionId: this.connection.sessionId,
        connectedAt: this.connection.connectedAt,
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONNECTION_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('SimpleWalletService: Save connection data error:', error);
    }
  }

  // Load connection data
  private async loadConnectionData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.CONNECTION_DATA);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.connected && parsed.address) {
          this.connection = {
            ...this.connection,
            connected: parsed.connected,
            address: parsed.address,
            walletType: parsed.walletType,
            sessionId: parsed.sessionId,
            connectedAt: parsed.connectedAt,
          };
        }
      }
    } catch (error) {
      console.error('SimpleWalletService: Load connection data error:', error);
    }
  }

  // Clear connection data
  private async clearConnectionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CONNECTION_DATA);
    } catch (error) {
      console.error('SimpleWalletService: Clear connection data error:', error);
    }
  }

  // Update balance
  async updateBalance(): Promise<void> {
    try {
      if (!this.connection.connected || !this.connection.address || !this.connection.provider) {
        return;
      }

      const balance = await this.connection.provider.getBalance(this.connection.address);
      this.connection.balance = ethers.formatEther(balance);
      
      await this.saveConnectionData();
      this.emit('balanceUpdated', this.connection.balance);
    } catch (error) {
      console.error('SimpleWalletService: Update balance error:', error);
    }
  }
}

export default SimpleWalletService.getInstance();
