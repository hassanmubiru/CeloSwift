import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WalletInstructionsProps {
  walletType: string;
  onClose: () => void;
}

const WalletInstructions: React.FC<WalletInstructionsProps> = ({
  walletType,
  onClose,
}) => {
  const getInstructions = () => {
    switch (walletType) {
      case 'metamask':
        return {
          title: 'Connect MetaMask',
          steps: [
            'Install MetaMask browser extension',
            'Create or import a wallet',
            'Switch to Celo Alfajores network',
            'Return to this app and connect',
          ],
          link: 'https://metamask.io/download/',
          linkText: 'Download MetaMask',
        };
      case 'coinbase':
        return {
          title: 'Connect Coinbase Wallet',
          steps: [
            'Install Coinbase Wallet extension',
            'Create or import a wallet',
            'Switch to Celo Alfajores network',
            'Return to this app and connect',
          ],
          link: 'https://www.coinbase.com/wallet',
          linkText: 'Download Coinbase Wallet',
        };
      case 'trust':
        return {
          title: 'Connect Trust Wallet',
          steps: [
            'Download Trust Wallet app',
            'Create or import a wallet',
            'Go to Settings > WalletConnect',
            'Scan QR code when displayed',
          ],
          link: 'https://trustwallet.com/',
          linkText: 'Download Trust Wallet',
        };
      case 'walletconnect':
        return {
          title: 'Connect via WalletConnect',
          steps: [
            'WalletConnect integration coming soon',
            'This will support 100+ wallets',
            'Stay tuned for updates',
            'For now, use browser wallets',
          ],
          link: null,
          linkText: null,
        };
      default:
        return {
          title: 'Connect Wallet',
          steps: ['Choose your preferred wallet', 'Follow the setup instructions'],
          link: null,
          linkText: null,
        };
    }
  };

  const instructions = getInstructions();

  const handleOpenLink = () => {
    if (instructions.link) {
      Linking.openURL(instructions.link);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{instructions.title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.stepsContainer}>
        {instructions.steps.map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {instructions.link && (
        <TouchableOpacity style={styles.linkButton} onPress={handleOpenLink}>
          <Ionicons name="open-outline" size={20} color="#35D07F" />
          <Text style={styles.linkButtonText}>{instructions.linkText}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Make sure your wallet is connected to the Celo Alfajores testnet.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    margin: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 5,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#35D07F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#35D07F',
    marginBottom: 20,
  },
  linkButtonText: {
    color: '#35D07F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default WalletInstructions;
