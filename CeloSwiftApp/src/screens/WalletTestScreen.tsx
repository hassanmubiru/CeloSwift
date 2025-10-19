import React from 'react';
import { View, StyleSheet } from 'react-native';
import WalletTestPanel from '../components/WalletTestPanel';
import EnhancedMobileWallet from '../components/EnhancedMobileWallet';
import UniversalWalletConnect from '../components/UniversalWalletConnect';

const WalletTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <UniversalWalletConnect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WalletTestScreen;
