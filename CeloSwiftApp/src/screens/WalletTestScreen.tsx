import React from 'react';
import { View, StyleSheet } from 'react-native';
import WalletTestPanel from '../components/WalletTestPanel';
import EnhancedMobileWallet from '../components/EnhancedMobileWallet';
import ThirdwebWalletConnect from '../components/ThirdwebWalletConnect';

const WalletTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ThirdwebWalletConnect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WalletTestScreen;
