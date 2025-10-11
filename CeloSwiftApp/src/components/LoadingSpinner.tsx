import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { theme } from '../styles/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = theme.colors.primary,
  text,
  overlay = false,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 60;
      default: return 40;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return theme.typography.fontSize.sm;
      case 'large': return theme.typography.fontSize.lg;
      default: return theme.typography.fontSize.base;
    }
  };

  const spinnerSize = getSize();
  const textSize = getTextSize();

  const SpinnerContent = () => (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderColor: color,
            borderTopColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {text && (
        <Text style={[styles.text, { fontSize: textSize, color }]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <SpinnerContent />
        </View>
      </View>
    );
  }

  return <SpinnerContent />;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderWidth: 3,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
  },
  text: {
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
  },
});

export default LoadingSpinner;
