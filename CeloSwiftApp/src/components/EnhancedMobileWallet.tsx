import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EnhancedWalletService from '../services/EnhancedWalletService';

const EnhancedMobileWallet: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initializeService();
    checkConnectionStatus();
    
    // Listen for deep link events
    const handleDeepLink = (url: string) => {
      addLog(`Deep link received: ${url}`);
    };

    if (Platform.OS !== 'web') {
      Linking.addEventListener('url', handleDeepLink);
    }

    return () => {
      if (Platform.OS !== 'web') {
        Linking.removeEventListener('url', handleDeepLink);
      }
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-9), logMessage]);
    console.log(logMessage);
  };

  const initializeService = async () => {
    try {
      addLog('🚀 Initializing Enhanced Wallet Service...');
      const success = await EnhancedWalletService.initialize();
      if (success) {
        addLog('✅ Enhanced Wallet Service initialized');
      } else {
        addLog('❌ Failed to initialize Enhanced Wallet Service');
      }
    } catch (error) {
      addLog(`❌ Initialization error: ${error}`);
    }
  };

  const checkConnectionStatus = () => {
    const status = EnhancedWalletService.getConnectionStatus();
    setConnectionInfo(status);
    setIsConnected(status.connected);
    addLog(`📊 Connection status: ${status.connected ? 'Connected' : 'Not connected'}`);
  };

  const connectWallet = async () => {
    setIsLoading(true);
    addLog('🔄 Starting enhanced wallet connection...');
    
    try {
      const success = await EnhancedWalletService.connect();
      
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
      await EnhancedWalletService.disconnect();
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
      await EnhancedWalletService.updateBalance();
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

  const openMetaMaskStore = () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/metamask/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask';
    
    Linking.openURL(storeUrl);
    addLog('📱 Opening MetaMask store...');
  };

  return (
    <ScrollView style={styles.container}>
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
            <Text style={styles.title}>Enhanced Mobile Wallet</Text>
            <Text style={styles.subtitle}>Seamless MetaMask Integration</Text>
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
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Enhanced Connection Flow</Text>
                <Text style={styles.infoDescription}>
                  This improved connection will:
                  {'\n'}• Open MetaMask app directly
                  {'\n'}• Handle automatic return to app
                  {'\n'}• Provide fallback options
                  {'\n'}• Better error handling
                </Text>
              </View>
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

            <TouchableOpacity
              style={styles.storeButton}
              onPress={openMetaMaskStore}
            >
              <Ionicons name="storefront" size={20} color="#35D07F" />
              <Text style={styles.storeButtonText}>Install MetaMask</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectedState}>
            <View style={styles.connectionCard}>
              <Text style={styles.cardTitle}>Connection Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{formatAddress(connectionInfo?.address)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network:</Text>
                <Text style={styles.detailValue}>{connectionInfo?.networkName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Wallet Type:</Text>
                <Text style={styles.detailValue}>{connectionInfo?.walletType}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Balance:</Text>
                <Text style={styles.detailValue}>{connectionInfo?.balance} CELO</Text>
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

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>How It Works</Text>
          <Text style={styles.helpText}>
            <Text style={styles.helpBold}>1. Enhanced Connection:</Text> Opens MetaMask app directly with deep linking
            {'\n\n'}<Text style={styles.helpBold}>2. Automatic Return:</Text> Handles return to app after connection
            {'\n\n'}<Text style={styles.helpBold}>3. Fallback Options:</Text> Manual address entry if needed
            {'\n\n'}<Text style={styles.helpBold}>4. Better UX:</Text> Clear instructions and error handling
          </Text>
        </View>
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
    padding: 20,
  },
  disconnectedState: {
    alignItems: 'center',
    marginBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#35D07F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
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
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#35D07F',
  },
  storeButtonText: {
    color: '#35D07F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedState: {
    marginBottom: 30,
  },
  connectionCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
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
    marginBottom: 20,
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
    minHeight: 150,
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
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default EnhancedMobileWallet;
