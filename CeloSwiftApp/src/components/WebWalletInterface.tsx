import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WalletService from '../services/WalletService';

const WebWalletInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initializeService();
      checkConnectionStatus();
    }
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
    console.log(logMessage);
  };

  const initializeService = async () => {
    try {
      addLog('Initializing wallet service...');
      const success = await WalletService.initialize();
      if (success) {
        addLog('✅ Wallet service initialized');
      } else {
        addLog('❌ Failed to initialize wallet service');
      }
    } catch (error) {
      addLog(`❌ Initialization error: ${error}`);
    }
  };

  const checkConnectionStatus = () => {
    const status = WalletService.getConnectionStatus();
    setConnectionInfo(status);
    setIsConnected(status.connected);
    addLog(`Connection status: ${status.connected ? 'Connected' : 'Not connected'}`);
  };

  const connectWallet = async () => {
    setIsLoading(true);
    addLog('🔄 Starting wallet connection...');
    
    try {
      const success = await WalletService.connect();
      
      if (success) {
        addLog('✅ Wallet connected successfully!');
        checkConnectionStatus();
      } else {
        addLog('❌ Wallet connection failed or cancelled');
      }
    } catch (error: any) {
      addLog(`❌ Connection error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    addLog('🔄 Disconnecting wallet...');
    
    try {
      await WalletService.disconnect();
      addLog('✅ Disconnected successfully');
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
      await WalletService.updateBalance();
      checkConnectionStatus();
      addLog('✅ Balance updated');
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

  const screenWidth = Dimensions.get('window').width;
  const isWideScreen = screenWidth > 768;

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.notSupportedText}>
          Web Wallet Interface is only available on web browsers.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isWideScreen && styles.wideContainer]}>
      <LinearGradient
        colors={['#35D07F', '#2BC4A3']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Web Wallet Interface</Text>
            <Text style={styles.subtitle}>MetaMask Integration</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons 
              name={isConnected ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isConnected ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {!isConnected ? (
          <View style={styles.disconnectedState}>
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={24} color="#FFA726" />
              <Text style={styles.warningText}>
                Connect your MetaMask wallet to access all features. Make sure MetaMask extension is installed and unlocked.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="log-in" size={24} color="#FFFFFF" />
              )}
              <Text style={styles.buttonText}>
                {isLoading ? 'Connecting...' : 'Connect MetaMask'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectedState}>
            <View style={styles.connectionInfo}>
              <Text style={styles.infoTitle}>Connection Details</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{formatAddress(connectionInfo?.address)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Network:</Text>
                <Text style={styles.infoValue}>{connectionInfo?.networkName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Wallet Type:</Text>
                <Text style={styles.infoValue}>{connectionInfo?.walletType}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Balance:</Text>
                <Text style={styles.infoValue}>{connectionInfo?.balance} CELO</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={updateBalance}
                disabled={isLoading}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Update Balance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.disconnectButton]}
                onPress={disconnectWallet}
                disabled={isLoading}
              >
                <Ionicons name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <Text style={styles.logsTitle}>Connection Logs</Text>
            <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
              <Ionicons name="trash" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.logsContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.noLogsText}>No logs yet...</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  wideContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  disconnectedState: {
    alignItems: 'center',
    marginBottom: 30,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: '#E65100',
    fontSize: 14,
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#35D07F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  connectedState: {
    marginBottom: 30,
  },
  connectionInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#35D07F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  logsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
  },
  logText: {
    fontSize: 12,
    color: '#1C1C1E',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  noLogsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notSupportedText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default WebWalletInterface;
