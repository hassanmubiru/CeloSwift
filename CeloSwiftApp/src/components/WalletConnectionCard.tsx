import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WalletService from '../services/WalletService';

interface WalletConnectionCardProps {
  onConnectionChange?: (connected: boolean, address?: string) => void;
}

const WalletConnectionCard: React.FC<WalletConnectionCardProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    const status = WalletService.getConnectionStatus();
    setConnectionInfo(status);
    setIsConnected(status.connected);
    onConnectionChange?.(status.connected, status.address);
  };

  const connectWallet = async () => {
    setIsLoading(true);
    
    try {
      const success = await WalletService.connect();
      
      if (success) {
        checkConnectionStatus();
        showSuccessMessage();
      }
    } catch (error: any) {
      showErrorMessage(error.message || 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    
    try {
      await WalletService.disconnect();
      checkConnectionStatus();
      onConnectionChange?.(false);
    } catch (error: any) {
      showErrorMessage('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = () => {
    Alert.alert(
      'Wallet Connected!',
      'Your wallet has been connected successfully.',
      [{ text: 'Great!' }]
    );
  };

  const showErrorMessage = (message: string) => {
    Alert.alert(
      'Connection Error',
      message,
      [{ text: 'OK' }]
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPlatformIcon = () => {
    if (Platform.OS === 'web') {
      return 'globe-outline';
    } else if (Platform.OS === 'ios') {
      return 'phone-portrait-outline';
    } else {
      return 'phone-portrait-outline';
    }
  };

  const getPlatformText = () => {
    if (Platform.OS === 'web') {
      return 'Web Browser';
    } else if (Platform.OS === 'ios') {
      return 'iOS Device';
    } else {
      return 'Android Device';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#35D07F', '#2BC4A3']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Wallet Connection</Text>
            <Text style={styles.subtitle}>{getPlatformText()}</Text>
          </View>
          <View style={styles.platformIcon}>
            <Ionicons name={getPlatformIcon()} size={20} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.content}>
          {!isConnected ? (
            <View style={styles.disconnectedState}>
              <View style={styles.statusIndicator}>
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                <Text style={styles.statusText}>Not Connected</Text>
              </View>
              
              <Text style={styles.description}>
                {Platform.OS === 'web' 
                  ? 'Connect your MetaMask wallet to access all features'
                  : 'Connect your MetaMask wallet using the mobile app'
                }
              </Text>

              <TouchableOpacity
                style={styles.connectButton}
                onPress={connectWallet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="log-in" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.connectedState}>
              <View style={styles.statusIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.statusText}>Connected</Text>
              </View>

              <View style={styles.connectionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{formatAddress(connectionInfo?.address)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Network:</Text>
                  <Text style={styles.detailValue}>{connectionInfo?.networkName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance:</Text>
                  <Text style={styles.detailValue}>{connectionInfo?.balance} CELO</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={disconnectWallet}
                disabled={isLoading}
              >
                <Ionicons name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {isLoading ? 'Disconnecting...' : 'Disconnect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    margin: 16,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    minHeight: 120,
  },
  disconnectedState: {
    alignItems: 'center',
  },
  connectedState: {
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectionDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});

export default WalletConnectionCard;
