import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WorkingMetaMaskTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [result, setResult] = useState<string>('');

  const connectMetaMask = async () => {
    try {
      setResult('Connecting to MetaMask...');
      
      // Check if MetaMask is installed
      const canOpen = await Linking.canOpenURL('metamask://');
      
      if (!canOpen) {
        setResult('❌ MetaMask not installed');
        Alert.alert(
          'MetaMask Not Found',
          'Please install MetaMask mobile app first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Install', 
              onPress: () => {
                const storeUrl = Platform.OS === 'ios' 
                  ? 'https://apps.apple.com/app/metamask/id1438144202'
                  : 'https://play.google.com/store/apps/details?id=io.metamask';
                Linking.openURL(storeUrl);
              }
            }
          ]
        );
        return;
      }

      // Open MetaMask app
      await Linking.openURL('metamask://');
      setResult('✅ MetaMask app opened');
      
      // Show success message
      Alert.alert(
        'MetaMask Opened',
        'MetaMask app is now open. You can now connect your wallet manually.',
        [
          { 
            text: 'I Connected', 
            onPress: () => {
              setIsConnected(true);
              setResult('✅ Connected to MetaMask!');
            }
          },
          { text: 'Cancel', onPress: () => setResult('❌ Connection cancelled') }
        ]
      );
      
    } catch (error) {
      setResult(`❌ Error: ${error}`);
      Alert.alert('Error', `Failed to open MetaMask: ${error}`);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setResult('Disconnected from MetaMask');
  };

  const testTransaction = () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect MetaMask first');
      return;
    }
    
    Alert.alert(
      'Transaction Test',
      'This would send a transaction using MetaMask.\n\nIn a real implementation, this would:\n1. Open MetaMask\n2. Show transaction details\n3. Ask for confirmation\n4. Send the transaction',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={32} color="#FFFFFF" />
        <Text style={styles.title}>Working MetaMask Test</Text>
        <Text style={styles.subtitle}>Simple and working MetaMask integration</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status:</Text>
          <Text style={[styles.statusText, { color: isConnected ? '#10B981' : '#EF4444' }]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        {!isConnected ? (
          <TouchableOpacity
            style={styles.button}
            onPress={connectMetaMask}
          >
            <Ionicons name="wallet" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Connect MetaMask</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={testTransaction}
            >
              <Ionicons name="arrow-up" size={24} color="#3B82F6" />
              <Text style={styles.buttonTextSecondary}>Test Transaction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonDanger}
              onPress={disconnect}
            >
              <Ionicons name="log-out" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result || 'No action taken yet'}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <Text style={styles.instructionText}>
            1. Click "Connect MetaMask" to open MetaMask app{'\n'}
            2. MetaMask app will open on your device{'\n'}
            3. You can manually connect your wallet in MetaMask{'\n'}
            4. Return to this app and confirm connection{'\n'}
            5. Test transactions and other features
          </Text>
        </View>
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
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
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
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  instructions: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
});

export default WorkingMetaMaskTest;
