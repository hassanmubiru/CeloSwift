import { Alert, Platform } from 'react-native';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConnectionStatus {
  connected: boolean;
  address?: string;
  provider?: any;
  signer?: any;
  chainId?: number;
  networkName?: string;
  balance?: string;
  walletType?: string;
  sessionId?: string;
  connectedAt?: number;
}

class ThirdwebCeloService extends EventEmitter {
  private static instance: ThirdwebCeloService;
  private connection: ConnectionStatus = {
    connected: false,
  };
  private sdk: ThirdwebSDK | null = null;

  private readonly STORAGE_KEYS = {
    CONNECTION_DATA: 'thirdweb_celo_connection',
  };

  // Celo Sepolia network configuration
  private readonly CELO_SEPOLIA = {
    chainId: 11142220, // Correct Celo Sepolia chain ID
    chainName: 'Celo Sepolia Testnet',
    rpcUrls: ['https://11142220.rpc.thirdweb.com'],
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO-S',
      decimals: 18,
    },
    blockExplorerUrls: ['https://celo-sepolia.blockscout.com'],
  };

  public static getInstance(): ThirdwebCeloService {
    if (!ThirdwebCeloService.instance) {
      ThirdwebCeloService.instance = new ThirdwebCeloService();
    }
    return ThirdwebCeloService.instance;
  }

  // Initialize Thirdweb SDK with Celo Sepolia
  async initialize(): Promise<boolean> {
    try {
      console.log('ThirdwebCeloService: Initializing Thirdweb SDK with Celo Sepolia...');
      
      // Initialize Thirdweb SDK with Celo Sepolia
      this.sdk = new ThirdwebSDK(this.CELO_SEPOLIA.chainId, {
        rpc: this.CELO_SEPOLIA.rpcUrls[0],
      });

      await this.loadConnectionData();
      console.log('ThirdwebCeloService: Thirdweb SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('ThirdwebCeloService: Initialization failed:', error);
      return false;
    }
  }

  // Connect wallet using Thirdweb
  async connect(): Promise<boolean> {
    try {
      console.log('ThirdwebCeloService: Starting wallet connection...');
      
      if (!this.sdk) {
        throw new Error('Thirdweb SDK not initialized');
      }

      // Use Thirdweb's built-in wallet connection
      const wallet = await this.sdk.wallet.connect();
      
      if (!wallet) {
        throw new Error('Failed to connect wallet');
      }

      const address = await wallet.getAddress();
      const network = await this.sdk.getProvider().getNetwork();
      const balance = await this.sdk.getBalance(address);

      const sessionId = this.generateSessionId();
      const connectedAt = Date.now();

      this.connection = {
        connected: true,
        address,
        provider: this.sdk.getProvider(),
        signer: wallet,
        chainId: network.chainId,
        networkName: network.name,
        balance: this.formatBalance(balance),
        walletType: 'MetaMask (Thirdweb)',
        sessionId,
        connectedAt,
      };

      await this.saveConnectionData();
      this.emit('connected', this.connection);

      console.log('ThirdwebCeloService: Wallet connected successfully:', address);
      
      Alert.alert(
        'Wallet Connected!',
        `Successfully connected to your wallet on Celo Sepolia!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${network.name}\nBalance: ${this.formatBalance(balance)} CELO`,
        [{ text: 'Great!' }]
      );

      return true;

    } catch (error: any) {
      console.error('ThirdwebCeloService: Connection error:', error);
      
      let errorMessage = 'Connection failed';
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection was cancelled by user';
      } else if (error.message.includes('not found')) {
        errorMessage = 'MetaMask not found. Please install MetaMask first.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Please switch to Celo Sepolia network in MetaMask.';
      }
      
      this.handleError(errorMessage, error);
      return false;
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    try {
      if (this.sdk) {
        await this.sdk.wallet.disconnect();
      }

      this.connection = { connected: false };
      await this.clearConnectionData();
      this.emit('disconnected');
      
      console.log('ThirdwebCeloService: Disconnected successfully');
    } catch (error) {
      console.error('ThirdwebCeloService: Disconnect error:', error);
    }
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

  // Update balance
  async updateBalance(): Promise<void> {
    try {
      if (!this.connection.connected || !this.connection.address || !this.sdk) {
        return;
      }

      const balance = await this.sdk.getBalance(this.connection.address);
      this.connection.balance = this.formatBalance(balance);
      
      await this.saveConnectionData();
      this.emit('balanceUpdated', this.connection.balance);
    } catch (error) {
      console.error('ThirdwebCeloService: Update balance error:', error);
    }
  }

  // Get SDK instance
  getSDK(): ThirdwebSDK | null {
    return this.sdk;
  }

  // Get signer
  getSigner(): any {
    return this.connection.signer;
  }

  // Get provider
  getProvider(): any {
    return this.connection.provider;
  }

  // Switch network to Celo Sepolia
  async switchToCeloNetwork(): Promise<boolean> {
    try {
      if (!this.connection.signer) {
        throw new Error('No wallet connected');
      }

      // Use Thirdweb's network switching
      await this.sdk?.wallet.switchChain(this.CELO_SEPOLIA.chainId);
      
      console.log('ThirdwebCeloService: Switched to Celo Sepolia network');
      return true;
    } catch (error) {
      console.error('ThirdwebCeloService: Network switch error:', error);
      return false;
    }
  }

  // Send transaction using Thirdweb
  async sendTransaction(to: string, amount: string): Promise<string> {
    try {
      if (!this.connection.connected || !this.connection.signer) {
        throw new Error('No wallet connected');
      }

      if (!this.sdk) {
        throw new Error('Thirdweb SDK not initialized');
      }

      // Convert amount to wei
      const amountWei = this.parseEther(amount);
      
      // Create transaction
      const tx = {
        to,
        value: amountWei,
      };

      // Send transaction using Thirdweb
      const receipt = await this.connection.signer.sendTransaction(tx);
      
      console.log('ThirdwebCeloService: Transaction sent:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('ThirdwebCeloService: Send transaction error:', error);
      throw error;
    }
  }

  // Format balance for display
  private formatBalance(balance: any): string {
    try {
      // Thirdweb returns balance in wei, convert to ether
      const etherBalance = balance / Math.pow(10, 18);
      return etherBalance.toFixed(4);
    } catch (error) {
      return '0.0000';
    }
  }

  // Parse ether to wei
  private parseEther(amount: string): string {
    try {
      const etherAmount = parseFloat(amount);
      const weiAmount = etherAmount * Math.pow(10, 18);
      return weiAmount.toString();
    } catch (error) {
      throw new Error('Invalid amount format');
    }
  }

  // Format address for display
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Generate session ID
  private generateSessionId(): string {
    return 'thirdweb_celo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Handle errors
  private handleError(message: string, error: any): void {
    console.error(`ThirdwebCeloService: ${message}:`, error);
    
    Alert.alert(
      'Wallet Connection Error',
      message,
      [{ text: 'OK' }]
    );
    
    this.emit('error', { message, error });
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
      console.error('ThirdwebCeloService: Save connection data error:', error);
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
      console.error('ThirdwebCeloService: Load connection data error:', error);
    }
  }

  // Clear connection data
  private async clearConnectionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CONNECTION_DATA);
    } catch (error) {
      console.error('ThirdwebCeloService: Clear connection data error:', error);
    }
  }
}

export default ThirdwebCeloService.getInstance();
