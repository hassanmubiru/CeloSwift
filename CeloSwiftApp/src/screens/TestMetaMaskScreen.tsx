import React from 'react';
import { View, StyleSheet } from 'react-native';
import MobileMetaMaskTest from '../components/MobileMetaMaskTest';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <MobileMetaMaskTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
