import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ethers } from 'ethers';
import MetaMaskService, { TransactionRequest } from '../services/MetaMaskService';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  initialTransaction?: Partial<TransactionRequest>;
}

interface TransactionStep {
  step: 'details' | 'review' | 'signing' | 'success' | 'error';
  data?: any;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  initialTransaction,
}) => {
  const [currentStep, setCurrentStep] = useState<TransactionStep>({ step: 'details' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Transaction form data
  const [transaction, setTransaction] = useState<TransactionRequest>({
    to: initialTransaction?.to || '',
    value: initialTransaction?.value || '',
    data: initialTransaction?.data || '',
    gasLimit: initialTransaction?.gasLimit || '',
    gasPrice: initialTransaction?.gasPrice || '',
  });

  // Transaction details
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [gasPrice, setGasPrice] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const metaMaskService = MetaMaskService;

  useEffect(() => {
    if (visible) {
      setCurrentStep({ step: 'details' });
      setError(null);
      setTxHash('');
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  useEffect(() => {
    if (currentStep.step === 'review') {
      estimateGas();
    }
  }, [currentStep.step]);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const validateTransaction = (): boolean => {
    if (!transaction.to) {
      setError('Recipient address is required');
      return false;
    }

    if (!ethers.isAddress(transaction.to)) {
      setError('Invalid recipient address');
      return false;
    }

    if (transaction.value && isNaN(parseFloat(transaction.value))) {
      setError('Invalid amount');
      return false;
    }

    return true;
  };

  const estimateGas = async () => {
    try {
      setLoading(true);
      
      const connection = metaMaskService.getConnectionStatus();
      if (!connection.provider) {
        throw new Error('No provider available');
      }

      // Estimate gas for the transaction
      const gasEstimateResult = await connection.provider.estimateGas({
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value) : 0,
        data: transaction.data || '0x',
      });

      // Get current gas price
      const feeData = await connection.provider.getFeeData();
      const currentGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      setGasEstimate(gasEstimateResult.toString());
      setGasPrice(ethers.formatUnits(currentGasPrice, 'gwei'));

      // Calculate total cost
      const valueInWei = transaction.value ? ethers.parseEther(transaction.value) : 0;
      const gasCost = gasEstimateResult * currentGasPrice;
      const total = valueInWei + gasCost;
      
      setTotalCost(ethers.formatEther(total));

      // Update transaction with estimated values
      setTransaction(prev => ({
        ...prev,
        gasLimit: gasEstimateResult.toString(),
        gasPrice: currentGasPrice.toString(),
      }));

    } catch (error) {
      console.error('TransactionModal: Gas estimation error:', error);
      setError('Failed to estimate gas. Please check transaction details.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep.step === 'details') {
      if (validateTransaction()) {
        setCurrentStep({ step: 'review' });
      }
    }
  };

  const handleBack = () => {
    if (currentStep.step === 'review') {
      setCurrentStep({ step: 'details' });
    }
  };

  const handleSignTransaction = async () => {
    try {
      setLoading(true);
      setCurrentStep({ step: 'signing' });
      setError(null);

      console.log('TransactionModal: Signing transaction...');

      // Convert value to wei if provided
      const txData: TransactionRequest = {
        ...transaction,
        value: transaction.value ? ethers.parseEther(transaction.value).toString() : '0',
      };

      // Sign and send the transaction
      const hash = await metaMaskService.sendTransaction(txData);
      
      setTxHash(hash);
      setCurrentStep({ step: 'success' });
      
      console.log('TransactionModal: Transaction successful:', hash);
      onSuccess?.(hash);

    } catch (error) {
      console.error('TransactionModal: Transaction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setError(errorMessage);
      setCurrentStep({ step: 'error' });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (currentStep.step === 'signing') {
      Alert.alert(
        'Transaction in Progress',
        'A transaction is currently being processed. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Close', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Transaction Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Recipient Address *</Text>
        <TextInput
          style={styles.textInput}
          value={transaction.to}
          onChangeText={(text) => setTransaction(prev => ({ ...prev, to: text }))}
          placeholder="0x..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount (CELO)</Text>
        <TextInput
          style={styles.textInput}
          value={transaction.value}
          onChangeText={(text) => setTransaction(prev => ({ ...prev, value: text }))}
          placeholder="0.0"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Data (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={transaction.data}
          onChangeText={(text) => setTransaction(prev => ({ ...prev, data: text }))}
          placeholder="0x..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.nextButton, loading && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.nextButtonText}>Review Transaction</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Review Transaction</Text>
      
      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>To:</Text>
          <Text style={styles.reviewValue}>{formatAddress(transaction.to)}</Text>
        </View>
        
        {transaction.value && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Amount:</Text>
            <Text style={styles.reviewValue}>{transaction.value} CELO</Text>
          </View>
        )}
        
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Gas Limit:</Text>
          <Text style={styles.reviewValue}>{gasEstimate || 'Estimating...'}</Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Gas Price:</Text>
          <Text style={styles.reviewValue}>{gasPrice} Gwei</Text>
        </View>
        
        <View style={[styles.reviewRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Cost:</Text>
          <Text style={styles.totalValue}>{totalCost} CELO</Text>
        </View>
      </View>

      <View style={styles.warningContainer}>
        <Ionicons name="warning" size={20} color="#F59E0B" />
        <Text style={styles.warningText}>
          Please review all details carefully. This transaction cannot be undone.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signButton, loading && styles.signButtonDisabled]}
          onPress={handleSignTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.signButtonText}>Sign & Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSigningStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.signingContainer}>
        <ActivityIndicator size="large" color="#F6851B" />
        <Text style={styles.signingTitle}>Signing Transaction</Text>
        <Text style={styles.signingSubtitle}>
          Please confirm the transaction in your MetaMask wallet
        </Text>
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.successIcon}
        >
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </LinearGradient>
        
        <Text style={styles.successTitle}>Transaction Sent!</Text>
        <Text style={styles.successSubtitle}>
          Your transaction has been submitted to the network
        </Text>
        
        <View style={styles.txHashContainer}>
          <Text style={styles.txHashLabel}>Transaction Hash:</Text>
          <Text style={styles.txHashValue}>{formatAddress(txHash)}</Text>
        </View>
        
        <TouchableOpacity style={styles.viewOnExplorerButton}>
          <Ionicons name="open-outline" size={16} color="#6B7280" />
          <Text style={styles.viewOnExplorerText}>View on Explorer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.errorStepContainer}>
        <View style={styles.errorIcon}>
          <Ionicons name="close-circle" size={48} color="#EF4444" />
        </View>
        
        <Text style={styles.errorTitle}>Transaction Failed</Text>
        <Text style={styles.errorSubtitle}>
          {error || 'An unexpected error occurred'}
        </Text>
        
        <TouchableOpacity style={styles.retryButton} onPress={() => setCurrentStep({ step: 'details' })}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep.step) {
      case 'details':
        return renderDetailsStep();
      case 'review':
        return renderReviewStep();
      case 'signing':
        return renderSigningStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return renderDetailsStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Send Transaction</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {renderCurrentStep()}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6851B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#D97706',
    marginLeft: 8,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  signButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signButtonDisabled: {
    opacity: 0.6,
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  signingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  signingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  signingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  txHashContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  txHashLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  txHashValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  viewOnExplorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewOnExplorerText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  errorStepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6851B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default TransactionModal;
