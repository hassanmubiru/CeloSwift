import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'react-native-crypto-js';
import './src/utils/polyfills';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import UniversalWalletService from './src/services/UniversalWalletService';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WalletTestScreen from './src/screens/WalletTestScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  // Initialize SimpleWalletService when app starts
  useEffect(() => {
    const initializeWalletService = async () => {
      try {
        await UniversalWalletService.initialize();
        console.log('App: UniversalWalletService initialized successfully');
      } catch (error) {
        console.error('App: Failed to initialize UniversalWalletService:', error);
      }
    };

    initializeWalletService();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#35D07F" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Send') {
                iconName = focused ? 'send' : 'send-outline';
              } else if (route.name === 'Receive') {
                iconName = focused ? 'download' : 'download-outline';
              } else if (route.name === 'History') {
                iconName = focused ? 'time' : 'time-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Test') {
                iconName = focused ? 'bug' : 'bug-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#35D07F',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E5E5EA',
              borderTopWidth: 1,
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            headerStyle: {
              backgroundColor: '#35D07F',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'CeloSwift' }}
          />
          <Tab.Screen 
            name="Send" 
            component={SendScreen}
            options={{ title: 'Send Money' }}
          />
          <Tab.Screen 
            name="Receive" 
            component={ReceiveScreen}
            options={{ title: 'Receive Money' }}
          />
          <Tab.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ title: 'Transaction History' }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Tab.Screen 
            name="Test" 
            component={WalletTestScreen}
            options={{ title: 'Wallet Test' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});
