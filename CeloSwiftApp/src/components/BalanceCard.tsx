import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BalanceCardProps {
  balance: string;
  currency: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, currency }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Balance</Text>
        <TouchableOpacity style={styles.eyeButton}>
          <Ionicons name="eye-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balance}>{balance}</Text>
        <Text style={styles.currency}>{currency}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>cUSD</Text>
          <Text style={styles.balanceValue}>1,250.50</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>USDT</Text>
          <Text style={styles.balanceValue}>0.00</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginRight: 8,
  },
  currency: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default BalanceCard;
