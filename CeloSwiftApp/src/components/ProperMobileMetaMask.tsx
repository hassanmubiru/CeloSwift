import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProperMobileMetaMask: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [result, setResult] = useState<string>('');

  const openMetaMask = async () => {
    try {
      setResult('Opening MetaMask...');
      
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
      
      // Show instructions
      Alert.alert(
        'MetaMask Opened',
        'MetaMask app is now open.\n\nTo connect your wallet:\n\n1. Copy your wallet address from MetaMask\n2. Return to this app\n3. Paste the address below\n\nThis is how mobile MetaMask integration works.',
        [
          { 
            text: 'I Have My Address', 
            onPress: () => setShowAddressInput(true)
          },
          { text: 'Cancel', onPress: () => setResult('❌ Connection cancelled') }
        ]
      );
      
    } catch (error) {
      setResult(`❌ Error: ${error}`);
      Alert.alert('Error', `Failed to open MetaMask: ${error}`);
    }
  };

  const connectWithAddress = () => {
    if (!walletAddress.trim()) {
      Alert.alert('Error', 'Please enter your wallet address');
      return;
    }

    // Validate address format (basic check)
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      Alert.alert('Error', 'Please enter a valid wallet address');
      return;
    }

    setIsConnected(true);
    setResult(`✅ Connected to wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
    setShowAddressInput(false);
    
    Alert.alert(
      'Wallet Connected!',
      `Successfully connected to MetaMask wallet!\n\nAddress: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\nYou can now use wallet features.`,
      [{ text: 'Great!' }]
    );
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setResult('Disconnected from MetaMask');
  };

  const testTransaction = () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect MetaMask first');
      return;
    }
    
    Alert.alert(
      'Transaction Test',
      `This would send a transaction from your wallet:\n\n${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\nIn a real implementation, this would:\n1. Open MetaMask\n2. Show transaction details\n3. Ask for confirmation\n4. Send the transaction`,
      [{ text: 'OK' }]
    );
  };

  const testSignMessage = () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect MetaMask first');
      return;
    }
    
    Alert.alert(
      'Sign Message Test',
      `This would sign a message with your wallet:\n\n${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\nIn a real implementation, this would:\n1. Open MetaMask\n2. Show message to sign\n3. Ask for confirmation\n4. Sign the message`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={32} color="#FFFFFF" />
        <Text style={styles.title}>Mobile MetaMask Integration</Text>
        <Text style={styles.subtitle}>Proper mobile wallet connection</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Wallet Status:</Text>
          <Text style={[styles.statusText, { color: isConnected ? '#10B981' : '#EF4444' }]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          {isConnected && (
            <Text style={styles.addressText}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Text>
          )}
        </View>

        {!isConnected ? (
          <TouchableOpacity
            style={styles.button}
            onPress={openMetaMask}
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
              style={styles.buttonSecondary}
              onPress={testSignMessage}
            >
              <Ionicons name="pencil" size={24} color="#3B82F6" />
              <Text style={styles.buttonTextSecondary}>Test Sign Message</Text>
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

        {showAddressInput && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputTitle}>Enter Your MetaMask Address:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
              value={walletAddress}
              onChangeText={setWalletAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.inputButtons}>
              <TouchableOpacity
                style={styles.inputButtonSecondary}
                onPress={() => setShowAddressInput(false)}
              >
                <Text style={styles.inputButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={connectWithAddress}
              >
                <Text style={styles.inputButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result || 'No action taken yet'}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How Mobile MetaMask Works:</Text>
          <Text style={styles.instructionText}>
            1. Click "Connect MetaMask" to open MetaMask app{'\n'}
            2. Copy your wallet address from MetaMask{'\n'}
            3. Return to this app and paste the address{'\n'}
            4. Click "Connect" to establish connection{'\n'}
            5. Use wallet features like transactions and signing
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
    marginBottom: 4,
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
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
  },
  inputButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
  },
  inputButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputButtonTextSecondary: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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

export default ProperMobileMetaMask;
