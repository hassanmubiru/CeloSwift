import React from 'react';
import { View, StyleSheet } from 'react-native';
import DirectMetaMaskTest from '../components/DirectMetaMaskTest';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <DirectMetaMaskTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
