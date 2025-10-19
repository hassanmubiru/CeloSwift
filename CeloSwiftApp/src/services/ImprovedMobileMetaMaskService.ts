import { Alert, Linking, Platform } from 'react-native';
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

class ImprovedMobileMetaMaskService extends EventEmitter {
  private static instance: ImprovedMobileMetaMaskService;
  private connection: ConnectionStatus = {
    connected: false,
  };

  private readonly STORAGE_KEYS = {
    CONNECTION_DATA: 'improved_mobile_metamask_connection',
  };

  public static getInstance(): ImprovedMobileMetaMaskService {
    if (!ImprovedMobileMetaMaskService.instance) {
      ImprovedMobileMetaMaskService.instance = new ImprovedMobileMetaMaskService();
    }
    return ImprovedMobileMetaMaskService.instance;
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('ImprovedMobileMetaMaskService: Initializing...');
      await this.loadConnectionData();
      console.log('ImprovedMobileMetaMaskService: Initialization completed');
      return true;
    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Initialization failed:', error);
      return false;
    }
  }

  // Main connect method
  async connect(): Promise<boolean> {
    try {
      console.log('ImprovedMobileMetaMaskService: Starting connection...');
      
      if (Platform.OS === 'web') {
        return await this.connectWeb();
      } else {
        return await this.connectMobile();
      }
    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Connection error:', error);
      this.handleError('Connection failed', error);
      return false;
    }
  }

  // Web connection (same as before)
  private async connectWeb(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      if (!(window as any).ethereum) {
        this.showMetaMaskNotFoundDialog();
        return false;
      }

      const ethereum = (window as any).ethereum;
      
      console.log('ImprovedMobileMetaMaskService: MetaMask detected, requesting accounts...');

      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const address = accounts[0];
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      await this.ensureCeloNetwork(ethereum);

      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      const sessionId = this.generateSessionId();
      const connectedAt = Date.now();

      this.connection = {
        connected: true,
        address,
        provider,
        signer,
        chainId: Number(network.chainId),
        networkName: network.name,
        balance: ethers.formatEther(balance),
        walletType: 'MetaMask Web',
        sessionId,
        connectedAt,
      };

      await this.saveConnectionData();
      this.emit('connected', this.connection);

      console.log('ImprovedMobileMetaMaskService: Web connection successful:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${network.name}\nBalance: ${ethers.formatEther(balance)} CELO`,
        [{ text: 'Great!' }]
      );

      return true;

    } catch (error: any) {
      console.error('ImprovedMobileMetaMaskService: Web connection error:', error);
      
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

  // Improved mobile connection
  private async connectMobile(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'MetaMask Mobile Connection',
        'MetaMask popups don\'t work on mobile devices. Instead, we\'ll help you connect your MetaMask wallet using one of these methods:',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          { 
            text: 'Open MetaMask App', 
            onPress: () => this.openMetaMaskApp(resolve)
          },
          { 
            text: 'Enter Address Manually', 
            onPress: () => this.showAddressInputDialog(resolve)
          }
        ]
      );
    });
  }

  // Open MetaMask app with deep linking
  private async openMetaMaskApp(resolve: (value: boolean) => void): Promise<void> {
    try {
      console.log('ImprovedMobileMetaMaskService: Attempting to open MetaMask app...');
      
      // Check if MetaMask app is installed
      const isInstalled = await this.checkMetaMaskInstalled();
      
      if (!isInstalled) {
        Alert.alert(
          'MetaMask Not Installed',
          'MetaMask mobile app is not installed. Please install it from the app store or enter your wallet address manually.',
          [
            { text: 'Install MetaMask', onPress: () => this.openMetaMaskInstall() },
            { text: 'Enter Address', onPress: () => this.showAddressInputDialog(resolve) },
            { text: 'Cancel', onPress: () => resolve(false) }
          ]
        );
        return;
      }

      // Try to open MetaMask app
      const metamaskUrl = 'metamask://';
      const canOpen = await Linking.canOpenURL(metamaskUrl);
      
      if (canOpen) {
        Alert.alert(
          'Opening MetaMask App',
          'MetaMask app will now open. This is the correct way to connect on mobile - no popup will appear in this app.\n\nPlease follow these steps:\n\n1. MetaMask app will open\n2. Unlock your wallet if needed\n3. Make sure you\'re on Celo Alfajores network\n4. Return to this app when ready',
          [
            { 
              text: 'Open MetaMask App', 
              onPress: async () => {
                try {
                  await Linking.openURL(metamaskUrl);
                  
                  // Wait a moment for MetaMask to open
                  setTimeout(() => {
                    this.showConnectionConfirmation(resolve);
                  }, 2000);
                } catch (error) {
                  console.error('Error opening MetaMask:', error);
                  this.showConnectionConfirmation(resolve);
                }
              }
            },
            { text: 'Cancel', onPress: () => resolve(false) }
          ]
        );
      } else {
        Alert.alert(
          'Cannot Open MetaMask',
          'Unable to open MetaMask app. Please enter your wallet address manually.',
          [
            { text: 'Enter Address', onPress: () => this.showAddressInputDialog(resolve) },
            { text: 'Cancel', onPress: () => resolve(false) }
          ]
        );
      }
    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Error opening MetaMask app:', error);
      this.showConnectionConfirmation(resolve);
    }
  }

  // Check if MetaMask is installed
  private async checkMetaMaskInstalled(): Promise<boolean> {
    try {
      const metamaskUrl = 'metamask://';
      const canOpen = await Linking.canOpenURL(metamaskUrl);
      console.log('ImprovedMobileMetaMaskService: MetaMask installed:', canOpen);
      return canOpen;
    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Error checking MetaMask installation:', error);
      return false;
    }
  }

  // Open MetaMask install page
  private async openMetaMaskInstall(): Promise<void> {
    try {
      const installUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/metamask/id1438144202'
        : 'https://play.google.com/store/apps/details?id=io.metamask';
      
      await Linking.openURL(installUrl);
    } catch (error) {
      console.error('Error opening MetaMask install page:', error);
    }
  }

  // Show connection confirmation dialog
  private showConnectionConfirmation(resolve: (value: boolean) => void): void {
    Alert.alert(
      'Confirm Connection',
      'Have you opened MetaMask and are ready to connect?\n\nPlease make sure:\n• MetaMask is unlocked\n• You\'re on Celo Alfajores network\n• You\'re ready to provide your wallet address',
      [
        { 
          text: 'I\'m Ready', 
          onPress: () => this.showAddressInputDialog(resolve)
        },
        { 
          text: 'Cancel', 
          onPress: () => resolve(false)
        }
      ]
    );
  }

  // Show address input dialog for mobile
  private showAddressInputDialog(resolve: (value: boolean) => void): void {
    Alert.prompt(
      'Enter MetaMask Address',
      'Please enter your MetaMask wallet address:\n\n(You can find this in MetaMask app under "Account details")',
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

      console.log('ImprovedMobileMetaMaskService: Connecting with address:', address);

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

      console.log('ImprovedMobileMetaMaskService: Mobile connection successful:', address);

      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${CELO_NETWORKS.alfajores.chainName}\nBalance: ${ethers.formatEther(balance)} CELO\n\nNote: For transactions, you'll need to use MetaMask app directly.`,
        [{ text: 'Great!' }]
      );

      resolve(true);

    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Error connecting with address:', error);
      Alert.alert('Connection Error', 'Failed to connect with the provided address. Please check the address and try again.');
      resolve(false);
    }
  }

  // Ensure Celo network is active (web only)
  private async ensureCeloNetwork(ethereum: any): Promise<void> {
    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const celoChainId = '0x' + CELO_NETWORKS.alfajores.chainId.toString(16);

      if (chainId !== celoChainId) {
        console.log('ImprovedMobileMetaMaskService: Switching to Celo Alfajores network...');
        
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: celoChainId }],
          });
        } catch (switchError: any) {
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
      console.error('ImprovedMobileMetaMaskService: Network switching error:', error);
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
    console.error(`ImprovedMobileMetaMaskService: ${message}:`, error);
    
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
      console.log('ImprovedMobileMetaMaskService: Disconnected successfully');
    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Disconnect error:', error);
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
      console.error('ImprovedMobileMetaMaskService: Save connection data error:', error);
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
      console.error('ImprovedMobileMetaMaskService: Load connection data error:', error);
    }
  }

  // Clear connection data
  private async clearConnectionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CONNECTION_DATA);
    } catch (error) {
      console.error('ImprovedMobileMetaMaskService: Clear connection data error:', error);
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
      console.error('ImprovedMobileMetaMaskService: Update balance error:', error);
    }
  }
}

export default ImprovedMobileMetaMaskService.getInstance();
