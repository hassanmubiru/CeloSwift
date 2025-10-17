import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MetaMaskService, { MetaMaskConnection } from '../services/MetaMaskService';
import AuthService, { AuthUser } from '../services/AuthService';

interface MetaMaskConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onError?: (error: string) => void;
}

const { width, height } = Dimensions.get('window');

const MetaMaskConnectModal: React.FC<MetaMaskConnectModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'authenticate' | 'success'>('connect');
  const [connectionStatus, setConnectionStatus] = useState<MetaMaskConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  const metaMaskService = MetaMaskService;
  const authService = AuthService;

  useEffect(() => {
    if (visible) {
      setStep('connect');
      setError(null);
      setConnectionStatus(null);
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('MetaMaskConnectModal: Starting connection...');
      
      const connected = await metaMaskService.connect();
      
      if (connected) {
        const status = metaMaskService.getConnectionStatus();
        setConnectionStatus(status);
        setStep('authenticate');
        console.log('MetaMaskConnectModal: Connection successful');
      } else {
        setError('Failed to connect to MetaMask');
        onError?.('Failed to connect to MetaMask');
      }
    } catch (error) {
      console.error('MetaMaskConnectModal: Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('MetaMaskConnectModal: Starting authentication...');
      
      const authResult = await authService.authenticate();
      
      if (authResult.success && authResult.user) {
        setStep('success');
        console.log('MetaMaskConnectModal: Authentication successful');
        
        // Show success for a moment, then close
        setTimeout(() => {
          onSuccess(authResult.user!);
          onClose();
        }, 1500);
      } else {
        setError(authResult.error || 'Authentication failed');
        onError?.(authResult.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('MetaMaskConnectModal: Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallMetaMask = () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/metamask/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask';
    
    Linking.openURL(storeUrl);
  };

  const handleRetry = () => {
    setError(null);
    if (step === 'connect') {
      handleConnect();
    } else if (step === 'authenticate') {
      handleAuthenticate();
    }
  };

  const renderConnectStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#F6851B', '#FF8C00']}
          style={styles.metamaskIcon}
        >
          <Ionicons name="logo-bitcoin" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>Connect MetaMask</Text>
      <Text style={styles.subtitle}>
        Connect your MetaMask wallet to access CeloSwift features
      </Text>
      
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.featureText}>Secure wallet connection</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="flash" size={20} color="#10B981" />
          <Text style={styles.featureText}>Fast transactions</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="globe" size={20} color="#10B981" />
          <Text style={styles.featureText}>Celo network support</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.connectButton, loading && styles.connectButtonDisabled]}
        onPress={handleConnect}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Ionicons name="logo-bitcoin" size={20} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>Connect MetaMask</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.installButton}
        onPress={handleInstallMetaMask}
      >
        <Ionicons name="download" size={16} color="#6B7280" />
        <Text style={styles.installButtonText}>Install MetaMask</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuthenticateStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.metamaskIcon}
        >
          <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>Authenticate</Text>
      <Text style={styles.subtitle}>
        Sign a message to verify your wallet ownership
      </Text>

      {connectionStatus && (
        <View style={styles.connectionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>
              {metaMaskService.formatAddress(connectionStatus.address || '')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network:</Text>
            <Text style={styles.infoValue}>{connectionStatus.networkName}</Text>
          </View>
          {connectionStatus.balance && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Balance:</Text>
              <Text style={styles.infoValue}>{connectionStatus.balance} CELO</Text>
            </View>
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.connectButton, loading && styles.connectButtonDisabled]}
        onPress={handleAuthenticate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>Authenticate</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('connect')}
      >
        <Ionicons name="arrow-back" size={16} color="#6B7280" />
        <Text style={styles.backButtonText}>Back to Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.metamaskIcon}
        >
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>Connected!</Text>
      <Text style={styles.subtitle}>
        Your MetaMask wallet is now connected to CeloSwift
      </Text>

      {connectionStatus && (
        <View style={styles.connectionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>
              {metaMaskService.formatAddress(connectionStatus.address || '')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network:</Text>
            <Text style={styles.infoValue}>{connectionStatus.networkName}</Text>
          </View>
        </View>
      )}

      <View style={styles.successMessage}>
        <Ionicons name="sparkles" size={20} color="#10B981" />
        <Text style={styles.successText}>You can now use all CeloSwift features!</Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'connect':
        return renderConnectStep();
      case 'authenticate':
        return renderAuthenticateStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderConnectStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, step === 'connect' && styles.progressStepActive]} />
              <View style={[styles.progressStep, step === 'authenticate' && styles.progressStepActive]} />
              <View style={[styles.progressStep, step === 'success' && styles.progressStepActive]} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {renderCurrentStep()}

          {error && step !== 'success' && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={16} color="#6B7280" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#F6851B',
  },
  closeButton: {
    padding: 4,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  metamaskIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  connectionInfo: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  successText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6851B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#F6851B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  installButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default MetaMaskConnectModal;
