import React from 'react';
import { View, StyleSheet } from 'react-native';
import SimpleMobileTest from '../components/SimpleMobileTest';

const TestMetaMaskScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <SimpleMobileTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestMetaMaskScreen;
