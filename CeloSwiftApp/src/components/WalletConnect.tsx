import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCelo } from '@celo/react-celo';

interface WalletConnectProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
}) => {
  const { address, connect, disconnect, network } = useCelo();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      setIsModalVisible(false);
      onConnect?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onDisconnect?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect wallet');
    }
  };

  const copyAddress = () => {
    // In a real app, you would copy to clipboard
    Alert.alert('Address Copied', address);
  };

  if (address) {
    return (
      <View style={styles.connectedContainer}>
        <View style={styles.walletInfo}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet" size={20} color="#35D07F" />
          </View>
          <View style={styles.walletDetails}>
            <Text style={styles.walletLabel}>Connected Wallet</Text>
            <Text style={styles.walletAddress}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyAddress}>
            <Ionicons name="copy-outline" size={16} color="#35D07F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDisconnect}>
            <Ionicons name="log-out-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
        <Text style={styles.connectButtonText}>Connect Wallet</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Wallet</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletOptions}>
              <TouchableOpacity
                style={styles.walletOption}
                onPress={handleConnect}
              >
                <View style={styles.walletOptionIcon}>
                  <Ionicons name="phone-portrait" size={24} color="#35D07F" />
                </View>
                <View style={styles.walletOptionContent}>
                  <Text style={styles.walletOptionTitle}>Valora</Text>
                  <Text style={styles.walletOptionDescription}>
                    Connect with Valora mobile wallet
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletOption}
                onPress={handleConnect}
              >
                <View style={styles.walletOptionIcon}>
                  <Ionicons name="globe" size={24} color="#35D07F" />
                </View>
                <View style={styles.walletOptionContent}>
                  <Text style={styles.walletOptionTitle}>WalletConnect</Text>
                  <Text style={styles.walletOptionDescription}>
                    Connect with any WalletConnect compatible wallet
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletOption}
                onPress={handleConnect}
              >
                <View style={styles.walletOptionIcon}>
                  <Ionicons name="hardware-chip" size={24} color="#35D07F" />
                </View>
                <View style={styles.walletOptionContent}>
                  <Text style={styles.walletOptionTitle}>Ledger</Text>
                  <Text style={styles.walletOptionDescription}>
                    Connect with Ledger hardware wallet
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>

            <View style={styles.networkInfo}>
              <Text style={styles.networkLabel}>Network:</Text>
              <Text style={styles.networkName}>
                {network?.name || 'Alfajores Testnet'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  connectButton: {
    backgroundColor: '#35D07F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletDetails: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  walletAddress: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  walletOptions: {
    paddingHorizontal: 20,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  walletOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletOptionContent: {
    flex: 1,
  },
  walletOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  walletOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  networkLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#35D07F',
  },
});

export default WalletConnect;
