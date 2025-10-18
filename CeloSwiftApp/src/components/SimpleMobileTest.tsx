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

const SimpleMobileTest: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const testMetaMaskInstallation = async () => {
    try {
      setResult('Checking MetaMask installation...');
      
      // Check if MetaMask app is installed
      const canOpen = await Linking.canOpenURL('metamask://');
      
      if (canOpen) {
        setResult('✅ MetaMask app is installed!');
        Alert.alert('MetaMask Found', 'MetaMask mobile app is installed on your device.');
      } else {
        setResult('❌ MetaMask app not found');
        Alert.alert(
          'MetaMask Not Found',
          'MetaMask mobile app is not installed.\n\nPlease install it from:\n• iOS: App Store\n• Android: Play Store',
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
      }
    } catch (error) {
      setResult(`❌ Error checking MetaMask: ${error}`);
    }
  };

  const openMetaMaskApp = async () => {
    try {
      setResult('Opening MetaMask app...');
      
      const canOpen = await Linking.canOpenURL('metamask://');
      
      if (canOpen) {
        await Linking.openURL('metamask://');
        setResult('✅ MetaMask app opened!');
        Alert.alert(
          'MetaMask Opened',
          'MetaMask app should now be open. Copy your wallet address and come back to this app.',
          [{ text: 'OK' }]
        );
      } else {
        setResult('❌ Cannot open MetaMask app');
        Alert.alert('Error', 'Cannot open MetaMask app. Please install it first.');
      }
    } catch (error) {
      setResult(`❌ Error opening MetaMask: ${error}`);
    }
  };

  const simulateConnection = () => {
    setResult('🔄 Simulating MetaMask connection...');
    
    // Simulate a connection process
    setTimeout(() => {
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      setResult(`✅ Connected successfully!\n\nAddress: ${mockAddress}\nNetwork: Celo Alfajores\nBalance: 1.5 CELO`);
      
      Alert.alert(
        'Connection Successful!',
        `Mock connection established!\n\nAddress: ${mockAddress}\n\nThis simulates a real MetaMask connection.`,
        [{ text: 'Great!' }]
      );
    }, 2000);
  };

  const testDeepLinking = () => {
    setResult('Testing deep linking...');
    
    Alert.alert(
      'Deep Link Test',
      'This will test if your app can open MetaMask app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test', 
          onPress: () => {
            Linking.openURL('metamask://')
              .then(() => {
                setResult('✅ Deep link successful!');
              })
              .catch((error) => {
                setResult(`❌ Deep link failed: ${error.message}`);
              });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="phone-portrait" size={32} color="#FFFFFF" />
        <Text style={styles.title}>Mobile MetaMask Test</Text>
        <Text style={styles.subtitle}>Simple mobile connection test</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.button}
          onPress={testMetaMaskInstallation}
        >
          <Ionicons name="search" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Check MetaMask Installation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={openMetaMaskApp}
        >
          <Ionicons name="open" size={24} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>Open MetaMask App</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={testDeepLinking}
        >
          <Ionicons name="link" size={24} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>Test Deep Linking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSuccess}
          onPress={simulateConnection}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Simulate Connection</Text>
        </TouchableOpacity>

        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result || 'No test run yet'}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Install MetaMask mobile app{'\n'}
            2. Click "Check MetaMask Installation"{'\n'}
            3. Click "Open MetaMask App" to test deep linking{'\n'}
            4. Click "Simulate Connection" to test the flow{'\n'}
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
    marginBottom: 16,
  },
  buttonSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
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

export default SimpleMobileTest;
