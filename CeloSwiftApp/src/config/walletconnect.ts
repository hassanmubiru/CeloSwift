// WalletConnect Configuration
// To get your own Project ID, visit: https://cloud.walletconnect.com/

export const WALLETCONNECT_CONFIG = {
  // You can use this demo project ID for testing, but for production
  // you should get your own Project ID from WalletConnect Cloud
  projectId: '64bf4df50ff30454e356068c418b9d31', // Demo project ID - replace with your own
  
  // App metadata
  metadata: {
    name: 'CeloSwift',
    description: 'Mobile-first decentralized remittance application on Celo',
    url: 'https://celoswift.app',
    icons: ['https://celoswift.app/icon.png'],
  },
  
  // Redirect configuration for deep linking
  redirect: {
    native: 'celoswift://', // Your app's custom URL scheme
    universal: 'https://celoswift.app', // Your app's universal link
  },
  
  // Required namespaces for Celo network
  requiredNamespaces: {
    eip155: {
      methods: [
        'eth_sendTransaction',
        'eth_signTransaction', 
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'eth_signTypedData_v4',
        'eth_requestAccounts',
        'eth_accounts',
        'eth_chainId',
        'eth_getBalance',
        'eth_getTransactionCount',
        'eth_getTransactionReceipt',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
      ],
      chains: ['eip155:44787'], // Celo Alfajores chain ID
      events: ['chainChanged', 'accountsChanged', 'connect', 'disconnect'],
    },
  },
  
  // Optional namespaces for additional functionality
  optionalNamespaces: {
    eip155: {
      methods: [
        'eth_requestAccounts',
        'eth_accounts',
        'eth_chainId',
        'eth_getBalance',
        'eth_getTransactionCount',
        'eth_getTransactionReceipt',
        'eth_blockNumber',
        'eth_getBlockByNumber',
        'eth_getTransactionByHash',
        'eth_estimateGas',
        'eth_gasPrice',
      ],
      chains: ['eip155:44787', 'eip155:42220'], // Celo Alfajores and Mainnet
      events: ['chainChanged', 'accountsChanged', 'connect', 'disconnect'],
    },
  },
};

// MetaMask specific configuration
export const METAMASK_CONFIG = {
  // Deep link schemes for mobile MetaMask
  deepLinks: {
    ios: 'metamask://',
    android: 'metamask://',
  },
  
  // Store URLs for MetaMask installation
  storeUrls: {
    ios: 'https://apps.apple.com/app/metamask/id1438144202',
    android: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  
  // MetaMask specific methods
  methods: [
    'eth_requestAccounts',
    'eth_accounts',
    'eth_chainId',
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain',
    'eth_getBalance',
    'eth_getTransactionCount',
    'eth_getTransactionReceipt',
  ],
  
  // Supported events
  events: [
    'chainChanged',
    'accountsChanged',
    'connect',
    'disconnect',
  ],
};

// Celo network configuration
export const CELO_NETWORKS = {
  alfajores: {
    chainId: 44787,
    chainName: 'Celo Alfajores Testnet',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
    blockExplorerUrl: 'https://alfajores.celoscan.io',
    blockExplorerUrls: ['https://alfajores.celoscan.io'],
    currency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 42220,
    chainName: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    rpcUrls: ['https://forno.celo.org'],
    blockExplorerUrl: 'https://celoscan.io',
    blockExplorerUrls: ['https://celoscan.io'],
    currency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
};

// Token addresses on Celo networks
export const TOKEN_ADDRESSES = {
  alfajores: {
    CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    CELO: '0xF194afDf50B03a69Ef7D2963f2DbD14d94249C6',
    CEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  },
  mainnet: {
    CUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    CEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  },
};
