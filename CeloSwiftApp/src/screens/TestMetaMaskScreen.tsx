import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProperMobileMetaMask from '../components/ProperMobileMetaMask';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ProperMobileMetaMask />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
