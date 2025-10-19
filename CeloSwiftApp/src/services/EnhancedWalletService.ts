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

class EnhancedWalletService extends EventEmitter {
  private static instance: EnhancedWalletService;
  private connection: ConnectionStatus = {
    connected: false,
  };

  private readonly STORAGE_KEYS = {
    CONNECTION_DATA: 'enhanced_wallet_connection',
    DEEP_LINK_DATA: 'wallet_deep_link_data',
  };

  public static getInstance(): EnhancedWalletService {
    if (!EnhancedWalletService.instance) {
      EnhancedWalletService.instance = new EnhancedWalletService();
    }
    return EnhancedWalletService.instance;
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('EnhancedWalletService: Initializing...');
      await this.loadConnectionData();
      this.setupDeepLinkHandling();
      console.log('EnhancedWalletService: Initialization completed');
      return true;
    } catch (error) {
      console.error('EnhancedWalletService: Initialization failed:', error);
      return false;
    }
  }

  // Setup deep link handling for mobile
  private setupDeepLinkHandling(): void {
    if (Platform.OS !== 'web') {
      // Listen for deep links when app comes back to foreground
      Linking.addEventListener('url', this.handleDeepLink);
    }
  }

  // Handle deep links from wallet apps
  private handleDeepLink = (event: { url: string }) => {
    console.log('EnhancedWalletService: Deep link received:', event.url);
    
    // Check if this is a wallet connection response
    if (event.url.includes('celoswift://') || event.url.includes('metamask://')) {
      this.processWalletResponse(event.url);
    }
  };

  // Process wallet response from deep link
  private async processWalletResponse(url: string): Promise<void> {
    try {
      console.log('EnhancedWalletService: Processing wallet response:', url);
      
      // Extract connection data from URL parameters
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const address = urlParams.get('address');
      const success = urlParams.get('success') === 'true';
      
      if (success && address) {
        await this.completeConnection(address);
      } else {
        Alert.alert('Connection Failed', 'Wallet connection was not successful.');
      }
    } catch (error) {
      console.error('EnhancedWalletService: Error processing wallet response:', error);
    }
  }

  // Main connect method
  async connect(): Promise<boolean> {
    try {
      console.log('EnhancedWalletService: Starting connection...');
      
      if (Platform.OS === 'web') {
        return await this.connectWeb();
      } else {
        return await this.connectMobile();
      }
    } catch (error) {
      console.error('EnhancedWalletService: Connection error:', error);
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
      
      console.log('EnhancedWalletService: MetaMask detected, requesting accounts...');

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

      console.log('EnhancedWalletService: Web connection successful:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${network.name}\nBalance: ${ethers.formatEther(balance)} CELO`,
        [{ text: 'Great!' }]
      );

      return true;

    } catch (error: any) {
      console.error('EnhancedWalletService: Web connection error:', error);
      
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

  // Enhanced mobile connection with better flow
  private async connectMobile(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Connect MetaMask Wallet',
        'Choose how you want to connect your MetaMask wallet:',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          { 
            text: 'Open MetaMask App', 
            onPress: () => this.openMetaMaskWithDeepLink(resolve)
          },
          { 
            text: 'Enter Address Manually', 
            onPress: () => this.showAddressInputDialog(resolve)
          }
        ]
      );
    });
  }

  // Open MetaMask with deep link support
  private async openMetaMaskWithDeepLink(resolve: (value: boolean) => void): Promise<void> {
    try {
      console.log('EnhancedWalletService: Opening MetaMask with deep link support...');
      
      // Check if MetaMask app is installed
      const isInstalled = await this.checkMetaMaskInstalled();
      
      if (!isInstalled) {
        this.showInstallationOptions(resolve);
        return;
      }

      // Create deep link with return URL
      const returnUrl = this.createReturnUrl();
      const metamaskUrl = `metamask://dapp/${encodeURIComponent(returnUrl)}`;
      
      console.log('EnhancedWalletService: Opening MetaMask with URL:', metamaskUrl);
      
      Alert.alert(
        'Opening MetaMask',
        'MetaMask will now open. After connecting, you\'ll automatically return to this app.\n\nSteps:\n1. MetaMask app opens\n2. Approve the connection\n3. You\'ll return here automatically',
        [
          { 
            text: 'Open MetaMask', 
            onPress: async () => {
              try {
                await Linking.openURL(metamaskUrl);
                
                // Set up a timeout to handle the case where user doesn't return
                setTimeout(() => {
                  this.showFallbackConnection(resolve);
                }, 30000); // 30 second timeout
                
              } catch (error) {
                console.error('Error opening MetaMask:', error);
                this.showFallbackConnection(resolve);
              }
            }
          },
          { 
            text: 'Cancel', 
            onPress: () => resolve(false) 
          }
        ]
      );
    } catch (error) {
      console.error('EnhancedWalletService: Error opening MetaMask:', error);
      this.showFallbackConnection(resolve);
    }
  }

  // Create return URL for deep linking
  private createReturnUrl(): string {
    // Create a URL that will bring the user back to our app
    const baseUrl = 'celoswift://wallet/connect';
    const params = new URLSearchParams({
      app: 'CeloSwift',
      action: 'connect',
      timestamp: Date.now().toString(),
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Show installation options
  private showInstallationOptions(resolve: (value: boolean) => void): void {
    Alert.alert(
      'MetaMask Not Installed',
      'MetaMask mobile app is not installed. You can:',
      [
        { 
          text: 'Install MetaMask', 
          onPress: () => this.openMetaMaskInstall(resolve)
        },
        { 
          text: 'Enter Address Manually', 
          onPress: () => this.showAddressInputDialog(resolve)
        },
        { 
          text: 'Cancel', 
          onPress: () => resolve(false) 
        }
      ]
    );
  }

  // Open MetaMask installation
  private async openMetaMaskInstall(resolve: (value: boolean) => void): Promise<void> {
    try {
      const installUrl = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/metamask/id1438144202'
        : 'https://play.google.com/store/apps/details?id=io.metamask';
      
      await Linking.openURL(installUrl);
      
      // After opening install page, offer manual connection
      setTimeout(() => {
        Alert.alert(
          'After Installing MetaMask',
          'Once you\'ve installed MetaMask, you can connect using the manual address method.',
          [
            { text: 'Enter Address Now', onPress: () => this.showAddressInputDialog(resolve) },
            { text: 'Later', onPress: () => resolve(false) }
          ]
        );
      }, 2000);
    } catch (error) {
      console.error('Error opening MetaMask install page:', error);
      this.showAddressInputDialog(resolve);
    }
  }

  // Show fallback connection if deep link doesn't work
  private showFallbackConnection(resolve: (value: boolean) => void): void {
    Alert.alert(
      'Complete Connection',
      'To complete the connection, please enter your MetaMask wallet address.\n\nYou can find this in MetaMask app under your account details.',
      [
        { 
          text: 'Enter Address', 
          onPress: () => this.showAddressInputDialog(resolve)
        },
        { 
          text: 'Cancel', 
          onPress: () => resolve(false) 
        }
      ]
    );
  }

  // Check if MetaMask is installed
  private async checkMetaMaskInstalled(): Promise<boolean> {
    try {
      const metamaskUrl = 'metamask://';
      const canOpen = await Linking.canOpenURL(metamaskUrl);
      console.log('EnhancedWalletService: MetaMask installed:', canOpen);
      return canOpen;
    } catch (error) {
      console.error('EnhancedWalletService: Error checking MetaMask installation:', error);
      return false;
    }
  }

  // Show address input dialog for mobile
  private showAddressInputDialog(resolve: (value: boolean) => void): void {
    Alert.prompt(
      'Enter MetaMask Address',
      'Please enter your MetaMask wallet address:\n\nHow to find your address:\n1. Open MetaMask app\n2. Tap your account name at the top\n3. Copy your wallet address\n4. Paste it here',
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

      console.log('EnhancedWalletService: Connecting with address:', address);
      await this.completeConnection(address);
      resolve(true);

    } catch (error) {
      console.error('EnhancedWalletService: Error connecting with address:', error);
      Alert.alert('Connection Error', 'Failed to connect with the provided address');
      resolve(false);
    }
  }

  // Complete connection with address
  private async completeConnection(address: string): Promise<void> {
    try {
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
        walletType: Platform.OS === 'web' ? 'MetaMask Web' : 'MetaMask Mobile',
        sessionId,
        connectedAt,
      };

      // Save connection data
      await this.saveConnectionData();

      // Emit connection event
      this.emit('connected', this.connection);

      console.log('EnhancedWalletService: Connection successful:', address);

      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${CELO_NETWORKS.alfajores.chainName}\nBalance: ${ethers.formatEther(balance)} CELO\n\nYou can now use all app features.`,
        [{ text: 'Great!' }]
      );

    } catch (error) {
      console.error('EnhancedWalletService: Error completing connection:', error);
      throw error;
    }
  }

  // Ensure Celo network is active (web only)
  private async ensureCeloNetwork(ethereum: any): Promise<void> {
    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const celoChainId = '0x' + CELO_NETWORKS.alfajores.chainId.toString(16);

      if (chainId !== celoChainId) {
        console.log('EnhancedWalletService: Switching to Celo Alfajores network...');
        
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
      console.error('EnhancedWalletService: Network switching error:', error);
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
    console.error(`EnhancedWalletService: ${message}:`, error);
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    Alert.alert(
      'Wallet Error',
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
      console.log('EnhancedWalletService: Disconnected successfully');
    } catch (error) {
      console.error('EnhancedWalletService: Disconnect error:', error);
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
      console.error('EnhancedWalletService: Save connection data error:', error);
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
      console.error('EnhancedWalletService: Load connection data error:', error);
    }
  }

  // Clear connection data
  private async clearConnectionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CONNECTION_DATA);
    } catch (error) {
      console.error('EnhancedWalletService: Clear connection data error:', error);
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
      console.error('EnhancedWalletService: Update balance error:', error);
    }
  }
}

export default EnhancedWalletService.getInstance();
