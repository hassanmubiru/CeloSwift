import { ContractKit, newKit } from '@celo/contractkit';
import { CeloProvider } from '@celo/react-celo';

// Contract ABIs (simplified for demo)
const REMITTANCE_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "string", "name": "recipientPhone", "type": "string"},
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "exchangeRate", "type": "uint256"},
      {"internalType": "string", "name": "reference", "type": "string"}
    ],
    "name": "createRemittance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "remittanceId", "type": "uint256"}],
    "name": "completeRemittance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "remittanceId", "type": "uint256"}],
    "name": "getRemittance",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "address", "name": "sender", "type": "address"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "string", "name": "senderPhone", "type": "string"},
          {"internalType": "string", "name": "recipientPhone", "type": "string"},
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint256", "name": "fee", "type": "uint256"},
          {"internalType": "uint256", "name": "exchangeRate", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "uint8", "name": "status", "type": "uint8"},
          {"internalType": "string", "name": "reference", "type": "string"},
          {"internalType": "bool", "name": "isKycVerified", "type": "bool"}
        ],
        "internalType": "struct RemittanceContract.Remittance",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const PHONE_REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "phoneNumber", "type": "string"},
      {"internalType": "string", "name": "name", "type": "string"}
    ],
    "name": "registerPhone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "phoneNumber", "type": "string"}],
    "name": "getAddressByPhone",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Token addresses for Celo Sepolia testnet (real tokens only)
const TOKEN_ADDRESSES = {
  CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Real cUSD on Sepolia
  CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9', // Real CELO on Sepolia
  // USDT: Not available on Sepolia testnet - no mock data
};

// Contract addresses (deployed on Celo Sepolia testnet)
let REMITTANCE_CONTRACT_ADDRESS = '0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA';
let PHONE_REGISTRY_ADDRESS = '0xF61C82188F0e4DF9082a703D8276647941b4E4f7';

export interface RemittanceData {
  id: number;
  sender: string;
  recipient: string;
  senderPhone: string;
  recipientPhone: string;
  token: string;
  amount: string;
  fee: string;
  exchangeRate: string;
  timestamp: number;
  status: number;
  reference: string;
  isKycVerified: boolean;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

class CeloService {
  private kit: ContractKit | null = null;
  private provider: CeloProvider | null = null;

  constructor() {
    this.initializeKit();
  }

  private async initializeKit() {
    try {
      // Initialize ContractKit with Celo Sepolia testnet
      this.kit = newKit('https://forno.celo-sepolia.celo-testnet.org');
    } catch (error) {
      console.error('Failed to initialize ContractKit:', error);
    }
  }

  setProvider(provider: CeloProvider) {
    this.provider = provider;
    if (this.kit) {
      this.kit.connection.addAccount(provider.account);
    }
  }

  setContractAddresses(remittanceAddress: string, phoneRegistryAddress: string) {
    REMITTANCE_CONTRACT_ADDRESS = remittanceAddress;
    PHONE_REGISTRY_ADDRESS = phoneRegistryAddress;
  }

  async getTokenBalance(address: string, tokenSymbol: string): Promise<string> {
    if (!this.kit) throw new Error('ContractKit not initialized');

    try {
      const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
      if (!tokenAddress) throw new Error(`Token ${tokenSymbol} not supported`);

      const tokenContract = await this.kit.contracts.getErc20(tokenAddress);
      const balance = await tokenContract.balanceOf(address);
      
      return this.kit.web3.utils.fromWei(balance.toString(), 'ether');
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  async getAllTokenBalances(address: string): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = [];
    
    for (const [symbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        const balance = await this.getTokenBalance(address, symbol);
        balances.push({
          symbol,
          balance,
          address: tokenAddress,
        });
      } catch (error) {
        console.error(`Error getting ${symbol} balance:`, error);
      }
    }

    return balances;
  }

  async registerPhone(phoneNumber: string, name: string): Promise<string> {
    if (!this.kit || !this.provider) throw new Error('Not connected to wallet');

    try {
      const phoneRegistry = new this.kit.web3.eth.Contract(
        PHONE_REGISTRY_ABI as any,
        PHONE_REGISTRY_ADDRESS
      );

      const tx = phoneRegistry.methods.registerPhone(phoneNumber, name);
      const gasEstimate = await tx.estimateGas({ from: this.provider.account });
      
      const result = await tx.send({
        from: this.provider.account,
        gas: gasEstimate,
      });

      return result.transactionHash;
    } catch (error) {
      console.error('Error registering phone:', error);
      throw error;
    }
  }

  async getAddressByPhone(phoneNumber: string): Promise<string> {
    if (!this.kit) throw new Error('ContractKit not initialized');

    try {
      const phoneRegistry = new this.kit.web3.eth.Contract(
        PHONE_REGISTRY_ABI as any,
        PHONE_REGISTRY_ADDRESS
      );

      const address = await phoneRegistry.methods.getAddressByPhone(phoneNumber).call();
      return address;
    } catch (error) {
      console.error('Error getting address by phone:', error);
      return '';
    }
  }

  async createRemittance(
    recipient: string,
    recipientPhone: string,
    tokenAddress: string,
    amount: string,
    exchangeRate: number,
    reference: string
  ): Promise<string> {
    if (!this.kit || !this.provider) throw new Error('Not connected to wallet');

    try {
      const remittanceContract = new this.kit.web3.eth.Contract(
        REMITTANCE_CONTRACT_ABI as any,
        REMITTANCE_CONTRACT_ADDRESS
      );

      const amountWei = this.kit.web3.utils.toWei(amount, 'ether');
      const exchangeRateWei = this.kit.web3.utils.toWei(exchangeRate.toString(), 'ether');

      const tx = remittanceContract.methods.createRemittance(
        recipient,
        recipientPhone,
        tokenAddress,
        amountWei,
        exchangeRateWei,
        reference
      );

      const gasEstimate = await tx.estimateGas({ from: this.provider.account });
      
      const result = await tx.send({
        from: this.provider.account,
        gas: gasEstimate,
      });

      return result.transactionHash;
    } catch (error) {
      console.error('Error creating remittance:', error);
      throw error;
    }
  }

  async completeRemittance(remittanceId: number): Promise<string> {
    if (!this.kit || !this.provider) throw new Error('Not connected to wallet');

    try {
      const remittanceContract = new this.kit.web3.eth.Contract(
        REMITTANCE_CONTRACT_ABI as any,
        REMITTANCE_CONTRACT_ADDRESS
      );

      const tx = remittanceContract.methods.completeRemittance(remittanceId);
      const gasEstimate = await tx.estimateGas({ from: this.provider.account });
      
      const result = await tx.send({
        from: this.provider.account,
        gas: gasEstimate,
      });

      return result.transactionHash;
    } catch (error) {
      console.error('Error completing remittance:', error);
      throw error;
    }
  }

  async getRemittance(remittanceId: number): Promise<RemittanceData | null> {
    if (!this.kit) throw new Error('ContractKit not initialized');

    try {
      const remittanceContract = new this.kit.web3.eth.Contract(
        REMITTANCE_CONTRACT_ABI as any,
        REMITTANCE_CONTRACT_ADDRESS
      );

      const result = await remittanceContract.methods.getRemittance(remittanceId).call();
      
      return {
        id: Number(result.id),
        sender: result.sender,
        recipient: result.recipient,
        senderPhone: result.senderPhone,
        recipientPhone: result.recipientPhone,
        token: result.token,
        amount: this.kit.web3.utils.fromWei(result.amount, 'ether'),
        fee: this.kit.web3.utils.fromWei(result.fee, 'ether'),
        exchangeRate: this.kit.web3.utils.fromWei(result.exchangeRate, 'ether'),
        timestamp: Number(result.timestamp),
        status: Number(result.status),
        reference: result.reference,
        isKycVerified: result.isKycVerified,
      };
    } catch (error) {
      console.error('Error getting remittance:', error);
      return null;
    }
  }

  async getUserRemittances(userAddress: string): Promise<RemittanceData[]> {
    // This would require additional contract methods or event filtering
    // For now, return empty array
    return [];
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    // In a real implementation, this would fetch from an oracle or API
    // For now, return mock data with Uganda and Kenya exchange rates
    return [
      {
        from: 'cUSD',
        to: 'USD',
        rate: 1.0,
        timestamp: Date.now(),
      },
      {
        from: 'cUSD',
        to: 'UGX', // Ugandan Shilling
        rate: 3700.0,
        timestamp: Date.now(),
      },
      {
        from: 'cUSD',
        to: 'KES', // Kenyan Shilling
        rate: 130.0,
        timestamp: Date.now(),
      },
      {
        from: 'cUSD',
        to: 'EUR',
        rate: 0.85,
        timestamp: Date.now(),
      },
    ];
  }

  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    if (!this.kit || !this.provider) throw new Error('Not connected to wallet');

    try {
      const tokenContract = await this.kit.contracts.getErc20(tokenAddress);
      const amountWei = this.kit.web3.utils.toWei(amount, 'ether');

      const tx = await tokenContract.approve(spenderAddress, amountWei).send({
        from: this.provider.account,
      });

      return tx.tx;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    if (!this.kit) throw new Error('ContractKit not initialized');

    try {
      const receipt = await this.kit.web3.eth.getTransactionReceipt(txHash);
      
      if (!receipt) return 'pending';
      if (receipt.status) return 'confirmed';
      return 'failed';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'failed';
    }
  }

  async waitForTransaction(txHash: string, timeout: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.getTransactionStatus(txHash);
      
      if (status === 'confirmed') return true;
      if (status === 'failed') return false;
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false; // Timeout
  }
}

export default new CeloService();
