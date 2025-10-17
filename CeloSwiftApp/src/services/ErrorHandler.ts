import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SECURITY_ERROR = 'SECURITY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

export interface ErrorReport {
  error: AppError;
  context: {
    screen?: string;
    action?: string;
    userAgent?: string;
    platform?: string;
    version?: string;
  };
  userInfo?: {
    address?: string;
    network?: string;
    balance?: string;
  };
}

// Error codes mapping
const ERROR_CODES = {
  // Network errors
  'NETWORK_ERROR': 'Network connection failed',
  'RPC_ERROR': 'Blockchain RPC error',
  'TIMEOUT': 'Request timeout',
  
  // Wallet errors
  'WALLET_NOT_CONNECTED': 'Wallet not connected',
  'WALLET_LOCKED': 'Wallet is locked',
  'WALLET_REJECTED': 'User rejected the request',
  'WALLET_NOT_FOUND': 'Wallet not found',
  'INSUFFICIENT_FUNDS': 'Insufficient funds',
  
  // Authentication errors
  'AUTH_FAILED': 'Authentication failed',
  'INVALID_SIGNATURE': 'Invalid signature',
  'SESSION_EXPIRED': 'Session expired',
  'CHALLENGE_EXPIRED': 'Challenge expired',
  
  // Transaction errors
  'TRANSACTION_FAILED': 'Transaction failed',
  'TRANSACTION_REJECTED': 'Transaction rejected',
  'GAS_ESTIMATION_FAILED': 'Gas estimation failed',
  'INVALID_TRANSACTION': 'Invalid transaction',
  'NONCE_TOO_LOW': 'Nonce too low',
  'GAS_PRICE_TOO_LOW': 'Gas price too low',
  
  // Validation errors
  'INVALID_ADDRESS': 'Invalid address',
  'INVALID_AMOUNT': 'Invalid amount',
  'INVALID_DATA': 'Invalid data',
  
  // Security errors
  'SUSPICIOUS_ACTIVITY': 'Suspicious activity detected',
  'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded',
  'INVALID_ORIGIN': 'Invalid origin',
};

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;
  private eventListeners: Map<string, Function[]> = new Map();

  // Storage keys
  private readonly STORAGE_KEYS = {
    ERROR_LOG: 'error_log',
    ERROR_STATS: 'error_stats',
  };

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Initialize error handler
  async initialize(): Promise<void> {
    try {
      await this.loadErrorLog();
      console.log('ErrorHandler: Initialized successfully');
    } catch (error) {
      console.error('ErrorHandler: Initialization failed:', error);
    }
  }

  // Handle and log errors
  handleError(
    error: Error | string | any,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: any
  ): AppError {
    const appError = this.createAppError(error, type, severity, context);
    
    // Log the error
    this.logError(appError);
    
    // Show user-friendly message
    this.showUserMessage(appError);
    
    // Emit error event
    this.emit('error', appError);
    
    // Report critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.reportError(appError, context);
    }
    
    return appError;
  }

  // Create structured error object
  private createAppError(
    error: Error | string | any,
    type: ErrorType,
    severity: ErrorSeverity,
    context?: any
  ): AppError {
    const timestamp = Date.now();
    
    let message: string;
    let code: string | number | undefined;
    let details: any;
    let stack: string | undefined;

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      code = (error as any).code;
      details = (error as any).details;
    } else if (error && typeof error === 'object') {
      message = error.message || error.toString();
      code = error.code;
      details = error.details || error;
      stack = error.stack;
    } else {
      message = 'Unknown error occurred';
    }

    // Map error codes to user-friendly messages
    if (code && ERROR_CODES[code as keyof typeof ERROR_CODES]) {
      message = ERROR_CODES[code as keyof typeof ERROR_CODES];
    }

    return {
      type,
      severity,
      message,
      code,
      details,
      timestamp,
      stack,
    };
  }

  // Log error to memory and storage
  private async logError(error: AppError): Promise<void> {
    try {
      // Add to memory log
      this.errorLog.unshift(error);
      
      // Keep only recent errors
      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog = this.errorLog.slice(0, this.maxLogSize);
      }
      
      // Save to storage
      await this.saveErrorLog();
      
      console.error('ErrorHandler: Logged error:', error);
    } catch (logError) {
      console.error('ErrorHandler: Failed to log error:', logError);
    }
  }

  // Show user-friendly error message
  private showUserMessage(error: AppError): void {
    const title = this.getErrorTitle(error);
    const message = this.getUserFriendlyMessage(error);
    
    // Don't show alerts for low severity errors
    if (error.severity === ErrorSeverity.LOW) {
      return;
    }
    
    Alert.alert(title, message, [
      { text: 'OK' },
      ...(error.severity === ErrorSeverity.CRITICAL ? [
        { 
          text: 'Report', 
          onPress: () => this.showReportDialog(error) 
        }
      ] : [])
    ]);
  }

  // Get error title based on severity
  private getErrorTitle(error: AppError): string {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'Notice';
      case ErrorSeverity.MEDIUM:
        return 'Error';
      case ErrorSeverity.HIGH:
        return 'Important Error';
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      default:
        return 'Error';
    }
  }

  // Get user-friendly error message
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      
      case ErrorType.WALLET_ERROR:
        if (error.code === 'WALLET_NOT_CONNECTED') {
          return 'Please connect your wallet to continue.';
        } else if (error.code === 'WALLET_REJECTED') {
          return 'Transaction was cancelled by user.';
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
          return 'You don\'t have enough funds to complete this transaction.';
        }
        return 'There was an issue with your wallet. Please try again.';
      
      case ErrorType.AUTH_ERROR:
        if (error.code === 'SESSION_EXPIRED') {
          return 'Your session has expired. Please log in again.';
        } else if (error.code === 'INVALID_SIGNATURE') {
          return 'Authentication failed. Please try again.';
        }
        return 'Authentication error. Please try again.';
      
      case ErrorType.TRANSACTION_ERROR:
        if (error.code === 'TRANSACTION_REJECTED') {
          return 'Transaction was rejected. Please try again.';
        } else if (error.code === 'GAS_ESTIMATION_FAILED') {
          return 'Unable to estimate gas. Please check transaction details.';
        }
        return 'Transaction failed. Please try again.';
      
      case ErrorType.VALIDATION_ERROR:
        if (error.code === 'INVALID_ADDRESS') {
          return 'Please enter a valid wallet address.';
        } else if (error.code === 'INVALID_AMOUNT') {
          return 'Please enter a valid amount.';
        }
        return 'Please check your input and try again.';
      
      case ErrorType.SECURITY_ERROR:
        return 'Security issue detected. Please contact support if this persists.';
      
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Show error report dialog
  private showReportDialog(error: AppError): void {
    Alert.alert(
      'Report Error',
      'Would you like to report this error to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          onPress: () => this.submitErrorReport(error) 
        }
      ]
    );
  }

  // Submit error report
  private async submitErrorReport(error: AppError): Promise<void> {
    try {
      const report: ErrorReport = {
        error,
        context: {
          platform: Platform.OS,
          version: '1.0.0', // Get from app version
        },
      };
      
      // In a real app, you would send this to your error reporting service
      console.log('ErrorHandler: Submitting error report:', report);
      
      Alert.alert('Thank You', 'Error report submitted successfully.');
    } catch (reportError) {
      console.error('ErrorHandler: Failed to submit error report:', reportError);
    }
  }

  // Report error to external service
  private async reportError(error: AppError, context?: any): Promise<void> {
    try {
      // In a real app, you would integrate with services like:
      // - Sentry
      // - Bugsnag
      // - Crashlytics
      // - Custom error reporting API
      
      console.log('ErrorHandler: Reporting critical error:', error, context);
    } catch (reportError) {
      console.error('ErrorHandler: Failed to report error:', reportError);
    }
  }

  // Get error statistics
  async getErrorStats(): Promise<any> {
    try {
      const stats = await AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_STATS);
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('ErrorHandler: Failed to get error stats:', error);
      return {};
    }
  }

  // Update error statistics
  private async updateErrorStats(error: AppError): Promise<void> {
    try {
      const stats = await this.getErrorStats();
      const key = `${error.type}_${error.severity}`;
      
      stats[key] = (stats[key] || 0) + 1;
      stats.lastError = error.timestamp;
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.ERROR_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('ErrorHandler: Failed to update error stats:', error);
    }
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  // Clear error log
  async clearErrorLog(): Promise<void> {
    try {
      this.errorLog = [];
      await AsyncStorage.removeItem(this.STORAGE_KEYS.ERROR_LOG);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.ERROR_STATS);
      console.log('ErrorHandler: Error log cleared');
    } catch (error) {
      console.error('ErrorHandler: Failed to clear error log:', error);
    }
  }

  // Save error log to storage
  private async saveErrorLog(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.ERROR_LOG,
        JSON.stringify(this.errorLog)
      );
    } catch (error) {
      console.error('ErrorHandler: Failed to save error log:', error);
    }
  }

  // Load error log from storage
  private async loadErrorLog(): Promise<void> {
    try {
      const logData = await AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_LOG);
      if (logData) {
        this.errorLog = JSON.parse(logData);
      }
    } catch (error) {
      console.error('ErrorHandler: Failed to load error log:', error);
      this.errorLog = [];
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`ErrorHandler: Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods for common error scenarios
  static handleNetworkError(error: any): AppError {
    return ErrorHandler.getInstance().handleError(
      error,
      ErrorType.NETWORK_ERROR,
      ErrorSeverity.MEDIUM
    );
  }

  static handleWalletError(error: any): AppError {
    return ErrorHandler.getInstance().handleError(
      error,
      ErrorType.WALLET_ERROR,
      ErrorSeverity.HIGH
    );
  }

  static handleAuthError(error: any): AppError {
    return ErrorHandler.getInstance().handleError(
      error,
      ErrorType.AUTH_ERROR,
      ErrorSeverity.HIGH
    );
  }

  static handleTransactionError(error: any): AppError {
    return ErrorHandler.getInstance().handleError(
      error,
      ErrorType.TRANSACTION_ERROR,
      ErrorSeverity.HIGH
    );
  }

  static handleValidationError(error: any): AppError {
    return ErrorHandler.getInstance().handleError(
      error,
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  static handleSecurityError(error: any): AppError {
    return ErrorHandler.getInstance().handleError(
      error,
      ErrorType.SECURITY_ERROR,
      ErrorSeverity.CRITICAL
    );
  }
}

export default ErrorHandler.getInstance();
