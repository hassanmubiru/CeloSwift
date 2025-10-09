import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionsProps {
  onSendPress?: () => void;
  onReceivePress?: () => void;
  onScanPress?: () => void;
  onHistoryPress?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onSendPress,
  onReceivePress,
  onScanPress,
  onHistoryPress,
}) => {
  const actions = [
    {
      id: 'send',
      title: 'Send',
      icon: 'send',
      color: '#35D07F',
      onPress: onSendPress,
    },
    {
      id: 'receive',
      title: 'Receive',
      icon: 'download',
      color: '#007AFF',
      onPress: onReceivePress,
    },
    {
      id: 'scan',
      title: 'Scan QR',
      icon: 'qr-code',
      color: '#FF9500',
      onPress: onScanPress,
    },
    {
      id: 'history',
      title: 'History',
      icon: 'time',
      color: '#AF52DE',
      onPress: onHistoryPress,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={action.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default QuickActions;
