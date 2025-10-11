// Simplified CeloService for demo purposes - avoids crypto polyfill issues

// Contract addresses (deployed on Celo Sepolia testnet)
let REMITTANCE_CONTRACT_ADDRESS = '0x71b6977A253643378e0c5f05BA6DCF7295aBD4FA';
let PHONE_REGISTRY_ADDRESS = '0xF61C82188F0e4DF9082a703D8276647941b4E4f7';

// Token addresses for Celo Sepolia testnet (real tokens only)
const TOKEN_ADDRESSES = {
  CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Real cUSD on Sepolia
  CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9', // Real CELO on Sepolia
};

export interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
}

export interface Remittance {
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

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

class CeloService {
  private provider: any = null;

  constructor() {
    console.log('CeloService initialized (simplified demo mode)');
  }

  setProvider(provider: any) {
    this.provider = provider;
    console.log('Provider set:', provider);
  }

  setContractAddresses(remittanceAddress: string, phoneRegistryAddress: string) {
    REMITTANCE_CONTRACT_ADDRESS = remittanceAddress;
    PHONE_REGISTRY_ADDRESS = phoneRegistryAddress;
  }

  async getTokenBalance(address: string, tokenSymbol: string): Promise<string> {
    console.log(`Getting ${tokenSymbol} balance for ${address}`);
    
    // Return mock balances for demo
    const mockBalances: { [key: string]: string } = {
      'CUSD': '100.50',
      'CELO': '5.25',
      'USDT': '0.00'
    };
    
    return mockBalances[tokenSymbol] || '0';
  }

  async getAllTokenBalances(address: string): Promise<TokenBalance[]> {
    console.log(`Getting all token balances for ${address}`);
    
    return [
      {
        symbol: 'CUSD',
        address: TOKEN_ADDRESSES.CUSD,
        balance: '100.50',
        decimals: 18
      },
      {
        symbol: 'CELO',
        address: TOKEN_ADDRESSES.CELO,
        balance: '5.25',
        decimals: 18
      }
    ];
  }

  async registerPhone(phoneNumber: string, name: string): Promise<string> {
    console.log(`Registering phone ${phoneNumber} for ${name}`);
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async getAddressByPhone(phoneNumber: string): Promise<string> {
    console.log(`Getting address for phone ${phoneNumber}`);
    return '0x' + Math.random().toString(16).substr(2, 40);
  }

  async createRemittance(
    recipient: string,
    recipientPhone: string,
    tokenSymbol: string,
    amount: string,
    exchangeRate: string,
    reference: string
  ): Promise<string> {
    console.log(`Creating remittance: ${amount} ${tokenSymbol} to ${recipientPhone}`);
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async completeRemittance(remittanceId: number): Promise<string> {
    console.log(`Completing remittance ${remittanceId}`);
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async getRemittance(remittanceId: number): Promise<Remittance | null> {
    console.log(`Getting remittance ${remittanceId}`);
    
    // Return mock remittance data
    return {
      id: remittanceId,
      sender: '0x' + Math.random().toString(16).substr(2, 40),
      recipient: '0x' + Math.random().toString(16).substr(2, 40),
      senderPhone: '+256752271548',
      recipientPhone: '+254712345678',
      token: TOKEN_ADDRESSES.CUSD,
      amount: '50.00',
      fee: '2.50',
      exchangeRate: '3700.0',
      timestamp: Date.now(),
      status: 1, // Pending
      reference: 'REF' + Math.random().toString(36).substr(2, 8),
      isKycVerified: true
    };
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    return [
      { from: 'cUSD', to: 'USD', rate: 1.0, timestamp: Date.now() },
      { from: 'cUSD', to: 'EUR', rate: 0.85, timestamp: Date.now() },
      { from: 'cUSD', to: 'GBP', rate: 0.73, timestamp: Date.now() },
      { from: 'cUSD', to: 'UGX', rate: 3700.0, timestamp: Date.now() }, // Uganda Shilling
      { from: 'cUSD', to: 'KES', rate: 130.0, timestamp: Date.now() },  // Kenya Shilling
    ];
  }

  async submitKyc(userAddress: string, documentHash: string, documentType: string): Promise<string> {
    console.log(`Submitting KYC for ${userAddress}`);
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async isKycVerified(userAddress: string): Promise<boolean> {
    console.log(`Checking KYC status for ${userAddress}`);
    return true; // Mock as verified for demo
  }

  async getRemittanceHistory(userAddress: string): Promise<Remittance[]> {
    console.log(`Getting remittance history for ${userAddress}`);
    
    // Return mock history
    return [
      {
        id: 1,
        sender: userAddress,
        recipient: '0x' + Math.random().toString(16).substr(2, 40),
        senderPhone: '+256752271548',
        recipientPhone: '+254712345678',
        token: TOKEN_ADDRESSES.CUSD,
        amount: '25.00',
        fee: '1.25',
        exchangeRate: '3700.0',
        timestamp: Date.now() - 86400000, // 1 day ago
        status: 2, // Completed
        reference: 'REF123456',
        isKycVerified: true
      }
    ];
  }
}

export default new CeloService();