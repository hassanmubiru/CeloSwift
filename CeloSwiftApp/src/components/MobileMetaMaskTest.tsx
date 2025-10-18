import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ethers } from 'ethers';
import MobileMetaMaskService from '../services/MobileMetaMaskService';

const MobileMetaMaskTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const metaMaskService = MobileMetaMaskService;

  useEffect(() => {
    initializeService();
    checkConnectionStatus();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[Mobile MetaMask] ${message}`);
  };

  const initializeService = async () => {
    try {
      addLog('Initializing mobile MetaMask service...');
      await metaMaskService.initialize();
      addLog('✅ Service initialized successfully');
    } catch (error) {
      addLog(`❌ Initialization failed: ${error}`);
    }
  };

  const checkConnectionStatus = () => {
    const status = metaMaskService.getConnectionStatus();
    setIsConnected(status.connected);
    setConnectionInfo(status);
    
    if (status.connected) {
      addLog(`✅ Already connected: ${status.address}`);
    } else {
      addLog('ℹ️ Not connected');
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      addLog('🔄 Starting MetaMask connection...');
      
      const connected = await metaMaskService.connect();
      
      if (connected) {
        const status = metaMaskService.getConnectionStatus();
        setIsConnected(true);
        setConnectionInfo(status);
        addLog(`✅ Connected successfully: ${status.address}`);
        addLog(`Network: ${status.networkName}`);
        addLog(`Balance: ${status.balance} CELO`);
      } else {
        addLog('❌ Connection failed or cancelled');
      }
    } catch (error) {
      addLog(`❌ Connection error: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      addLog('🔄 Disconnecting...');
      await metaMaskService.disconnect();
      setIsConnected(false);
      setConnectionInfo(null);
      addLog('✅ Disconnected successfully');
    } catch (error) {
      addLog(`❌ Disconnect error: ${error}`);
    }
  };

  const handleSendTransaction = async () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      addLog('🔄 Testing transaction...');
      
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Example address
        value: ethers.parseEther('0.001'), // Small amount for testing
      };

      const txHash = await metaMaskService.sendTransaction(transaction);
      addLog(`✅ Transaction sent: ${txHash}`);
      Alert.alert('Success', `Transaction sent: ${txHash}`);
    } catch (error) {
      addLog(`❌ Transaction failed: ${error}`);
      Alert.alert('Error', `Transaction failed: ${error}`);
    }
  };

  const handleSignMessage = async () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      addLog('🔄 Testing message signing...');
      
      const message = 'Hello from CeloSwift mobile app!';
      const signature = await metaMaskService.signMessage(message);
      
      addLog(`✅ Message signed: ${signature.slice(0, 20)}...`);
      Alert.alert('Success', `Message signed successfully!\n\nSignature: ${signature.slice(0, 20)}...`);
    } catch (error) {
      addLog(`❌ Signing failed: ${error}`);
      Alert.alert('Error', `Signing failed: ${error}`);
    }
  };

  const handleGetBalance = async () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      addLog('🔄 Getting balance...');
      
      const balance = await metaMaskService.getBalance();
      addLog(`✅ Balance: ${balance} CELO`);
      Alert.alert('Balance', `Your balance: ${balance} CELO`);
    } catch (error) {
      addLog(`❌ Get balance failed: ${error}`);
      Alert.alert('Error', `Failed to get balance: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#F6851B', '#FF8C00']}
        style={styles.header}
      >
        <Ionicons name="phone-portrait" size={32} color="#FFFFFF" />
        <Text style={styles.title}>Mobile MetaMask Test</Text>
        <Text style={styles.subtitle}>Test MetaMask connection on mobile</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isConnected ? 'checkmark-circle' : 'close-circle'} 
              size={20} 
              color={isConnected ? '#10B981' : '#EF4444'} 
            />
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { color: isConnected ? '#10B981' : '#EF4444' }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          {connectionInfo && (
            <>
              <View style={styles.statusRow}>
                <Ionicons name="person" size={20} color="#6B7280" />
                <Text style={styles.statusLabel}>Address:</Text>
                <Text style={styles.statusValue}>
                  {metaMaskService.formatAddress(connectionInfo.address)}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Ionicons name="globe" size={20} color="#6B7280" />
                <Text style={styles.statusLabel}>Network:</Text>
                <Text style={styles.statusValue}>{connectionInfo.networkName}</Text>
              </View>
              
              {connectionInfo.balance && (
                <View style={styles.statusRow}>
                  <Ionicons name="wallet" size={20} color="#6B7280" />
                  <Text style={styles.statusLabel}>Balance:</Text>
                  <Text style={styles.statusValue}>{connectionInfo.balance} CELO</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {!isConnected ? (
          <TouchableOpacity
            style={[styles.button, isConnecting && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            <Ionicons name="link" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleSendTransaction}
            >
              <Ionicons name="arrow-up" size={20} color="#3B82F6" />
              <Text style={styles.buttonTextSecondary}>Test Transaction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleSignMessage}
            >
              <Ionicons name="pencil" size={20} color="#3B82F6" />
              <Text style={styles.buttonTextSecondary}>Test Sign Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleGetBalance}
            >
              <Ionicons name="wallet" size={20} color="#3B82F6" />
              <Text style={styles.buttonTextSecondary}>Get Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonDanger}
              onPress={handleDisconnect}
            >
              <Ionicons name="log-out" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Ionicons name="trash" size={16} color="#6B7280" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>No logs yet. Try connecting to see debug information.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mobile MetaMask Instructions</Text>
        
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            📱 <Text style={styles.instructionBold}>For Mobile MetaMask:</Text>
          </Text>
          <Text style={styles.instructionText}>
            1. Install MetaMask mobile app from App Store/Play Store
          </Text>
          <Text style={styles.instructionText}>
            2. Create or import your wallet in MetaMask app
          </Text>
          <Text style={styles.instructionText}>
            3. Make sure MetaMask is unlocked
          </Text>
          <Text style={styles.instructionText}>
            4. Click "Connect MetaMask" above
          </Text>
          <Text style={styles.instructionText}>
            5. Follow the connection flow
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
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
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buttonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  logContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noLogsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  instructionContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionText: {
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
    marginBottom: 4,
  },
  instructionBold: {
    fontWeight: '600',
  },
});

export default MobileMetaMaskTest;
