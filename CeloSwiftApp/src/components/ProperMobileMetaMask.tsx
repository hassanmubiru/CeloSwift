
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WalletService from '../services/WalletService';

const ProperMobileMetaMask: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connectionStatus = WalletService.getConnectionStatus();
      setStatus(connectionStatus);
    };
    checkConnection();

    // Listen for connection updates (optional, if your service supports events)
    // This is a placeholder for a real event listener
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const connectWithMetaMask = async () => {
    setIsLoading(true);
    try {
      const success = await WalletService.connect();
      if (success) {
        setStatus(WalletService.getConnectionStatus());
      } else {
        Alert.alert('Connection Failed', 'Could not connect to MetaMask. Please try again.');
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      Alert.alert('Error', 'An unexpected error occurred while connecting to MetaMask.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    await WalletService.disconnect();
    setStatus(WalletService.getConnectionStatus());
  };

  const testAction = () => {
    if (!status?.connected) {
      Alert.alert('Not Connected', 'Please connect your wallet first.');
      return;
    }
    Alert.alert('Action Test', `This would perform an action with your wallet: ${status.address}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={32} color="#FFFFFF" />
        <Text style={styles.title}>True MetaMask Integration</Text>
        <Text style={styles.subtitle}>with WalletConnect</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Connection Status:</Text>
          {status?.connected ? (
            <>
              <Text style={styles.statusTextConnected}>Connected</Text>
              <Text style={styles.addressText}>{status.address}</Text>
            </>
          ) : (
            <Text style={styles.statusTextDisconnected}>Not Connected</Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : (
          <>
            {!status?.connected ? (
              <TouchableOpacity style={styles.button} onPress={connectWithMetaMask}>
                <Ionicons name="log-in-outline" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Connect with MetaMask</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.buttonSecondary} onPress={testAction}>
                  <Ionicons name="flash-outline" size={24} color="#3B82F6" />
                  <Text style={styles.buttonTextSecondary}>Test Action</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDanger} onPress={disconnect}>
                  <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
      },
      header: {
        backgroundColor: '#F6851B',
        padding: 20,
        paddingTop: 40,
        alignItems: 'center',
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 8,
        marginBottom: 4,
      },
      subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
      },
      content: {
        flex: 1,
        padding: 20,
      },
      statusBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
      },
      statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
      },
      statusTextConnected: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 4,
      },
      statusTextDisconnected: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#EF4444',
      },
      addressText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'monospace',
      },
      button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 16,
      },
      buttonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 16,
      },
      buttonDanger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 20,
      },
      buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
      },
      buttonTextSecondary: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3B82F6',
        marginLeft: 8,
      },
});

export default ProperMobileMetaMask;
