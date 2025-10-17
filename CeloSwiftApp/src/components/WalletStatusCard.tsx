import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MetaMaskService, { MetaMaskConnection } from '../services/MetaMaskService';
import AuthService, { AuthUser } from '../services/AuthService';

interface WalletStatusCardProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
}

const WalletStatusCard: React.FC<WalletStatusCardProps> = ({
  onConnect,
  onDisconnect,
  onRefresh,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<MetaMaskConnection | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const metaMaskService = MetaMaskService;
  const authService = AuthService;

  useEffect(() => {
    loadWalletStatus();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const setupEventListeners = () => {
    metaMaskService.on('connected', handleWalletConnected);
    metaMaskService.on('disconnected', handleWalletDisconnected);
    metaMaskService.on('balanceUpdated', handleBalanceUpdated);
    authService.on('authenticated', handleAuthenticated);
    authService.on('loggedOut', handleLoggedOut);
  };

  const cleanupEventListeners = () => {
    metaMaskService.off('connected', handleWalletConnected);
    metaMaskService.off('disconnected', handleWalletDisconnected);
    metaMaskService.off('balanceUpdated', handleBalanceUpdated);
    authService.off('authenticated', handleAuthenticated);
    authService.off('loggedOut', handleLoggedOut);
  };

  const loadWalletStatus = async () => {
    try {
      setLoading(true);
      
      const connection = metaMaskService.getConnectionStatus();
      const user = authService.getCurrentUser();
      
      setConnectionStatus(connection);
      setAuthUser(user);
      
      // Refresh balance if connected
      if (connection.connected) {
        await metaMaskService.getBalance();
        const updatedConnection = metaMaskService.getConnectionStatus();
        setConnectionStatus(updatedConnection);
      }
    } catch (error) {
      console.error('WalletStatusCard: Load status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletStatus();
    onRefresh?.();
    setRefreshing(false);
  };

  const handleWalletConnected = (connection: MetaMaskConnection) => {
    setConnectionStatus(connection);
  };

  const handleWalletDisconnected = () => {
    setConnectionStatus(null);
    setAuthUser(null);
  };

  const handleBalanceUpdated = (balance: string) => {
    if (connectionStatus) {
      setConnectionStatus({
        ...connectionStatus,
        balance,
      });
    }
  };

  const handleAuthenticated = (user: AuthUser) => {
    setAuthUser(user);
  };

  const handleLoggedOut = () => {
    setAuthUser(null);
    setConnectionStatus(null);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your MetaMask wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              onDisconnect?.();
            } catch (error) {
              console.error('WalletStatusCard: Disconnect error:', error);
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleCopyAddress = () => {
    if (connectionStatus?.address) {
      // In a real app, you would use Clipboard.setString()
      Alert.alert('Address Copied', `Address copied to clipboard:\n${connectionStatus.address}`);
    }
  };

  const formatBalance = (balance: string | null): string => {
    if (!balance) return '0.00';
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  const getNetworkColor = (chainId: number | null): string => {
    switch (chainId) {
      case 44787: // Celo Alfajores
        return '#35D07F';
      case 42220: // Celo Mainnet
        return '#35D07F';
      default:
        return '#6B7280';
    }
  };

  const getNetworkName = (chainId: number | null): string => {
    switch (chainId) {
      case 44787:
        return 'Celo Alfajores';
      case 42220:
        return 'Celo Mainnet';
      default:
        return 'Unknown Network';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wallet status...</Text>
      </View>
    );
  }

  if (!connectionStatus?.connected || !authUser) {
    return (
      <View style={styles.disconnectedContainer}>
        <LinearGradient
          colors={['#F3F4F6', '#E5E7EB']}
          style={styles.disconnectedCard}
        >
          <View style={styles.disconnectedIcon}>
            <Ionicons name="wallet-outline" size={32} color="#6B7280" />
          </View>
          <Text style={styles.disconnectedTitle}>No Wallet Connected</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your MetaMask wallet to start using CeloSwift
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
            <Ionicons name="logo-bitcoin" size={20} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>Connect MetaMask</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <LinearGradient
        colors={['#F6851B', '#FF8C00']}
        style={styles.connectedCard}
      >
        <View style={styles.header}>
          <View style={styles.walletInfo}>
            <View style={styles.walletIcon}>
              <Ionicons name="logo-bitcoin" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.walletDetails}>
              <Text style={styles.walletName}>MetaMask</Text>
              <Text style={styles.walletAddress}>
                {metaMaskService.formatAddress(connectionStatus.address || '')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={handleDisconnect}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatBalance(connectionStatus.balance)} CELO
          </Text>
        </View>

        <View style={styles.networkSection}>
          <View style={styles.networkInfo}>
            <View 
              style={[
                styles.networkIndicator, 
                { backgroundColor: getNetworkColor(connectionStatus.chainId) }
              ]} 
            />
            <Text style={styles.networkName}>
              {getNetworkName(connectionStatus.chainId)}
            </Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
            <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Send</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Receive</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Swap</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>History</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.userInfoContainer}>
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoHeader}>
            <Ionicons name="person-circle" size={24} color="#6B7280" />
            <Text style={styles.userInfoTitle}>Account Info</Text>
          </View>
          <View style={styles.userInfoContent}>
            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>Address:</Text>
              <Text style={styles.userInfoValue}>
                {metaMaskService.formatAddress(authUser.address)}
              </Text>
            </View>
            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>Status:</Text>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.statusText}>Verified</Text>
              </View>
            </View>
            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>Connected:</Text>
              <Text style={styles.userInfoValue}>
                {new Date(authUser.loginTime).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  disconnectedContainer: {
    padding: 16,
  },
  disconnectedCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  disconnectedIcon: {
    marginBottom: 16,
  },
  disconnectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  disconnectedSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6851B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  connectedCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletDetails: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  walletAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  networkSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  networkName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  copyButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  userInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  userInfoContent: {
    gap: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default WalletStatusCard;
