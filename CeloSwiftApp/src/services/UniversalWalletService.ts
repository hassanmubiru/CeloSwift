import { Alert, Linking, Platform } from 'react-native';
import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

class UniversalWalletService extends EventEmitter {
  private static instance: UniversalWalletService;
  private connection: ConnectionStatus = {
    connected: false,
  };

  private readonly STORAGE_KEYS = {
    CONNECTION_DATA: 'universal_wallet_connection',
  };

  // Celo Alfajores network configuration
  private readonly CELO_ALFAJORES = {
    chainId: 44787,
    chainName: 'Celo Alfajores',
    rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
    blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org'],
  };

  public static getInstance(): UniversalWalletService {
    if (!UniversalWalletService.instance) {
      UniversalWalletService.instance = new UniversalWalletService();
    }
    return UniversalWalletService.instance;
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('UniversalWalletService: Initializing...');
      await this.loadConnectionData();
      this.setupDeepLinkHandling();
      console.log('UniversalWalletService: Initialization completed');
      return true;
    } catch (error) {
      console.error('UniversalWalletService: Initialization failed:', error);
      return false;
    }
  }

  // Setup deep link handling for mobile
  private setupDeepLinkHandling(): void {
    if (Platform.OS !== 'web') {
      Linking.addEventListener('url', this.handleDeepLink);
    }
  }

  // Handle deep links from wallet apps
  private handleDeepLink = (event: { url: string }) => {
    console.log('UniversalWalletService: Deep link received:', event.url);
    
    if (event.url.includes('celoswift://') || event.url.includes('metamask://')) {
      this.processWalletResponse(event.url);
    }
  };

  // Process wallet response from deep link
  private async processWalletResponse(url: string): Promise<void> {
    try {
      console.log('UniversalWalletService: Processing wallet response:', url);
      
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const address = urlParams.get('address');
      const success = urlParams.get('success') === 'true';
      
      if (success && address) {
        await this.completeConnection(address);
      } else {
        Alert.alert('Connection Failed', 'Wallet connection was not successful.');
      }
    } catch (error) {
      console.error('UniversalWalletService: Error processing wallet response:', error);
    }
  }

  // Main connect method
  async connect(): Promise<boolean> {
    try {
      console.log('UniversalWalletService: Starting connection...');
      
      if (Platform.OS === 'web') {
        return await this.connectWeb();
      } else {
        return await this.connectMobile();
      }
    } catch (error) {
      console.error('UniversalWalletService: Connection error:', error);
      this.handleError('Connection failed', error);
      return false;
    }
  }

  // Web connection
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
      
      console.log('UniversalWalletService: MetaMask detected, requesting accounts...');

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

      console.log('UniversalWalletService: Web connection successful:', address);
      
      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${network.name}\nBalance: ${ethers.formatEther(balance)} CELO`,
        [{ text: 'Great!' }]
      );

      return true;

    } catch (error: any) {
      console.error('UniversalWalletService: Web connection error:', error);
      
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

  // Mobile connection with improved flow
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
      console.log('UniversalWalletService: Opening MetaMask with deep link support...');
      
      const isInstalled = await this.checkMetaMaskInstalled();
      
      if (!isInstalled) {
        this.showInstallationOptions(resolve);
        return;
      }

      // Create deep link with return URL
      const returnUrl = this.createReturnUrl();
      const metamaskUrl = `metamask://dapp/${encodeURIComponent(returnUrl)}`;
      
      console.log('UniversalWalletService: Opening MetaMask with URL:', metamaskUrl);
      
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
      console.error('UniversalWalletService: Error opening MetaMask:', error);
      this.showFallbackConnection(resolve);
    }
  }

  // Create return URL for deep linking
  private createReturnUrl(): string {
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
      console.log('UniversalWalletService: MetaMask installed:', canOpen);
      return canOpen;
    } catch (error) {
      console.error('UniversalWalletService: Error checking MetaMask installation:', error);
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

      console.log('UniversalWalletService: Connecting with address:', address);
      await this.completeConnection(address);
      resolve(true);

    } catch (error) {
      console.error('UniversalWalletService: Error connecting with address:', error);
      Alert.alert('Connection Error', 'Failed to connect with the provided address');
      resolve(false);
    }
  }

  // Complete connection with address
  private async completeConnection(address: string): Promise<void> {
    try {
      // Create provider for Celo Alfajores
      const provider = new ethers.JsonRpcProvider(this.CELO_ALFAJORES.rpcUrls[0]);
      
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
        chainId: this.CELO_ALFAJORES.chainId,
        networkName: this.CELO_ALFAJORES.chainName,
        balance: ethers.formatEther(balance),
        walletType: Platform.OS === 'web' ? 'MetaMask Web' : 'MetaMask Mobile',
        sessionId,
        connectedAt,
      };

      // Save connection data
      await this.saveConnectionData();

      // Emit connection event
      this.emit('connected', this.connection);

      console.log('UniversalWalletService: Connection successful:', address);

      Alert.alert(
        'MetaMask Connected!',
        `Successfully connected to MetaMask!\n\nAddress: ${this.formatAddress(address)}\nNetwork: ${this.CELO_ALFAJORES.chainName}\nBalance: ${ethers.formatEther(balance)} CELO\n\nYou can now use all app features.`,
        [{ text: 'Great!' }]
      );

    } catch (error) {
      console.error('UniversalWalletService: Error completing connection:', error);
      throw error;
    }
  }

  // Ensure Celo network is active (web only)
  private async ensureCeloNetwork(ethereum: any): Promise<void> {
    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const celoChainId = '0x' + this.CELO_ALFAJORES.chainId.toString(16);

      if (chainId !== celoChainId) {
        console.log('UniversalWalletService: Switching to Celo Alfajores network...');
        
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
                chainName: this.CELO_ALFAJORES.chainName,
                nativeCurrency: this.CELO_ALFAJORES.nativeCurrency,
                rpcUrls: this.CELO_ALFAJORES.rpcUrls,
                blockExplorerUrls: this.CELO_ALFAJORES.blockExplorerUrls,
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error('UniversalWalletService: Network switching error:', error);
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
    return 'universal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Format address for display
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Handle errors
  private handleError(message: string, error: any): void {
    console.error(`UniversalWalletService: ${message}:`, error);
    
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

  // Get signer
  getSigner(): ethers.JsonRpcSigner | undefined {
    return this.connection.signer;
  }

  // Get provider
  getProvider(): ethers.BrowserProvider | ethers.JsonRpcProvider | undefined {
    return this.connection.provider;
  }

  // Disconnect
  async disconnect(): Promise<void> {
    try {
      this.connection = { connected: false };
      await this.clearConnectionData();
      this.emit('disconnected');
      console.log('UniversalWalletService: Disconnected successfully');
    } catch (error) {
      console.error('UniversalWalletService: Disconnect error:', error);
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
      console.error('UniversalWalletService: Save connection data error:', error);
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
      console.error('UniversalWalletService: Load connection data error:', error);
    }
  }

  // Clear connection data
  private async clearConnectionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CONNECTION_DATA);
    } catch (error) {
      console.error('UniversalWalletService: Clear connection data error:', error);
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
      console.error('UniversalWalletService: Update balance error:', error);
    }
  }

  // Send transaction
  async sendTransaction(to: string, amount: string): Promise<string> {
    try {
      if (!this.connection.connected || !this.connection.signer) {
        throw new Error('No wallet connected or no signer available');
      }

      const tx = {
        to,
        value: ethers.parseEther(amount),
      };

      const receipt = await this.connection.signer.sendTransaction(tx);
      
      console.log('UniversalWalletService: Transaction sent:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('UniversalWalletService: Send transaction error:', error);
      throw error;
    }
  }
}

export default UniversalWalletService.getInstance();
