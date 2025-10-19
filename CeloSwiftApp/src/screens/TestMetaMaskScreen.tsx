import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleMetaMaskTest from '../components/SimpleMetaMaskTest';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <SimpleMetaMaskTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
