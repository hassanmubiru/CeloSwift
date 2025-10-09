import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCelo } from '@celo/react-celo';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  currency: string;
  recipient: string;
  sender: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  hash: string;
  fee: string;
  exchangeRate?: number;
}

const HistoryScreen: React.FC = () => {
  const { address } = useCelo();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sent' | 'received'>('all');

  // Mock data for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'sent',
      amount: '150.00',
      currency: 'cUSD',
      recipient: '+1234567890',
      sender: address || '',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed',
      hash: '0x1234567890abcdef...',
      fee: '0.001',
      exchangeRate: 1.0,
    },
    {
      id: '2',
      type: 'received',
      amount: '75.50',
      currency: 'cUSD',
      recipient: address || '',
      sender: '+0987654321',
      timestamp: '2024-01-14T15:45:00Z',
      status: 'completed',
      hash: '0xabcdef1234567890...',
      fee: '0.001',
      exchangeRate: 1.0,
    },
    {
      id: '3',
      type: 'sent',
      amount: '200.00',
      currency: 'USDT',
      recipient: '+1122334455',
      sender: address || '',
      timestamp: '2024-01-13T09:15:00Z',
      status: 'completed',
      hash: '0x9876543210fedcba...',
      fee: '0.001',
      exchangeRate: 1.0,
    },
    {
      id: '4',
      type: 'received',
      amount: '50.00',
      currency: 'cUSD',
      recipient: address || '',
      sender: '+5566778899',
      timestamp: '2024-01-12T14:20:00Z',
      status: 'pending',
      hash: '0xfedcba0987654321...',
      fee: '0.001',
      exchangeRate: 1.0,
    },
    {
      id: '5',
      type: 'sent',
      amount: '100.00',
      currency: 'cUSD',
      recipient: '+9988776655',
      sender: address || '',
      timestamp: '2024-01-11T16:30:00Z',
      status: 'failed',
      hash: '0x13579bdf2468ace0...',
      fee: '0.001',
      exchangeRate: 1.0,
    },
  ];

  useEffect(() => {
    loadTransactions();
  }, [address]);

  const loadTransactions = async () => {
    // In a real app, this would fetch from your backend/contracts
    setTransactions(mockTransactions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    return transaction.type === selectedFilter;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#35D07F';
      case 'pending':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert(
      'Transaction Details',
      `Type: ${transaction.type}\nAmount: ${transaction.amount} ${transaction.currency}\nStatus: ${transaction.status}\nHash: ${transaction.hash}`,
      [
        { text: 'View on Explorer', onPress: () => {} },
        { text: 'Copy Hash', onPress: () => {} },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={styles.transactionIcon}>
        <Ionicons
          name={item.type === 'sent' ? 'arrow-up' : 'arrow-down'}
          size={24}
          color={item.type === 'sent' ? '#FF3B30' : '#35D07F'}
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {item.type === 'sent' ? 'Sent to' : 'Received from'}
        </Text>
        <Text style={styles.transactionRecipient}>
          {item.type === 'sent' ? item.recipient : item.sender}
        </Text>
        <Text style={styles.transactionTime}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'sent' ? '#FF3B30' : '#35D07F' }
        ]}>
          {item.type === 'sent' ? '-' : '+'}{item.amount}
        </Text>
        <Text style={styles.currencyText}>{item.currency}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(item.status)}20` }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === 'all' 
          ? 'Your transaction history will appear here'
          : `No ${selectedFilter} transactions found`
        }
      </Text>
    </View>
  );

  if (!address) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <Ionicons name="wallet-outline" size={64} color="#C7C7CC" />
          <Text style={styles.notConnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.notConnectedText}>
            Please connect your wallet to view transaction history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'all' && styles.activeFilterButtonText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'sent' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('sent')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'sent' && styles.activeFilterButtonText
          ]}>
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'received' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('received')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'received' && styles.activeFilterButtonText
          ]}>
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notConnectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  notConnectedText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#35D07F',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  transactionRecipient: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  currencyText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HistoryScreen;
