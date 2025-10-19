import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import CeloService, { TOKEN_ADDRESSES } from '../services/CeloService';
import SimpleWalletService from '../services/SimpleWalletService';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import RecentTransactions from '../components/RecentTransactions';
import ExchangeRateCard from '../components/ExchangeRateCard';
import WalletConnectionModal from '../components/WalletConnectionModal';
import WalletInstructions from '../components/WalletInstructions';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Header from '../components/Header';
import StatusIndicator from '../components/StatusIndicator';
import { theme } from '../styles/theme';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    }
  }, [isConnected, address]);

  const initializeApp = async () => {
    try {
      const network = await CeloService.getNetworkInfo();
      setNetworkInfo(network);
      
      // Check if we're already connected to a mobile wallet
      const mobileConnectionStatus = MobileWalletService.getConnectionStatus();
      if (mobileConnectionStatus && mobileConnectionStatus.address) {
        setIsConnected(true);
        setAddress(mobileConnectionStatus.address);
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      if (isConnected && address) {
        // Get cUSD balance
        const cusdBalance = await CeloService.getBalance(TOKEN_ADDRESSES.CUSD);
        setBalance(cusdBalance);
        
        // Get exchange rate
        const rate = await CeloService.getExchangeRate('USD', 'UGX');
        setExchangeRate(rate);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleConnectWallet = () => {
    console.log('HomeScreen: handleConnectWallet called');
    setIsLoading(true);
    // Show loading state for better UX
    setTimeout(() => {
      console.log('HomeScreen: Setting showWalletModal to true');
      setIsLoading(false);
      setShowWalletModal(true);
    }, 300);
  };

  const handleWalletConnect = async (walletType: string) => {
    console.log('HomeScreen: handleWalletConnect called with walletType:', walletType);
    if (walletType === 'metamask') {
      try {
        // Use the unified MetaMask service
        const success = await SimpleWalletService.connect();
        
        if (success) {
          const connectionStatus = SimpleWalletService.getConnectionStatus();
          console.log('HomeScreen: SimpleWalletService connection status:', connectionStatus);
          
          if (connectionStatus && connectionStatus.address) {
            // Successfully connected
            setIsConnected(true);
            setAddress(connectionStatus.address);
            
            // Update CeloService with the wallet provider and signer
            if (connectionStatus.provider && connectionStatus.signer) {
              // Use the wallet provider and signer for Celo operations
              await CeloService.connectExternalWallet(connectionStatus.provider, connectionStatus.signer);
            }
            
            // Fetch user data
            await fetchUserData();
            
            Alert.alert(
              'MetaMask Connected Successfully!',
              `Connected to ${connectionStatus.walletType || 'MetaMask'}\nAddress: ${connectionStatus.address.slice(0, 6)}...${connectionStatus.address.slice(-4)}`,
              [{ text: 'OK' }]
            );
          }
        } else {
          console.log('HomeScreen: MetaMask connection failed or cancelled');
        }
      } catch (error) {
        console.error('HomeScreen: MetaMask connection error:', error);
        Alert.alert('Connection Error', 'Failed to connect to MetaMask');
      }
    } else if (walletType === 'coinbase' || walletType === 'trust') {
      // For other wallets, show instructions
      setSelectedWallet(walletType);
      setShowInstructions(true);
    }
  };

  const handleQuickAction = (action: string) => {
    if (!isConnected) {
      Alert.alert(
        'Wallet Not Connected',
        'Please connect your wallet first to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Wallet', onPress: handleConnectWallet }
        ]
      );
      return;
    }

    switch (action) {
      case 'send':
        navigation.navigate('Send' as never);
        break;
      case 'receive':
        navigation.navigate('Receive' as never);
        break;
      case 'scan':
        navigation.navigate('Send' as never);
        break;
      case 'history':
        navigation.navigate('History' as never);
        break;
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      MobileWalletService.disconnect();
      Web3ProviderService.disconnect();
      CeloService.disconnect();
      setIsConnected(false);
      setAddress('');
      setBalance('0.00');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect wallet');
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.welcomeContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="flash" size={80} color="#35D07F" />
              <Text style={styles.appName}>CeloSwift</Text>
              <Text style={styles.tagline}>
                Fast, Low-Cost Cross-Border Remittances
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="speedometer" size={24} color={theme.colors.primary} />
                <Text style={styles.featureText}>Ultra-fast transfers</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cash" size={24} color={theme.colors.primary} />
                <Text style={styles.featureText}>Minimal fees</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="globe" size={24} color={theme.colors.primary} />
                <Text style={styles.featureText}>Global reach</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
                <Text style={styles.featureText}>Secure & compliant</Text>
              </View>
            </View>

            <Button
              title={isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              onPress={handleConnectWallet}
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              icon="wallet"
              style={styles.connectButton}
            />
            
            {!isConnected && !isLoading && (
              <Text style={styles.connectSubtext}>
                MetaMask, WalletConnect & more
              </Text>
            )}

            {!isConnected && (
              <View style={styles.faucetInfo}>
                <Text style={styles.faucetTitle}>Ready to Get Started?</Text>
                <Text style={styles.faucetText}>
                  Connect your wallet to start using CeloSwift for fast, low-cost remittances on the Celo network.
                </Text>
                <Text style={styles.faucetSubtext}>
                  Supported wallets: MetaMask, WalletConnect, Coinbase Wallet, Trust Wallet
                </Text>
              </View>
            )}

            {isConnected && (
              <View style={styles.faucetInfo}>
                <Text style={styles.faucetTitle}>Need Test Tokens?</Text>
                <Text style={styles.faucetText}>
                  Get free test CELO and cUSD from the Alfajores faucet:
                </Text>
                <Text style={styles.faucetLink}>
                  https://faucet.celo.org/alfajores
                </Text>
              </View>
            )}

            <Text style={styles.networkInfo}>
              Connected to: {networkInfo?.name || 'Celo Alfajores'}
            </Text>
          </View>
        </ScrollView>

        {/* Wallet Connection Modal */}
        <WalletConnectionModal
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={handleWalletConnect}
        />

        {/* Wallet Instructions Modal */}
        <Modal
          visible={showInstructions}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInstructions(false)}
        >
          <View style={styles.instructionsOverlay}>
            <WalletInstructions
              walletType={selectedWallet}
              onClose={() => setShowInstructions(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }

  if (isConnected) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        
        <Header
          title="Welcome back!"
          subtitle={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          onProfilePress={() => navigation.navigate('Profile' as never)}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <StatusIndicator
              status="connected"
              network={networkInfo?.name || 'Celo Alfajores'}
              address={address}
            />

            <BalanceCard balance={balance} currency="cUSD" />

            <ExchangeRateCard rate={exchangeRate} />

            <QuickActions
              onSendPress={() => handleQuickAction('send')}
              onReceivePress={() => handleQuickAction('receive')}
              onScanPress={() => handleQuickAction('scan')}
              onHistoryPress={() => handleQuickAction('history')}
            />

            <RecentTransactions />
          </View>
        </ScrollView>

        {/* Wallet Connection Modal */}
        <WalletConnectionModal
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={handleWalletConnect}
        />

        {/* Wallet Instructions Modal */}
        <Modal
          visible={showInstructions}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInstructions(false)}
        >
          <View style={styles.instructionsOverlay}>
            <WalletInstructions
              walletType={selectedWallet}
              onClose={() => setShowInstructions(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with wallet info */}
        <View style={styles.header}>
          <View style={styles.walletInfo}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.walletAddress}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnectWallet}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <BalanceCard balance={balance} currency="cUSD" />

        {/* Exchange Rate Card */}
        <ExchangeRateCard rate={exchangeRate} />

        {/* Quick Actions */}
        <QuickActions 
          onSendPress={() => handleQuickAction('send')}
          onReceivePress={() => handleQuickAction('receive')}
          onScanPress={() => handleQuickAction('scan')}
          onHistoryPress={() => handleQuickAction('history')}
        />

        {/* Recent Transactions */}
        <RecentTransactions />

        {/* Network Status */}
        <View style={styles.networkStatus}>
          <View style={styles.networkIndicator}>
            <View style={[styles.networkDot, { backgroundColor: '#35D07F' }]} />
            <Text style={styles.networkText}>
              {networkInfo?.name || 'Celo Sepolia'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: theme.spacing['2xl'],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  featureText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  connectButton: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  connectSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  connectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectButtonTextContainer: {
    marginLeft: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectButtonSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  networkInfo: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  disconnectButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
  },
  networkStatus: {
    marginTop: 20,
    alignItems: 'center',
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  networkText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  faucetInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  faucetTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  faucetText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  faucetSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  faucetLink: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontFamily: 'monospace',
    textDecorationLine: 'underline',
  },
  instructionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.lg,
  },
});

export default HomeScreen;
