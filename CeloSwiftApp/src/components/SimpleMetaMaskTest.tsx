import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImprovedMobileMetaMaskService from '../services/ImprovedMobileMetaMaskService';

const SimpleMetaMaskTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initialize the service
    initializeService();
    
    // Check current connection status
    checkConnectionStatus();
  }, []);

  const initializeService = async () => {
    try {
      addLog('Initializing MetaMask service...');
      const success = await ImprovedMobileMetaMaskService.initialize();
      if (success) {
        addLog('✅ MetaMask service initialized successfully');
      } else {
        addLog('❌ Failed to initialize MetaMask service');
      }
    } catch (error) {
      addLog(`❌ Initialization error: ${error}`);
    }
  };

  const checkConnectionStatus = () => {
    const status = ImprovedMobileMetaMaskService.getConnectionStatus();
    setConnectionInfo(status);
    setIsConnected(status.connected);
    addLog(`Connection status: ${status.connected ? 'Connected' : 'Not connected'}`);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const connectMetaMask = async () => {
    setIsLoading(true);
    addLog('🔄 Starting MetaMask connection...');
    
    try {
      const success = await SimpleWalletService.connect();
      
      if (success) {
        addLog('✅ MetaMask connected successfully!');
        checkConnectionStatus();
      } else {
        addLog('❌ MetaMask connection failed or cancelled');
      }
    } catch (error: any) {
      addLog(`❌ Connection error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectMetaMask = async () => {
    setIsLoading(true);
    addLog('🔄 Disconnecting from MetaMask...');
    
    try {
      await SimpleWalletService.disconnect();
      addLog('✅ Disconnected from MetaMask');
      checkConnectionStatus();
    } catch (error: any) {
      addLog(`❌ Disconnect error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalance = async () => {
    setIsLoading(true);
    addLog('🔄 Updating balance...');
    
    try {
      await SimpleWalletService.updateBalance();
      checkConnectionStatus();
      addLog('✅ Balance updated successfully');
    } catch (error: any) {
      addLog(`❌ Balance update error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('📝 Logs cleared');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={32} color="#35D07F" />
        <Text style={styles.title}>MetaMask Test</Text>
        <Text style={styles.subtitle}>Simple connection test</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isConnected ? '#35D07F' : '#FF6B6B' }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Text>
        </View>

        {isConnected && connectionInfo && (
          <View style={styles.connectionInfo}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{formatAddress(connectionInfo.address)}</Text>
            
            <Text style={styles.infoLabel}>Network:</Text>
            <Text style={styles.infoValue}>{connectionInfo.networkName}</Text>
            
            <Text style={styles.infoLabel}>Wallet Type:</Text>
            <Text style={styles.infoValue}>{connectionInfo.walletType}</Text>
            
            <Text style={styles.infoLabel}>Balance:</Text>
            <Text style={styles.infoValue}>{connectionInfo.balance} CELO</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!isConnected ? (
          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={connectMetaMask}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="log-in" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>Connect MetaMask</Text>
        </TouchableOpacity>
        ) : (
          <View style={styles.connectedActions}>
        <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={updateBalance}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
              )}
              <Text style={styles.buttonText}>Update Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={disconnectMetaMask}
              disabled={isLoading}
        >
              <Ionicons name="log-out" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.logsSection}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>Connection Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Ionicons name="trash" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.logsContainer} nestedScrollEnabled>
          {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>
          • For web: Install MetaMask browser extension{'\n'}
          • For mobile: Enter your MetaMask wallet address{'\n'}
          • Make sure MetaMask is unlocked{'\n'}
          • This test connects to Celo Alfajores testnet
          </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  connectionInfo: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    margin: 16,
  },
  connectButton: {
    backgroundColor: '#35D07F',
  },
  updateButton: {
    backgroundColor: '#007AFF',
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  connectedActions: {
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 4,
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    fontSize: 12,
    color: '#1C1C1E',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});

export default SimpleMetaMaskTest;