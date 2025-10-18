import React from 'react';
import { View, StyleSheet } from 'react-native';
import RealMetaMaskTest from '../components/RealMetaMaskTest';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <RealMetaMaskTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
