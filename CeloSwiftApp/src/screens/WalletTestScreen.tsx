import React from 'react';
import { View, StyleSheet } from 'react-native';
import WalletTestPanel from '../components/WalletTestPanel';
import EnhancedMobileWallet from '../components/EnhancedMobileWallet';
import UniversalWalletConnect from '../components/UniversalWalletConnect';
import ThirdwebCeloConnect from '../components/ThirdwebCeloConnect';

const WalletTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ThirdwebCeloConnect />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WalletTestScreen;
