import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  network?: string;
  address?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  network,
  address,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: theme.colors.status.success,
          icon: 'checkmark-circle' as const,
          text: 'Connected',
        };
      case 'connecting':
        return {
          color: theme.colors.status.warning,
          icon: 'time' as const,
          text: 'Connecting...',
        };
      case 'error':
        return {
          color: theme.colors.status.error,
          icon: 'alert-circle' as const,
          text: 'Connection Error',
        };
      default:
        return {
          color: theme.colors.text.tertiary,
          icon: 'ellipse' as const,
          text: 'Disconnected',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
      
      {network && (
        <View style={styles.infoRow}>
          <Ionicons name="globe" size={14} color={theme.colors.text.tertiary} />
          <Text style={styles.infoText}>{network}</Text>
        </View>
      )}
      
      {address && (
        <View style={styles.infoRow}>
          <Ionicons name="wallet" size={14} color={theme.colors.text.tertiary} />
          <Text style={styles.infoText}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
});

export default StatusIndicator;
