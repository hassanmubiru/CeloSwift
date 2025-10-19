import React from 'react';
import { View, StyleSheet } from 'react-native';
import WalletTestPanel from '../components/WalletTestPanel';

const WalletTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <WalletTestPanel />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WalletTestScreen;
