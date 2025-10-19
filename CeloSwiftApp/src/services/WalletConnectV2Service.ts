import { ethers } from 'ethers';
import { Alert, Linking, Platform } from 'react-native';
import WalletConnect from '@walletconnect/client';
import { IWalletConnectSession } from '@walletconnect/types';
import { WALLETCONNECT_CONFIG, CELO_NETWORKS } from '../config/walletconnect';

interface ConnectionStatus {
  connected: boolean;
  address: string | null;
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.Signer | null;
  walletType: string | null;
  session: IWalletConnectSession | null;
  chainId: number | null;
}

class WalletConnectV2Service {
  private static instance: WalletConnectV2Service;
  private connector: WalletConnect | null = null;
  private connectedWallet: ConnectionStatus = {
    connected: false,
    address: null,
    provider: null,
    signer: null,
    walletType: null,
    session: null,
    chainId: null,
  };

  public static getInstance(): WalletConnectV2Service {
    if (!WalletConnectV2Service.instance) {
      WalletConnectV2Service.instance = new WalletConnectV2Service();
    }
    return WalletConnectV2Service.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true;
      }
      this.connector = new WalletConnect(WALLETCONNECT_CONFIG);
      this.subscribeToEvents();
      return true;
    } catch (error) {
      console.error('WalletConnectV2Service: Failed to initialize:', error);
      return false;
    }
  }

  async connectMetaMask(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return await this.connectMetaMaskWeb();
      } else {
        return await this.connectWalletConnect();
      }
    } catch (error) {
      console.error('WalletConnectV2Service: MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask');
      return false;
    }
  }

  private async connectMetaMaskWeb(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        Alert.alert('MetaMask Not Found', 'Please install MetaMask browser extension to connect.');
        return false;
      }

      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        Alert.alert('No Accounts', 'No MetaMask accounts found.');
        return false;
      }
      const address = accounts[0];
      const signer = await provider.getSigner();

      await this.ensureCeloAlfajoresNetwork(ethereum);

      this.connectedWallet = {
        connected: true,
        provider: provider as any,
        signer: signer as any,
        address,
        walletType: 'metamask',
        session: null, // No session for web
        chainId: 44787,
      };

      return true;
    } catch (error) {
      console.error('WalletConnectV2Service: Web MetaMask connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to MetaMask on web');
      return false;
    }
  }

  private async connectWalletConnect(): Promise<boolean> {
    if (!this.connector) {
      await this.initialize();
    }

    if (!this.connector.connected) {
      await this.connector.createSession();
      const uri = this.connector.uri;
      const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
      Linking.openURL(deepLink);
    }

    return new Promise((resolve) => {
      this.connector.on('connect', (error, payload) => {
        if (error) {
          console.error('WalletConnect connection error:', error);
          resolve(false);
        } else {
          const { accounts, chainId } = payload.params[0];
          this.updateConnectionStatus(accounts[0], chainId, this.connector.session);
          resolve(true);
        }
      });
    });
  }

  private subscribeToEvents() {
    if (!this.connector) return;

    this.connector.on('session_update', (error, payload) => {
      if (error) throw error;
      const { accounts, chainId } = payload.params[0];
      this.updateConnectionStatus(accounts[0], chainId, this.connector.session);
    });

    this.connector.on('disconnect', () => {
      this.disconnect();
    });
  }

  private updateConnectionStatus(address: string, chainId: number, session: IWalletConnectSession) {
    const provider = new ethers.JsonRpcProvider(CELO_NETWORKS.alfajores.rpcUrl);
    const signer = provider.getSigner(address);
    this.connectedWallet = {
      connected: true,
      address,
      provider,
      signer,
      walletType: 'walletconnect',
      session,
      chainId,
    };
  }

  private async ensureCeloAlfajoresNetwork(ethereum: any): Promise<void> {
    // ... (implementation remains the same)
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectedWallet;
  }

  async disconnect() {
    if (this.connector && this.connector.connected) {
      await this.connector.killSession();
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
  }
}

export default WalletConnectV2Service.getInstance();
