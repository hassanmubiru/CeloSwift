import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DebugInfo {
  platform: string;
  hasWindow: boolean;
  hasEthereum: boolean;
  isMetaMask: boolean;
  ethereumVersion?: string;
  userAgent?: string;
  isSecureContext: boolean;
  hasUserGesture: boolean;
  connectionAttempts: number;
  lastError?: string;
}

const MetaMaskDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    platform: Platform.OS,
    hasWindow: false,
    hasEthereum: false,
    isMetaMask: false,
    isSecureContext: false,
    hasUserGesture: false,
    connectionAttempts: 0,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const checkEnvironment = () => {
    const info: DebugInfo = {
      platform: Platform.OS,
      hasWindow: typeof window !== 'undefined',
      hasEthereum: false,
      isMetaMask: false,
      isSecureContext: false,
      hasUserGesture: false,
      connectionAttempts: 0,
    };

    if (typeof window !== 'undefined') {
      info.hasEthereum = !!(window as any).ethereum;
      info.isMetaMask = !!(window as any).ethereum?.isMetaMask;
      info.ethereumVersion = (window as any).ethereum?.version;
      info.userAgent = navigator.userAgent;
      info.isSecureContext = window.isSecureContext;
    }

    setDebugInfo(info);
    addLog('Environment check completed');
  };

  const testMetaMaskDetection = () => {
    addLog('Testing MetaMask detection...');
    
    if (typeof window === 'undefined') {
      addLog('❌ Not in browser environment');
      return;
    }

    if (!(window as any).ethereum) {
      addLog('❌ window.ethereum not found');
      Alert.alert(
        'MetaMask Not Found',
        'MetaMask extension is not installed or not detected.\n\nPlease install MetaMask from https://metamask.io/download/'
      );
      return;
    }

    const ethereum = (window as any).ethereum;
    addLog(`✅ window.ethereum found: ${typeof ethereum}`);
    addLog(`✅ isMetaMask: ${ethereum.isMetaMask}`);
    addLog(`✅ version: ${ethereum.version || 'unknown'}`);
    addLog(`✅ isConnected: ${ethereum.isConnected?.() || 'unknown'}`);
  };

  const testAccountRequest = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      addLog('❌ Cannot test - no ethereum provider');
      return;
    }

    setIsConnecting(true);
    addLog('🔄 Testing eth_requestAccounts...');

    try {
      const ethereum = (window as any).ethereum;
      
      // Check if already connected
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        addLog(`✅ Already connected: ${accounts[0]}`);
        return;
      }

      // Request new connection
      const newAccounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (newAccounts && newAccounts.length > 0) {
        addLog(`✅ Connection successful: ${newAccounts[0]}`);
        Alert.alert('Success', `Connected to account: ${newAccounts[0]}`);
      } else {
        addLog('❌ No accounts returned');
      }
    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`);
      addLog(`❌ Error code: ${error.code}`);
      addLog(`❌ Error data: ${JSON.stringify(error.data || {})}`);
      
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

  const testNetworkSwitch = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      addLog('❌ Cannot test - no ethereum provider');
      return;
    }

    addLog('🔄 Testing network switch to Celo Alfajores...');

    try {
      const ethereum = (window as any).ethereum;
      const targetChainId = '0xaef3'; // 44787 in hex
      
      // Get current chain
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      addLog(`Current chain: ${currentChainId}`);
      addLog(`Target chain: ${targetChainId}`);

      if (currentChainId === targetChainId) {
        addLog('✅ Already on correct network');
        return;
      }

      // Try to switch
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      
      addLog('✅ Network switch successful');
    } catch (error: any) {
      addLog(`❌ Network switch failed: ${error.message}`);
      
      if (error.code === 4902) {
        addLog('🔄 Network not found, attempting to add...');
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
        } catch (addError: any) {
          addLog(`❌ Failed to add network: ${addError.message}`);
        }
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  const getStatusColor = (status: boolean) => status ? '#10B981' : '#EF4444';
  const getStatusIcon = (status: boolean) => status ? 'checkmark-circle' : 'close-circle';

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#F6851B', '#FF8C00']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>MetaMask Debugger</Text>
        <Text style={styles.headerSubtitle}>
          Diagnose connection issues
        </Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Check</Text>
        
        <View style={styles.infoRow}>
          <Ionicons 
            name={getStatusIcon(debugInfo.hasWindow)} 
            size={20} 
            color={getStatusColor(debugInfo.hasWindow)} 
          />
          <Text style={styles.infoLabel}>Window Object:</Text>
          <Text style={styles.infoValue}>{debugInfo.hasWindow ? 'Available' : 'Not Available'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons 
            name={getStatusIcon(debugInfo.hasEthereum)} 
            size={20} 
            color={getStatusColor(debugInfo.hasEthereum)} 
          />
          <Text style={styles.infoLabel}>Ethereum Provider:</Text>
          <Text style={styles.infoValue}>{debugInfo.hasEthereum ? 'Found' : 'Not Found'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons 
            name={getStatusIcon(debugInfo.isMetaMask)} 
            size={20} 
            color={getStatusColor(debugInfo.isMetaMask)} 
          />
          <Text style={styles.infoLabel}>MetaMask Detection:</Text>
          <Text style={styles.infoValue}>{debugInfo.isMetaMask ? 'Confirmed' : 'Not MetaMask'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons 
            name={getStatusIcon(debugInfo.isSecureContext)} 
            size={20} 
            color={getStatusColor(debugInfo.isSecureContext)} 
          />
          <Text style={styles.infoLabel}>Secure Context:</Text>
          <Text style={styles.infoValue}>{debugInfo.isSecureContext ? 'Yes' : 'No'}</Text>
        </View>

        {debugInfo.ethereumVersion && (
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoLabel}>Ethereum Version:</Text>
            <Text style={styles.infoValue}>{debugInfo.ethereumVersion}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>
        
        <TouchableOpacity
          style={[styles.testButton, isConnecting && styles.testButtonDisabled]}
          onPress={testMetaMaskDetection}
          disabled={isConnecting}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test MetaMask Detection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, isConnecting && styles.testButtonDisabled]}
          onPress={testAccountRequest}
          disabled={isConnecting}
        >
          <Ionicons name="link" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>
            {isConnecting ? 'Testing...' : 'Test Account Request'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, isConnecting && styles.testButtonDisabled]}
          onPress={testNetworkSwitch}
          disabled={isConnecting}
        >
          <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test Network Switch</Text>
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
            <Text style={styles.noLogsText}>No logs yet. Run some tests to see debug information.</Text>
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
            Check if popup blockers are disabled
          </Text>
        </View>
        
        <View style={styles.tipContainer}>
          <Ionicons name="refresh" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Try refreshing the page and connecting again
          </Text>
        </View>
        
        <View style={styles.tipContainer}>
          <Ionicons name="settings" size={20} color="#F59E0B" />
          <Text style={styles.tipText}>
            Ensure you're on a secure (HTTPS) connection
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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

export default MetaMaskDebugger;
