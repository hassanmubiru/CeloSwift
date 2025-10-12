import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WalletDetectionService, { WalletInfo } from '../services/WalletDetectionService';
import WalletConnectV2Service from '../services/WalletConnectV2Service';

interface WalletConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  visible,
  onClose,
  onConnect,
}) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

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
    console.log('WalletConnectModal: handleWalletPress called with wallet:', wallet.id);
    
    if (wallet.installed) {
      setConnecting(wallet.id);
      
      try {
        let success = false;
        
        if (wallet.id === 'metamask') {
          console.log('WalletConnectModal: Attempting MetaMask connection...');
          success = await WalletConnectV2Service.connectMetaMask();
          console.log('WalletConnectModal: MetaMask connection result:', success);
        } else if (wallet.id === 'coinbase') {
          // For now, show instructions for Coinbase Wallet
          Alert.alert(
            'Coinbase Wallet Connection',
            'Coinbase Wallet connection via WalletConnect v2 is coming soon. For now, please use MetaMask or the web version.',
            [{ text: 'OK' }]
          );
          success = false;
        } else if (wallet.id === 'trust') {
          // For now, show instructions for Trust Wallet
          Alert.alert(
            'Trust Wallet Connection',
            'Trust Wallet connection via WalletConnect v2 is coming soon. For now, please use MetaMask or the web version.',
            [{ text: 'OK' }]
          );
          success = false;
        } else {
          // For other wallets, show instructions
          Alert.alert(
            'Wallet Connection',
            `${wallet.name} connection via WalletConnect v2 is coming soon. For now, please use MetaMask or the web version.`,
            [{ text: 'OK' }]
          );
          success = false;
        }
        
        if (success) {
          console.log('WalletConnectModal: Wallet connected successfully, calling onConnect');
          onConnect(wallet.id);
          onClose();
        } else {
          console.log('WalletConnectModal: Wallet connection failed or cancelled');
        }
      } catch (error) {
        console.error('WalletConnectModal: Wallet connection failed:', error);
        Alert.alert('Connection Error', `Failed to connect to ${wallet.name}`);
      } finally {
        setConnecting(null);
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

  const getConnectionStatus = (walletId: string) => {
    if (connecting === walletId) {
      return 'Connecting...';
    }
    return 'Connect';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose a wallet to connect to CeloSwift
          </Text>

          {Platform.OS !== 'web' && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Mobile wallet connections are in development. For now, please use the web version or MetaMask browser extension.
              </Text>
            </View>
          )}

          <View style={styles.walletList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Checking installed wallets...</Text>
              </View>
            ) : (
              wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletItem,
                    connecting === wallet.id && styles.walletItemConnecting
                  ]}
                  onPress={() => handleWalletPress(wallet)}
                  disabled={connecting === wallet.id}
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
                  <View style={styles.walletAction}>
                    {connecting === wallet.id ? (
                      <View style={styles.connectingIndicator}>
                        <Ionicons name="hourglass" size={20} color="#007AFF" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
            </Text>
            {Platform.OS !== 'web' && (
              <Text style={styles.footerSubtext}>
                Mobile WalletConnect integration coming soon
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 20,
  },
  walletList: {
    // Styles for the list of wallets
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  walletItemConnecting: {
    opacity: 0.7,
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
  walletAction: {
    marginLeft: 12,
  },
  connectingIndicator: {
    // Styles for connecting indicator
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
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#C7C7CC',
    textAlign: 'center',
  },
});

export default WalletConnectModal;
