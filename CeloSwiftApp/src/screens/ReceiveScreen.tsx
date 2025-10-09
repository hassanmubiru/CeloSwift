import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCelo } from '@celo/react-celo';
import QRCode from 'react-native-qrcode-svg';

const ReceiveScreen: React.FC = () => {
  const { address } = useCelo();
  const [selectedToken, setSelectedToken] = useState('cUSD');
  const [amount, setAmount] = useState('');

  const tokens = [
    { symbol: 'cUSD', name: 'Celo USD', balance: '1,250.50' },
    { symbol: 'USDT', name: 'Tether USD', balance: '0.00' },
  ];

  const generatePaymentRequest = () => {
    const paymentData = {
      type: 'payment_request',
      recipient: address,
      token: selectedToken,
      amount: amount || undefined,
      timestamp: Date.now(),
    };
    return JSON.stringify(paymentData);
  };

  const handleShare = async () => {
    try {
      const paymentRequest = generatePaymentRequest();
      await Share.share({
        message: `Send me money via CeloSwift!\n\nPayment Request: ${paymentRequest}\n\nOr scan the QR code in the app.`,
        title: 'CeloSwift Payment Request',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment request');
    }
  };

  const handleCopyAddress = () => {
    // In a real app, you would copy to clipboard
    Alert.alert('Address Copied', address);
  };

  const handleCopyPaymentRequest = () => {
    const paymentRequest = generatePaymentRequest();
    Alert.alert('Payment Request Copied', paymentRequest);
  };

  if (!address) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <Ionicons name="wallet-outline" size={64} color="#C7C7CC" />
          <Text style={styles.notConnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.notConnectedText}>
            Please connect your wallet to receive money
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

        {/* Amount Input (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Amount (Optional)</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencyLabel}>{selectedToken}</Text>
            <Text style={styles.amountPlaceholder}>
              Leave empty to receive any amount
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment QR Code</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={generatePaymentRequest()}
                size={200}
                color="#1C1C1E"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrInstructions}>
              Share this QR code or your wallet address to receive payments
            </Text>
          </View>
        </View>

        {/* Wallet Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Address</Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{address}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
              <Ionicons name="copy-outline" size={20} color="#35D07F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Request</Text>
          <View style={styles.paymentRequestContainer}>
            <Text style={styles.paymentRequestText} numberOfLines={3}>
              {generatePaymentRequest()}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton} 
              onPress={handleCopyPaymentRequest}
            >
              <Ionicons name="copy-outline" size={20} color="#35D07F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Payment Request</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Receive Money</Text>
          <View style={styles.instructionList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Share your QR code or wallet address with the sender
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                The sender scans your QR code or enters your address
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                You'll receive the payment instantly in your wallet
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    paddingVertical: 20,
  },
  currencyLabel: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
  },
  amountPlaceholder: {
    fontSize: 14,
    color: '#C7C7CC',
    fontStyle: 'italic',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
    marginLeft: 12,
  },
  paymentRequestContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  paymentRequestText: {
    flex: 1,
    fontSize: 12,
    color: '#1C1C1E',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#35D07F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#35D07F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  instructionList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#35D07F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
});

export default ReceiveScreen;
