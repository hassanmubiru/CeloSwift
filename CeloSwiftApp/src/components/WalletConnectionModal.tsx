import React, { useState, useEffect } from 'react';
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
import WalletDetectionService, { WalletInfo } from '../services/WalletDetectionService';
import SimpleWalletService from '../services/SimpleWalletService';

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
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadWalletInfo();
    }
  }, [visible]);

  const loadWalletInfo = async () => {
    setLoading(true);
    try {
      const walletInfo = await WalletDetectionService.getWalletInfo();
      setWallets(walletInfo);
    } catch (error) {
      console.error('Error loading wallet info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPress = async (wallet: WalletInfo) => {
    console.log('WalletConnectionModal: handleWalletPress called with wallet:', wallet.id);
    if (wallet.installed) {
      // Wallet is installed, try to connect using mobile service
      if (wallet.id === 'metamask') {
        console.log('WalletConnectionModal: Attempting MetaMask connection...');
        try {
          const success = await SimpleWalletService.connect();
          console.log('WalletConnectionModal: MetaMask connection result:', success);
          if (success) {
            console.log('WalletConnectionModal: MetaMask connected successfully, calling onConnect');
            onConnect(wallet.id);
            onClose();
          } else {
            console.log('WalletConnectionModal: MetaMask connection failed or cancelled');
          }
        } catch (error) {
          console.error('WalletConnectionModal: MetaMask connection failed:', error);
        }
      } else {
        // For other wallets, show instructions
        Alert.alert(
          `${wallet.name} Support`,
          `${wallet.name} wallet connection is not yet implemented. Please use MetaMask for now.`,
          [{ text: 'OK' }]
        );
      }
    } else {
      // Wallet not installed, show download option
      Alert.alert(
        `Install ${wallet.name}`,
        wallet.description,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Install', 
            onPress: () => {
              if (wallet.downloadUrl) {
                Linking.openURL(wallet.downloadUrl);
              }
            }
          }
        ]
      );
    }
  };

  const getWalletIcon = (walletId: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      metamask: 'logo-bitcoin',
      coinbase: 'wallet',
      walletconnect: 'link',
      trust: 'shield-checkmark',
    };
    return icons[walletId] || 'wallet';
  };

  const getWalletColor = (walletId: string) => {
    const colors: { [key: string]: string } = {
      metamask: '#F6851B',
      coinbase: '#0052FF',
      walletconnect: '#3B99FC',
      trust: '#3375BB',
    };
    return colors[walletId] || '#35D07F';
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Checking installed wallets...</Text>
              </View>
            ) : (
              wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={styles.walletItem}
                  onPress={() => handleWalletPress(wallet)}
                >
                  <View style={[styles.walletIcon, { backgroundColor: getWalletColor(wallet.id) }]}>
                    <Ionicons name={getWalletIcon(wallet.id)} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.walletInfo}>
                    <View style={styles.walletNameRow}>
                      <Text style={styles.walletName}>{wallet.name}</Text>
                      {wallet.installed && (
                        <View style={styles.installedBadge}>
                          <Text style={styles.installedText}>Installed</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.walletDescription}>{wallet.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              ))
            )}
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
  walletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  installedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  installedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  walletDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
