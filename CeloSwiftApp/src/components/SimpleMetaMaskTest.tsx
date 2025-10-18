import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SimpleMetaMaskTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[MetaMask Test] ${message}`);
  };

  useEffect(() => {
    addLog('Component mounted');
    checkEnvironment();
  }, []);

  const checkEnvironment = () => {
    addLog('=== Environment Check ===');
    addLog(`Platform: ${Platform.OS}`);
    addLog(`Has window: ${typeof window !== 'undefined'}`);
    
    if (typeof window !== 'undefined') {
      addLog(`Has ethereum: ${!!(window as any).ethereum}`);
      
      if ((window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        addLog(`Is MetaMask: ${ethereum.isMetaMask}`);
        addLog(`Version: ${ethereum.version || 'unknown'}`);
        addLog(`Is connected: ${ethereum.isConnected?.() || 'unknown'}`);
        addLog(`User agent: ${navigator.userAgent.substring(0, 50)}...`);
      }
    }
  };

  const testBasicConnection = async () => {
    addLog('=== Testing Basic Connection ===');
    
    if (typeof window === 'undefined') {
      addLog('❌ Not in browser environment');
      Alert.alert('Error', 'Not in browser environment');
      return;
    }

    if (!(window as any).ethereum) {
      addLog('❌ MetaMask not found');
      Alert.alert(
        'MetaMask Not Found',
        'Please install MetaMask browser extension.\n\nVisit: https://metamask.io/download/'
      );
      return;
    }

    addLog('✅ MetaMask detected');
    
    try {
      setIsConnecting(true);
      addLog('🔄 Requesting account access...');
      
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        addLog(`✅ Connected successfully: ${accounts[0]}`);
        Alert.alert('Success!', `Connected to: ${accounts[0]}`);
      } else {
        addLog('❌ No accounts returned');
        Alert.alert('Error', 'No accounts returned from MetaMask');
      }
    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`);
      addLog(`❌ Error code: ${error.code}`);
      
      let errorMessage = 'Connection failed';
      if (error.code === 4001) {
        errorMessage = 'User rejected the connection request';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (error.code === 4902) {
        errorMessage = 'MetaMask is not connected to any network';
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const testAccountCheck = async () => {
    addLog('=== Testing Account Check ===');
    
    if (!(window as any).ethereum) {
      addLog('❌ No ethereum provider');
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        addLog(`✅ Already connected: ${accounts[0]}`);
        Alert.alert('Already Connected', `Account: ${accounts[0]}`);
      } else {
        addLog('ℹ️ No accounts connected');
        Alert.alert('Not Connected', 'No accounts currently connected');
      }
    } catch (error: any) {
      addLog(`❌ Account check failed: ${error.message}`);
    }
  };

  const testNetworkSwitch = async () => {
    addLog('=== Testing Network Switch ===');
    
    if (!(window as any).ethereum) {
      addLog('❌ No ethereum provider');
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      const targetChainId = '0xaef3'; // Celo Alfajores
      
      // Get current chain
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      addLog(`Current chain: ${currentChainId}`);
      addLog(`Target chain: ${targetChainId}`);

      if (currentChainId === targetChainId) {
        addLog('✅ Already on correct network');
        Alert.alert('Network OK', 'Already on Celo Alfajores network');
        return;
      }

      // Try to switch
      addLog('🔄 Switching to Celo network...');
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      
      addLog('✅ Network switch successful');
      Alert.alert('Success', 'Switched to Celo Alfajores network');
    } catch (error: any) {
      addLog(`❌ Network switch failed: ${error.message}`);
      
      if (error.code === 4902) {
        addLog('🔄 Network not found, trying to add...');
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaef3',
                chainName: 'Celo Alfajores Testnet',
                rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
                nativeCurrency: {
                  name: 'CELO',
                  symbol: 'CELO',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://alfajores.celoscan.io'],
              },
            ],
          });
          addLog('✅ Network added successfully');
          Alert.alert('Success', 'Celo network added to MetaMask');
        } catch (addError: any) {
          addLog(`❌ Failed to add network: ${addError.message}`);
          Alert.alert('Error', 'Failed to add Celo network');
        }
      } else {
        Alert.alert('Network Error', error.message);
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MetaMask Connection Test</Text>
        <Text style={styles.subtitle}>Simple test to debug connection issues</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Tests</Text>
        
        <TouchableOpacity
          style={[styles.button, isConnecting && styles.buttonDisabled]}
          onPress={testBasicConnection}
          disabled={isConnecting}
        >
          <Ionicons name="link" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>
            {isConnecting ? 'Connecting...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={testAccountCheck}
        >
          <Ionicons name="person" size={20} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>Check Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={testNetworkSwitch}
        >
          <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>Test Network Switch</Text>
        </TouchableOpacity>
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
            <Text style={styles.noLogsText}>No logs yet. Run a test to see debug information.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Troubleshooting Tips</Text>
        
        <View style={styles.tipContainer}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Make sure MetaMask is installed and unlocked
          </Text>
        </View>
        
        <View style={styles.tipContainer}>
          <Ionicons name="shield" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Disable popup blockers for this site
          </Text>
        </View>
        
        <View style={styles.tipContainer}>
          <Ionicons name="refresh" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Try refreshing the page if connection fails
          </Text>
        </View>
        
        <View style={styles.tipContainer}>
          <Ionicons name="globe" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Ensure you're on HTTPS (not HTTP)
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
    backgroundColor: '#F6851B',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    maxHeight: 300,
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
});

export default SimpleMetaMaskTest;
