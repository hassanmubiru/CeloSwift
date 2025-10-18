import React from 'react';
import { View, StyleSheet } from 'react-native';
import WorkingMetaMaskTest from '../components/WorkingMetaMaskTest';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <WorkingMetaMaskTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
