import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DirectMetaMaskTest: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const testDirectConnection = async () => {
    setResult('Testing...');
    
    try {
      // Check if we're in a browser
      if (typeof window === 'undefined') {
        setResult('❌ Not in browser environment');
        return;
      }

      // Check for MetaMask
      if (!(window as any).ethereum) {
        setResult('❌ MetaMask not found. Please install MetaMask extension.');
        Alert.alert(
          'MetaMask Not Found',
          'Please install MetaMask browser extension.\n\nVisit: https://metamask.io/download/'
        );
        return;
      }

      setResult('✅ MetaMask found, requesting connection...');
      
      const ethereum = (window as any).ethereum;
      
      // This is the critical line - this should trigger the popup
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setResult(`✅ SUCCESS! Connected to: ${accounts[0]}`);
        Alert.alert('Success!', `Connected to: ${accounts[0]}`);
      } else {
        setResult('❌ No accounts returned');
      }
      
    } catch (error: any) {
      console.error('Direct test error:', error);
      
      let errorMessage = `❌ Connection failed: ${error.message}`;
      
      if (error.code === 4001) {
        errorMessage = '❌ User rejected the connection request';
      } else if (error.code === -32002) {
        errorMessage = '❌ Connection request already pending';
      } else if (error.code === 4902) {
        errorMessage = '❌ MetaMask is not connected to any network';
      }
      
      setResult(errorMessage);
      Alert.alert('Connection Error', errorMessage);
    }
  };

  const checkEnvironment = () => {
    let envInfo = `Platform: ${Platform.OS}\n`;
    envInfo += `Has window: ${typeof window !== 'undefined'}\n`;
    
    if (typeof window !== 'undefined') {
      envInfo += `Has ethereum: ${!!(window as any).ethereum}\n`;
      
      if ((window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        envInfo += `Is MetaMask: ${ethereum.isMetaMask}\n`;
        envInfo += `Version: ${ethereum.version || 'unknown'}\n`;
      }
    }
    
    setResult(envInfo);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bug" size={32} color="#FFFFFF" />
        <Text style={styles.title}>Direct MetaMask Test</Text>
        <Text style={styles.subtitle}>Simple test to check if MetaMask popup works</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={testDirectConnection}
        >
          <Ionicons name="link" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Test MetaMask Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={checkEnvironment}
        >
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>Check Environment</Text>
        </TouchableOpacity>

        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result || 'No test run yet'}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Make sure MetaMask is installed and unlocked{'\n'}
            2. Click "Test MetaMask Connection"{'\n'}
            3. A MetaMask popup should appear{'\n'}
            4. Click "Connect" in the popup{'\n'}
            5. Check the result above
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
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});

export default DirectMetaMaskTest;
