import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import our services and components
import MetaMaskService from '../services/MetaMaskService';
import AuthService, { AuthUser } from '../services/AuthService';
import ErrorHandler from '../services/ErrorHandler';
import SecurityService from '../services/SecurityService';
import MetaMaskConnectModal from '../components/MetaMaskConnectModal';
import WalletStatusCard from '../components/WalletStatusCard';
import TransactionModal from '../components/TransactionModal';

const MetaMaskIntegrationExample: React.FC = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Services
  const metaMaskService = MetaMaskService;
  const authService = AuthService;
  const errorHandler = ErrorHandler;
  const securityService = SecurityService;

  useEffect(() => {
    initializeServices();
    checkConnectionStatus();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeServices = async () => {
    try {
      setLoading(true);
      
      // Initialize all services
      await Promise.all([
        metaMaskService.initialize(),
        authService.initialize(),
        errorHandler.initialize(),
        securityService.initialize(),
      ]);
      
      console.log('MetaMaskIntegrationExample: All services initialized');
    } catch (error) {
      console.error('MetaMaskIntegrationExample: Service initialization failed:', error);
      errorHandler.handleError(error, 'SERVICE_INIT_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const connection = metaMaskService.getConnectionStatus();
      const authUser = authService.getCurrentUser();
      
      setIsConnected(connection.connected);
      setIsAuthenticated(authService.isAuthenticated());
      setUser(authUser);
    } catch (error) {
      console.error('MetaMaskIntegrationExample: Status check failed:', error);
    }
  };

  const setupEventListeners = () => {
    // MetaMask events
    metaMaskService.on('connected', handleWalletConnected);
    metaMaskService.on('disconnected', handleWalletDisconnected);
    metaMaskService.on('balanceUpdated', handleBalanceUpdated);
    
    // Auth events
    authService.on('authenticated', handleAuthenticated);
    authService.on('loggedOut', handleLoggedOut);
    
    // Security events
    securityService.on('securityEvent', handleSecurityEvent);
    securityService.on('securityAlert', handleSecurityAlert);
    
    // Error events
    errorHandler.on('error', handleError);
  };

  const cleanupEventListeners = () => {
    metaMaskService.off('connected', handleWalletConnected);
    metaMaskService.off('disconnected', handleWalletDisconnected);
    metaMaskService.off('balanceUpdated', handleBalanceUpdated);
    
    authService.off('authenticated', handleAuthenticated);
    authService.off('loggedOut', handleLoggedOut);
    
    securityService.off('securityEvent', handleSecurityEvent);
    securityService.off('securityAlert', handleSecurityAlert);
    
    errorHandler.off('error', handleError);
  };

  // Event handlers
  const handleWalletConnected = (connection: any) => {
    console.log('MetaMaskIntegrationExample: Wallet connected:', connection);
    setIsConnected(true);
  };

  const handleWalletDisconnected = () => {
    console.log('MetaMaskIntegrationExample: Wallet disconnected');
    setIsConnected(false);
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleBalanceUpdated = (balance: string) => {
    console.log('MetaMaskIntegrationExample: Balance updated:', balance);
  };

  const handleAuthenticated = (authUser: AuthUser) => {
    console.log('MetaMaskIntegrationExample: User authenticated:', authUser);
    setIsAuthenticated(true);
    setUser(authUser);
    setShowConnectModal(false);
  };

  const handleLoggedOut = () => {
    console.log('MetaMaskIntegrationExample: User logged out');
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleSecurityEvent = (event: any) => {
    console.log('MetaMaskIntegrationExample: Security event:', event);
  };

  const handleSecurityAlert = (alert: any) => {
    console.log('MetaMaskIntegrationExample: Security alert:', alert);
    Alert.alert(
      'Security Alert',
      'Suspicious activity detected. Your account has been temporarily locked for security.',
      [{ text: 'OK' }]
    );
  };

  const handleError = (error: any) => {
    console.log('MetaMaskIntegrationExample: Error occurred:', error);
  };

  // Action handlers
  const handleConnectWallet = () => {
    setShowConnectModal(true);
  };

  const handleDisconnectWallet = async () => {
    try {
      await authService.logout();
      Alert.alert('Success', 'Wallet disconnected successfully');
    } catch (error) {
      console.error('MetaMaskIntegrationExample: Disconnect failed:', error);
      errorHandler.handleError(error, 'DISCONNECT_ERROR');
    }
  };

  const handleSendTransaction = () => {
    if (!isAuthenticated) {
      Alert.alert('Not Connected', 'Please connect your wallet first');
      return;
    }
    
    setShowTransactionModal(true);
  };

  const handleTransactionSuccess = (txHash: string) => {
    Alert.alert(
      'Transaction Sent',
      `Transaction submitted successfully!\n\nHash: ${txHash.slice(0, 10)}...`,
      [{ text: 'OK' }]
    );
    setShowTransactionModal(false);
  };

  const handleTransactionError = (error: string) => {
    Alert.alert('Transaction Failed', error);
  };

  const handleSignMessage = async () => {
    try {
      if (!isAuthenticated) {
        Alert.alert('Not Connected', 'Please connect your wallet first');
        return;
      }

      const message = 'Hello from CeloSwift!';
      const signature = await metaMaskService.signMessage(message);
      
      Alert.alert(
        'Message Signed',
        `Message signed successfully!\n\nSignature: ${signature.slice(0, 20)}...`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('MetaMaskIntegrationExample: Sign message failed:', error);
      errorHandler.handleError(error, 'SIGN_MESSAGE_ERROR');
    }
  };

  const handleGetBalance = async () => {
    try {
      if (!isConnected) {
        Alert.alert('Not Connected', 'Please connect your wallet first');
        return;
      }

      const balance = await metaMaskService.getBalance();
      Alert.alert('Balance', `Your balance: ${balance} CELO`);
    } catch (error) {
      console.error('MetaMaskIntegrationExample: Get balance failed:', error);
      errorHandler.handleError(error, 'GET_BALANCE_ERROR');
    }
  };

  const handleRefreshConnection = async () => {
    try {
      setLoading(true);
      await checkConnectionStatus();
      Alert.alert('Success', 'Connection status refreshed');
    } catch (error) {
      console.error('MetaMaskIntegrationExample: Refresh failed:', error);
      errorHandler.handleError(error, 'REFRESH_ERROR');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#F6851B', '#FF8C00']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>MetaMask Integration</Text>
          <Text style={styles.headerSubtitle}>
            Complete wallet integration example
          </Text>
        </LinearGradient>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Wallet Status:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Authentication:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isAuthenticated ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Status Card */}
        {isConnected && (
          <WalletStatusCard
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            onRefresh={handleRefreshConnection}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isConnected ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConnectWallet}
            >
              <LinearGradient
                colors={['#F6851B', '#FF8C00']}
                style={styles.buttonGradient}
              >
                <Ionicons name="logo-bitcoin" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Connect MetaMask</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSendTransaction}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Send Transaction</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSignMessage}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="pencil" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Sign Message</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleGetBalance}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="wallet" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Get Balance</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDisconnectWallet}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="log-out" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Disconnect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.sectionTitle}>User Information</Text>
            <View style={styles.userInfoCard}>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Address:</Text>
                <Text style={styles.userInfoValue}>
                  {user.address.slice(0, 6)}...{user.address.slice(-4)}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Status:</Text>
                <Text style={styles.userInfoValue}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Login Time:</Text>
                <Text style={styles.userInfoValue}>
                  {new Date(user.loginTime).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features Included</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.featureText}>Secure wallet connection</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="key" size={20} color="#10B981" />
              <Text style={styles.featureText}>Message signing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="swap-horizontal" size={20} color="#10B981" />
              <Text style={styles.featureText}>Transaction signing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed" size={20} color="#10B981" />
              <Text style={styles.featureText}>Authentication flow</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="alert-circle" size={20} color="#10B981" />
              <Text style={styles.featureText}>Error handling</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="security" size={20} color="#10B981" />
              <Text style={styles.featureText}>Security measures</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <MetaMaskConnectModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleAuthenticated}
        onError={(error) => {
          console.error('Connect modal error:', error);
          errorHandler.handleError(error, 'CONNECT_MODAL_ERROR');
        }}
      />

      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={handleTransactionSuccess}
        onError={handleTransactionError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  userInfoContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  userInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  featuresContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  featuresList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
});

export default MetaMaskIntegrationExample;
