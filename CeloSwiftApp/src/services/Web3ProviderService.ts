import { ethers } from 'ethers';
import { Alert } from 'react-native';

interface Web3Provider {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: string | null;
}

class Web3ProviderService {
  private static instance: Web3ProviderService;
  private web3Provider: Web3Provider = {
    provider: null,
    signer: null,
    address: null,
    chainId: null,
  };

  public static getInstance(): Web3ProviderService {
    if (!Web3ProviderService.instance) {
      Web3ProviderService.instance = new Web3ProviderService();
    }
    return Web3ProviderService.instance;
  }

  // Check if we're in a web environment with window.ethereum
  private isWebEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<boolean> {
    try {
      if (!this.isWebEnvironment()) {
        Alert.alert(
          'Web3 Not Available',
          'MetaMask connection is only available in web browsers. Please use the web version of this app.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        Alert.alert('Error', 'No accounts found. Please unlock MetaMask.');
        return false;
      }

      // Create provider and signer
      this.web3Provider.provider = new ethers.BrowserProvider(ethereum);
      this.web3Provider.signer = await this.web3Provider.provider.getSigner();
      this.web3Provider.address = await this.web3Provider.signer.getAddress();
      
      // Get chain ID
      const network = await this.web3Provider.provider.getNetwork();
      this.web3Provider.chainId = network.chainId.toString();

      // Check if we're on the correct network (Celo Alfajores)
      if (this.web3Provider.chainId !== '44787') {
        await this.switchToCeloNetwork();
      }

      console.log('MetaMask connected:', this.web3Provider.address);
      return true;

    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      
      if (error.code === 4001) {
        Alert.alert('Connection Rejected', 'Please connect your MetaMask wallet to continue.');
      } else if (error.code === -32002) {
        Alert.alert('Connection Pending', 'A connection request is already pending. Please check MetaMask.');
      } else {
        Alert.alert('Connection Error', error.message || 'Failed to connect to MetaMask.');
      }
      
      return false;
    }
  }

  // Switch to Celo Alfajores network
  private async switchToCeloNetwork(): Promise<void> {
    try {
      const ethereum = (window as any).ethereum;
      
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaef3' }], // 44787 in hex
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaef3',
              chainName: 'Celo Alfajores Testnet',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
              blockExplorerUrls: ['https://alfajores.celoscan.io'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Celo network:', addError);
          throw new Error('Failed to add Celo Alfajores network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet(): Promise<boolean> {
    try {
      if (!this.isWebEnvironment()) {
        Alert.alert(
          'Web3 Not Available',
          'Coinbase Wallet connection is only available in web browsers.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const coinbaseWallet = (window as any).coinbaseWalletExtension;
      
      if (!coinbaseWallet) {
        Alert.alert('Coinbase Wallet Not Found', 'Please install Coinbase Wallet extension.');
        return false;
      }

      const accounts = await coinbaseWallet.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        Alert.alert('Error', 'No accounts found. Please unlock Coinbase Wallet.');
        return false;
      }

      this.web3Provider.provider = new ethers.BrowserProvider(coinbaseWallet);
      this.web3Provider.signer = await this.web3Provider.provider.getSigner();
      this.web3Provider.address = await this.web3Provider.signer.getAddress();
      
      const network = await this.web3Provider.provider.getNetwork();
      this.web3Provider.chainId = network.chainId.toString();

      console.log('Coinbase Wallet connected:', this.web3Provider.address);
      return true;

    } catch (error: any) {
      console.error('Coinbase Wallet connection error:', error);
      Alert.alert('Connection Error', error.message || 'Failed to connect to Coinbase Wallet.');
      return false;
    }
  }

  // Get current connection status
  getConnectionStatus(): {
    connected: boolean;
    address: string | null;
    chainId: string | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
  } {
    return {
      connected: !!this.web3Provider.signer,
      address: this.web3Provider.address,
      chainId: this.web3Provider.chainId,
      provider: this.web3Provider.provider,
      signer: this.web3Provider.signer,
    };
  }

  // Disconnect wallet
  disconnect(): void {
    this.web3Provider = {
      provider: null,
      signer: null,
      address: null,
      chainId: null,
    };
    console.log('Wallet disconnected');
  }

  // Get account balance
  async getBalance(): Promise<string> {
    if (!this.web3Provider.provider || !this.web3Provider.address) {
      return '0';
    }

    try {
      const balance = await this.web3Provider.provider.getBalance(this.web3Provider.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  // Send transaction
  async sendTransaction(to: string, value: string): Promise<string | null> {
    if (!this.web3Provider.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.web3Provider.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
      });

      const receipt = await tx.wait();
      return receipt?.hash || null;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }
}

export default Web3ProviderService.getInstance();
