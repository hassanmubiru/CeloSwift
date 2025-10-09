import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCelo } from '@celo/react-celo';
import QRCodeScanner from '../components/QRCodeScanner';

const SendScreen: React.FC = () => {
  const { address } = useCelo();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedToken, setSelectedToken] = useState('cUSD');
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tokens = [
    { symbol: 'cUSD', name: 'Celo USD', balance: '1,250.50' },
    { symbol: 'USDT', name: 'Tether USD', balance: '0.00' },
  ];

  const handleSend = async () => {
    if (!amount || !recipient) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        `Successfully sent ${amount} ${selectedToken} to ${recipient}`,
        [{ text: 'OK', onPress: () => {
          setAmount('');
          setRecipient('');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = (data: string) => {
    // Parse QR code data (could be phone number, address, or payment request)
    setRecipient(data);
    setIsScannerVisible(false);
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  if (!address) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <Ionicons name="wallet-outline" size={64} color="#C7C7CC" />
          <Text style={styles.notConnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.notConnectedText}>
            Please connect your wallet to send money
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Token Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Token</Text>
          <View style={styles.tokenList}>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token.symbol}
                style={[
                  styles.tokenItem,
                  selectedToken === token.symbol && styles.selectedTokenItem
                ]}
                onPress={() => setSelectedToken(token.symbol)}
              >
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                  <Text style={styles.tokenName}>{token.name}</Text>
                </View>
                <View style={styles.tokenBalance}>
                  <Text style={styles.balanceText}>{token.balance}</Text>
                  {selectedToken === token.symbol && (
                    <Ionicons name="checkmark-circle" size={20} color="#35D07F" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(text) => setAmount(formatAmount(text))}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.currencyLabel}>{selectedToken}</Text>
          </View>
          <Text style={styles.balanceText}>
            Balance: {tokens.find(t => t.symbol === selectedToken)?.balance} {selectedToken}
          </Text>
        </View>

        {/* Recipient Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send To</Text>
          <View style={styles.recipientContainer}>
            <TextInput
              style={styles.recipientInput}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Phone number or wallet address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setIsScannerVisible(true)}
            >
              <Ionicons name="qr-code" size={24} color="#35D07F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Summary */}
        {amount && recipient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>{amount} {selectedToken}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Recipient</Text>
                <Text style={styles.summaryValue}>{recipient}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network Fee</Text>
                <Text style={styles.summaryValue}>~0.001 CELO</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{amount} {selectedToken}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!amount || !recipient || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!amount || !recipient || isLoading}
        >
          {isLoading ? (
            <Text style={styles.sendButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Money</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={isScannerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setIsScannerVisible(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notConnectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  notConnectedText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  tokenList: {
    gap: 12,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F2F2F7',
  },
  selectedTokenItem: {
    borderColor: '#35D07F',
    backgroundColor: '#E8F5E8',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  tokenName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tokenBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    paddingVertical: 8,
  },
  currencyLabel: {
    fontSize: 18,
    color: '#8E8E93',
    marginLeft: 8,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginRight: 12,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#35D07F',
  },
  sendButton: {
    backgroundColor: '#35D07F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 16,
    shadowColor: '#35D07F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SendScreen;
