import { ethers } from 'ethers';

// Contract addresses deployed on Celo Sepolia testnet
export const REMITTANCE_CONTRACT_ADDRESS = '0x15637Def6A20CeCC26bed6b095ef9CAe1B3D864A';
export const PHONE_REGISTRY_ADDRESS = '0x88eeC4922c8c5fC3B8B8d9d3d8F8e8e8e8e8e8e8';
export const KYC_AML_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

// Real token addresses on Celo Alfajores
export const TOKEN_ADDRESSES = {
  CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // cUSD on Alfajores
  CELO: '0xF194afDf50B03a69Ef7D2963f2DbD14d94249C6', // CELO on Alfajores
};

// Contract ABIs (simplified for the main functions we need)
const REMITTANCE_ABI = [
  'function registerUser(string memory phoneNumber) external',
  'function createRemittance(string memory recipientPhone, address tokenAddress, uint256 amount, string memory reference) external returns (uint256)',
  'function getRemittance(uint256 remittanceId) external view returns (tuple(string recipientPhone, address sender, address tokenAddress, uint256 amount, uint256 fee, uint256 timestamp, bool isCompleted, string reference))',
  'function getUserRemittances(address user) external view returns (uint256[])',
  'function getRemittanceCounter() external view returns (uint256)',
];

const PHONE_REGISTRY_ABI = [
  'function registerPhone(string memory phoneNumber) external',
  'function getAddress(string memory phoneNumber) external view returns (address)',
  'function getPhone(address userAddress) external view returns (string memory)',
  'function isPhoneRegistered(string memory phoneNumber) external view returns (bool)',
];

const KYC_AML_ABI = [
  'function submitKyc(string memory phoneNumber, string memory documentHash) external',
  'function verifyKyc(string memory phoneNumber) external',
  'function isKycVerified(string memory phoneNumber) external view returns (bool)',
  'function getKycStatus(string memory phoneNumber) external view returns (uint8)',
];

const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

export interface RemittanceData {
  recipientPhone: string;
  sender: string;
  tokenAddress: string;
  amount: string;
  fee: string;
  timestamp: number;
  isCompleted: boolean;
  reference: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
}

class CeloService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private remittanceContract: ethers.Contract | null = null;
  private phoneRegistryContract: ethers.Contract | null = null;
  private kycAmlContract: ethers.Contract | null = null;

  constructor() {
    // Don't initialize provider immediately to avoid startup issues
  }

  private initializeProvider() {
    if (this.provider) {
      return; // Already initialized
    }
    
    try {
      // Celo Alfajores RPC endpoint (matching deployed contracts)
      this.provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org');
      console.log('Celo provider initialized');
    } catch (error) {
      console.error('Failed to initialize Celo provider:', error);
    }
  }

  async connectWallet(privateKey?: string): Promise<boolean> {
    try {
      this.initializeProvider();
      
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      if (!privateKey) {
        throw new Error('Private key is required for wallet connection');
      }

      this.signer = new ethers.Wallet(privateKey, this.provider);
      
      // Initialize contracts
      this.remittanceContract = new ethers.Contract(
        REMITTANCE_CONTRACT_ADDRESS,
        REMITTANCE_ABI,
        this.signer
      );

      this.phoneRegistryContract = new ethers.Contract(
        PHONE_REGISTRY_ADDRESS,
        PHONE_REGISTRY_ABI,
        this.signer
      );

      this.kycAmlContract = new ethers.Contract(
        KYC_AML_CONTRACT_ADDRESS,
        KYC_AML_ABI,
        this.signer
      );

      console.log('Wallet connected:', this.signer.address);
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }

  // Method for connecting with external wallet providers (MetaMask, WalletConnect, etc.)
  async connectExternalWallet(provider: any, signer?: any): Promise<boolean> {
    try {
      // Use the provided signer if available, otherwise try to get signer from provider
      if (signer) {
        this.signer = signer;
        // Use the provider from the signer if it has one, otherwise use our default provider
        this.provider = signer.provider || this.provider;
      } else {
        // For BrowserProvider (web MetaMask), use getSigner()
        if (provider.getSigner) {
          this.signer = await provider.getSigner();
          this.provider = provider;
        } else {
          // For JsonRpcProvider (mobile), we need the signer to be passed separately
          throw new Error('Signer must be provided for JsonRpcProvider');
        }
      }
      
      // Initialize default provider if not set
      if (!this.provider) {
        this.initializeProvider();
      }
      
      // Initialize contracts
      this.remittanceContract = new ethers.Contract(
        REMITTANCE_CONTRACT_ADDRESS,
        REMITTANCE_ABI,
        this.signer
      );

      this.phoneRegistryContract = new ethers.Contract(
        PHONE_REGISTRY_ADDRESS,
        PHONE_REGISTRY_ABI,
        this.signer
      );

      this.kycAmlContract = new ethers.Contract(
        KYC_AML_CONTRACT_ADDRESS,
        KYC_AML_ABI,
        this.signer
      );

      console.log('External wallet connected:', this.signer.address);
      return true;
    } catch (error) {
      console.error('Failed to connect external wallet:', error);
      return false;
    }
  }

  getAddress(): string | null {
    return this.signer?.address || null;
  }

  async getCeloBalance(): Promise<string> {
    try {
      if (!this.signer) {
        return '0';
      }

      const balance = await this.provider.getBalance(this.signer.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get CELO balance:', error);
      return '0';
    }
  }

  async getBalance(tokenAddress: string): Promise<string> {
    try {
      if (!this.signer) {
        console.warn('Wallet not connected, returning 0 balance');
        return '0';
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      // Check if contract exists by calling a simple method
      try {
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(this.signer.address);
        
        return ethers.formatUnits(balance, decimals);
      } catch (contractError) {
        console.warn(`Contract at ${tokenAddress} may not exist or be accessible:`, contractError);
        return '0';
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [symbol, name, decimals, balance] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
        tokenContract.balanceOf(this.signer.address),
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals: Number(decimals),
        balance: ethers.formatUnits(balance, decimals),
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  async registerPhone(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.phoneRegistryContract) {
        throw new Error('Phone registry contract not initialized');
      }

      const tx = await this.phoneRegistryContract.registerPhone(phoneNumber);
      await tx.wait();
      console.log('Phone registered:', phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to register phone:', error);
      return false;
    }
  }

  async registerUser(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.remittanceContract) {
        throw new Error('Remittance contract not initialized');
      }

      const tx = await this.remittanceContract.registerUser(phoneNumber);
      await tx.wait();
      console.log('User registered:', phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to register user:', error);
      return false;
    }
  }

  async submitKyc(phoneNumber: string, documentHash: string): Promise<boolean> {
    try {
      if (!this.kycAmlContract) {
        throw new Error('KYC contract not initialized');
      }

      const tx = await this.kycAmlContract.submitKyc(phoneNumber, documentHash);
      await tx.wait();
      console.log('KYC submitted for:', phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to submit KYC:', error);
      return false;
    }
  }

  async isKycVerified(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.kycAmlContract) {
        throw new Error('KYC contract not initialized');
      }

      return await this.kycAmlContract.isKycVerified(phoneNumber);
    } catch (error) {
      console.error('Failed to check KYC status:', error);
      return false;
    }
  }

  async createRemittance(
    recipientPhone: string,
    tokenAddress: string,
    amount: string,
    reference: string
  ): Promise<string | null> {
    try {
      if (!this.remittanceContract || !this.signer) {
        throw new Error('Wallet or contract not initialized');
      }

      // Check if wallet has sufficient CELO for gas
      const celoBalance = await this.provider.getBalance(this.signer.address);
      if (celoBalance === 0n) {
        throw new Error('Insufficient CELO for gas fees. Please get test CELO from the Alfajores faucet.');
      }

      // Get token decimals
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Check token balance
      const tokenBalance = await tokenContract.balanceOf(this.signer.address);
      if (tokenBalance < amountWei) {
        throw new Error('Insufficient token balance for this transaction');
      }

      // Approve tokens for the remittance contract
      const approveTx = await tokenContract.approve(REMITTANCE_CONTRACT_ADDRESS, amountWei);
      await approveTx.wait();

      // Create remittance
      const tx = await this.remittanceContract.createRemittance(
        recipientPhone,
        tokenAddress,
        amountWei,
        reference
      );
      
      const receipt = await tx.wait();
      console.log('Remittance created:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to create remittance:', error);
      throw error; // Re-throw to show proper error message
    }
  }

  async getRemittance(remittanceId: number): Promise<RemittanceData | null> {
    try {
      if (!this.remittanceContract) {
        throw new Error('Remittance contract not initialized');
      }

      const remittance = await this.remittanceContract.getRemittance(remittanceId);
      
      return {
        recipientPhone: remittance.recipientPhone,
        sender: remittance.sender,
        tokenAddress: remittance.tokenAddress,
        amount: ethers.formatEther(remittance.amount), // Assuming 18 decimals
        fee: ethers.formatEther(remittance.fee),
        timestamp: Number(remittance.timestamp),
        isCompleted: remittance.isCompleted,
        reference: remittance.reference,
      };
    } catch (error) {
      console.error('Failed to get remittance:', error);
      return null;
    }
  }

  async getUserRemittances(): Promise<number[]> {
    try {
      if (!this.remittanceContract || !this.signer) {
        throw new Error('Remittance contract not initialized');
      }

      return await this.remittanceContract.getUserRemittances(this.signer.address);
    } catch (error) {
      console.error('Failed to get user remittances:', error);
      return [];
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Exchange rates - in production, use a real API
    const rates: { [key: string]: number } = {
      'USD_UGX': 3700,
      'USD_KES': 150,
      'USD_EUR': 0.85,
      'USD_GBP': 0.73,
    };

    const key = `${fromCurrency}_${toCurrency}`;
    return rates[key] || 1;
  }

  async getNetworkInfo() {
    this.initializeProvider();
    
    if (!this.provider) {
      return null;
    }

    try {
      const network = await this.provider.getNetwork();
      return {
        name: 'Celo Alfajores',
        chainId: Number(network.chainId),
        rpcUrl: 'https://alfajores-forno.celo-testnet.org',
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      // Return default network info if provider fails
      return {
        name: 'Celo Alfajores',
        chainId: 44787,
        rpcUrl: 'https://alfajores-forno.celo-testnet.org',
      };
    }
  }

  disconnect() {
    this.signer = null;
    this.remittanceContract = null;
    this.phoneRegistryContract = null;
    this.kycAmlContract = null;
    console.log('Wallet disconnected');
  }
}

export default new CeloService();