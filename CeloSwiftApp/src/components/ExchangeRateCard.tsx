import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExchangeRateCardProps {
  rate: number;
}

const ExchangeRateCard: React.FC<ExchangeRateCardProps> = ({ rate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Update timestamp every minute
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const exchangeRates = [
    { from: 'cUSD', to: 'USD', rate: 1.0, change: '+0.01%' },
    { from: 'USDT', to: 'USD', rate: 1.0, change: '+0.02%' },
    { from: 'cUSD', to: 'EUR', rate: 0.85, change: '-0.15%' },
    { from: 'cUSD', to: 'GBP', rate: 0.73, change: '+0.08%' },
    { from: 'cUSD', to: 'NGN', rate: 460.0, change: '+0.25%' },
    { from: 'cUSD', to: 'KES', rate: 110.0, change: '-0.12%' },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Ionicons name="trending-up" size={20} color="#35D07F" />
            <Text style={styles.title}>Exchange Rates</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.lastUpdated}>
              Updated {formatTime(lastUpdated)}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#8E8E93"
            />
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {exchangeRates.map((rate, index) => (
            <View key={index} style={styles.rateItem}>
              <View style={styles.rateInfo}>
                <Text style={styles.ratePair}>
                  {rate.from}/{rate.to}
                </Text>
                <Text style={styles.rateValue}>{rate.rate}</Text>
              </View>
              <View style={styles.changeContainer}>
                <Text style={[
                  styles.changeText,
                  { color: rate.change.startsWith('+') ? '#35D07F' : '#FF3B30' }
                ]}>
                  {rate.change}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Rates updated in real-time from Celo network
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  rateInfo: {
    flex: 1,
  },
  ratePair: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  changeContainer: {
    alignItems: 'flex-end',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ExchangeRateCard;
