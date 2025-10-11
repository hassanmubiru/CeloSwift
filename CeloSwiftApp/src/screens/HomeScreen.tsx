import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CeloService from '../services/CeloService';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import RecentTransactions from '../components/RecentTransactions';
import ExchangeRateCard from '../components/ExchangeRateCard';

const HomeScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

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
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      if (isConnected && address) {
        // Get cUSD balance
        const cusdBalance = await CeloService.getBalance(CeloService.TOKEN_ADDRESSES.CUSD);
        setBalance(cusdBalance);
        
        // Get exchange rate
        const rate = await CeloService.getExchangeRate('USD', 'UGX');
        setExchangeRate(rate);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      // For demo purposes, we'll use a placeholder private key
      // In a real app, this would come from wallet connection
      const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      
      const connected = await CeloService.connectWallet(privateKey);
      if (connected) {
        const walletAddress = CeloService.getAddress();
        if (walletAddress) {
          setIsConnected(true);
          setAddress(walletAddress);
        }
      } else {
        Alert.alert('Error', 'Failed to connect wallet');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    }
  };

  const handleDisconnectWallet = async () => {
    try {
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
                <Ionicons name="speedometer" size={24} color="#35D07F" />
                <Text style={styles.featureText}>Ultra-fast transfers</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cash" size={24} color="#35D07F" />
                <Text style={styles.featureText}>Minimal fees</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="globe" size={24} color="#35D07F" />
                <Text style={styles.featureText}>Global reach</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={24} color="#35D07F" />
                <Text style={styles.featureText}>Secure & compliant</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectWallet}
            >
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>

            <Text style={styles.networkInfo}>
              Connected to: {networkInfo?.name || 'Celo Sepolia'}
            </Text>
          </View>
        </ScrollView>
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
        <QuickActions />

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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#35D07F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#35D07F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
});

export default HomeScreen;
