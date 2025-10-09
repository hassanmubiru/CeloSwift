import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCelo } from '@celo/react-celo';

const ProfileScreen: React.FC = () => {
  const { address, disconnect, network } = useCelo();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnect }
      ]
    );
  };

  const handleKycVerification = () => {
    Alert.alert(
      'KYC Verification',
      'Complete your identity verification to unlock higher transaction limits and enhanced security.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Verification', onPress: () => {} }
      ]
    );
  };

  const handleExportWallet = () => {
    Alert.alert(
      'Export Wallet',
      'This will show your wallet\'s private key. Keep it secure and never share it with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Private Key', style: 'destructive', onPress: () => {} }
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'Contact our support team for help with your account or transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => {} }
      ]
    );
  };

  const getKycStatusColor = () => {
    switch (kycStatus) {
      case 'verified':
        return '#35D07F';
      case 'pending':
        return '#FF9500';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getKycStatusText = () => {
    switch (kycStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Started';
    }
  };

  if (!address) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <Ionicons name="person-outline" size={64} color="#C7C7CC" />
          <Text style={styles.notConnectedTitle}>Profile Not Available</Text>
          <Text style={styles.notConnectedText}>
            Please connect your wallet to view your profile
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#35D07F" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>CeloSwift User</Text>
            <Text style={styles.profileAddress}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
            <View style={styles.networkBadge}>
              <View style={[styles.networkDot, { backgroundColor: '#35D07F' }]} />
              <Text style={styles.networkText}>
                {network?.name || 'Alfajores Testnet'}
              </Text>
            </View>
          </View>
        </View>

        {/* KYC Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Identity Verification</Text>
            <View style={[styles.kycBadge, { backgroundColor: `${getKycStatusColor()}20` }]}>
              <Text style={[styles.kycStatusText, { color: getKycStatusColor() }]}>
                {getKycStatusText()}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Complete KYC verification to unlock higher transaction limits and enhanced security features.
          </Text>
          <TouchableOpacity style={styles.kycButton} onPress={handleKycVerification}>
            <Ionicons name="shield-checkmark" size={20} color="#35D07F" />
            <Text style={styles.kycButtonText}>
              {kycStatus === 'pending' ? 'Complete Verification' : 'Start Verification'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#35D07F" />
              <View style={styles.settingDetails}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get notified about transactions and security alerts
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E5EA', true: '#35D07F' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="finger-print" size={24} color="#35D07F" />
              <View style={styles.settingDetails}>
                <Text style={styles.settingTitle}>Biometric Authentication</Text>
                <Text style={styles.settingDescription}>
                  Use fingerprint or face ID to secure your wallet
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E5E5EA', true: '#35D07F' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Wallet Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Management</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleExportWallet}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="download" size={24} color="#35D07F" />
              <Text style={styles.menuItemText}>Export Wallet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="key" size={24} color="#35D07F" />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="refresh" size={24} color="#35D07F" />
              <Text style={styles.menuItemText}>Backup Wallet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language" size={24} color="#35D07F" />
              <Text style={styles.menuItemText}>Language</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>English</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon" size={24} color="#35D07F" />
              <Text style={styles.menuItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: '#E5E5EA', true: '#35D07F' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle" size={24} color="#35D07F" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Network</Text>
            <Text style={styles.aboutValue}>
              {network?.name || 'Alfajores Testnet'}
            </Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2024.01.15</Text>
          </View>
        </View>

        {/* Disconnect Button */}
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
        </TouchableOpacity>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileAddress: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  kycBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kycButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#35D07F',
  },
  kycButtonText: {
    color: '#35D07F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingDetails: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  aboutValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginTop: 16,
  },
  disconnectButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;
