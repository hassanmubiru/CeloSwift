import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WalletConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  visible,
  onClose,
  onConnect,
}) => {
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: 'logo-bitcoin',
      color: '#F6851B',
      action: 'extension',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect using any WalletConnect compatible wallet',
      icon: 'link',
      color: '#3B99FC',
      action: 'walletconnect',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      icon: 'wallet',
      color: '#0052FF',
      action: 'extension',
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Connect using Trust Wallet',
      icon: 'shield-checkmark',
      color: '#3375BB',
      action: 'mobile',
    },
  ];

  const handleWalletPress = (wallet: any) => {
    onConnect(wallet.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose a wallet to connect to CeloSwift
          </Text>

          <View style={styles.walletList}>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={styles.walletItem}
                onPress={() => handleWalletPress(wallet)}
              >
                <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
                  <Ionicons name={wallet.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletDescription}>{wallet.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  walletList: {
    marginBottom: 20,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  walletDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WalletConnectionModal;
