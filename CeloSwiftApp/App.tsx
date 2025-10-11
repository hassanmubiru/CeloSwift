import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, View, Text } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#35D07F" />
      <View style={styles.content}>
        <Text style={styles.title}>CeloSwift</Text>
        <Text style={styles.subtitle}>Mobile Remittance App</Text>
        <Text style={styles.status}>App is running successfully! 🎉</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#35D07F',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    color: '#35D07F',
    textAlign: 'center',
  },
});