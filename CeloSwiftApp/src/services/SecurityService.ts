import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import ErrorHandler, { ErrorType, ErrorSeverity } from './ErrorHandler';

// Security configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_TRANSACTION_AMOUNT: '1000', // CELO
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
  RATE_LIMIT_WINDOW_MINUTES: 5,
  RATE_LIMIT_MAX_ATTEMPTS: 3,
};

// Security events
export enum SecurityEvent {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  TRANSACTION_ATTEMPT = 'TRANSACTION_ATTEMPT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
}

export interface SecurityEventData {
  event: SecurityEvent;
  timestamp: number;
  userId?: string;
  address?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityMetrics {
  loginAttempts: number;
  failedLogins: number;
  successfulLogins: number;
  transactionsAttempted: number;
  suspiciousActivities: number;
  lastActivity: number;
  isLocked: boolean;
  lockoutUntil?: number;
}

export interface SecurityPolicy {
  maxTransactionAmount: string;
  requireBiometric: boolean;
  sessionTimeout: number;
  allowMultipleSessions: boolean;
  enableRateLimiting: boolean;
}

class SecurityService {
  private static instance: SecurityService;
  private metrics: SecurityMetrics;
  private eventLog: SecurityEventData[] = [];
  private rateLimitMap: Map<string, number[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  // Storage keys
  private readonly STORAGE_KEYS = {
    SECURITY_METRICS: 'security_metrics',
    SECURITY_EVENTS: 'security_events',
    SECURITY_POLICY: 'security_policy',
    RATE_LIMIT_DATA: 'rate_limit_data',
  };

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private constructor() {
    this.metrics = {
      loginAttempts: 0,
      failedLogins: 0,
      successfulLogins: 0,
      transactionsAttempted: 0,
      suspiciousActivities: 0,
      lastActivity: 0,
      isLocked: false,
    };
  }

  // Initialize security service
  async initialize(): Promise<void> {
    try {
      await this.loadSecurityData();
      await this.checkLockoutStatus();
      console.log('SecurityService: Initialized successfully');
    } catch (error) {
      console.error('SecurityService: Initialization failed:', error);
      ErrorHandler.handleError(error, ErrorType.SECURITY_ERROR, ErrorSeverity.HIGH);
    }
  }

  // Record security event
  async recordEvent(event: SecurityEvent, details?: any): Promise<void> {
    try {
      const eventData: SecurityEventData = {
        event,
        timestamp: Date.now(),
        details,
      };

      // Add to event log
      this.eventLog.unshift(eventData);
      
      // Keep only recent events (last 1000)
      if (this.eventLog.length > 1000) {
        this.eventLog = this.eventLog.slice(0, 1000);
      }

      // Update metrics
      this.updateMetrics(event);

      // Check for suspicious activity
      await this.checkSuspiciousActivity();

      // Save data
      await this.saveSecurityData();

      // Emit event
      this.emit('securityEvent', eventData);

      console.log('SecurityService: Recorded event:', event, details);
    } catch (error) {
      console.error('SecurityService: Failed to record event:', error);
    }
  }

  // Update security metrics
  private updateMetrics(event: SecurityEvent): void {
    switch (event) {
      case SecurityEvent.LOGIN_ATTEMPT:
        this.metrics.loginAttempts++;
        break;
      case SecurityEvent.LOGIN_SUCCESS:
        this.metrics.successfulLogins++;
        this.metrics.lastActivity = Date.now();
        break;
      case SecurityEvent.LOGIN_FAILURE:
        this.metrics.failedLogins++;
        break;
      case SecurityEvent.TRANSACTION_ATTEMPT:
        this.metrics.transactionsAttempted++;
        this.metrics.lastActivity = Date.now();
        break;
      case SecurityEvent.SUSPICIOUS_ACTIVITY:
        this.metrics.suspiciousActivities++;
        break;
    }
  }

  // Check for suspicious activity
  private async checkSuspiciousActivity(): Promise<void> {
    try {
      const recentEvents = this.eventLog.filter(
        event => Date.now() - event.timestamp < 5 * 60 * 1000 // Last 5 minutes
      );

      const failedLogins = recentEvents.filter(
        event => event.event === SecurityEvent.LOGIN_FAILURE
      ).length;

      const transactionAttempts = recentEvents.filter(
        event => event.event === SecurityEvent.TRANSACTION_ATTEMPT
      ).length;

      // Check for excessive failed logins
      if (failedLogins >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        await this.handleSuspiciousActivity('Excessive failed login attempts');
        return;
      }

      // Check for excessive transaction attempts
      if (transactionAttempts >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
        await this.handleSuspiciousActivity('Excessive transaction attempts');
        return;
      }

      // Check for rapid successive events
      const rapidEvents = this.detectRapidEvents(recentEvents);
      if (rapidEvents.length > 0) {
        await this.handleSuspiciousActivity('Rapid successive events detected');
      }
    } catch (error) {
      console.error('SecurityService: Failed to check suspicious activity:', error);
    }
  }

  // Detect rapid successive events
  private detectRapidEvents(events: SecurityEventData[]): SecurityEventData[] {
    const rapidEvents: SecurityEventData[] = [];
    const timeWindow = 30 * 1000; // 30 seconds

    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      
      if (currentEvent.timestamp - nextEvent.timestamp < timeWindow) {
        rapidEvents.push(currentEvent);
      }
    }

    return rapidEvents;
  }

  // Handle suspicious activity
  private async handleSuspiciousActivity(reason: string): Promise<void> {
    try {
      await this.recordEvent(SecurityEvent.SUSPICIOUS_ACTIVITY, { reason });
      
      // Lock the account temporarily
      await this.lockAccount(SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES);
      
      // Log security event
      console.warn('SecurityService: Suspicious activity detected:', reason);
      
      // Emit security alert
      this.emit('securityAlert', { reason, timestamp: Date.now() });
    } catch (error) {
      console.error('SecurityService: Failed to handle suspicious activity:', error);
    }
  }

  // Lock account
  async lockAccount(durationMinutes: number): Promise<void> {
    try {
      this.metrics.isLocked = true;
      this.metrics.lockoutUntil = Date.now() + (durationMinutes * 60 * 1000);
      
      await this.saveSecurityData();
      
      console.log(`SecurityService: Account locked for ${durationMinutes} minutes`);
    } catch (error) {
      console.error('SecurityService: Failed to lock account:', error);
    }
  }

  // Unlock account
  async unlockAccount(): Promise<void> {
    try {
      this.metrics.isLocked = false;
      this.metrics.lockoutUntil = undefined;
      
      await this.saveSecurityData();
      
      console.log('SecurityService: Account unlocked');
    } catch (error) {
      console.error('SecurityService: Failed to unlock account:', error);
    }
  }

  // Check if account is locked
  isAccountLocked(): boolean {
    if (!this.metrics.isLocked) {
      return false;
    }

    if (this.metrics.lockoutUntil && Date.now() > this.metrics.lockoutUntil) {
      this.unlockAccount();
      return false;
    }

    return true;
  }

  // Check lockout status
  private async checkLockoutStatus(): Promise<void> {
    if (this.metrics.lockoutUntil && Date.now() > this.metrics.lockoutUntil) {
      await this.unlockAccount();
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, action: string): Promise<boolean> {
    try {
      const key = `${identifier}_${action}`;
      const now = Date.now();
      const windowStart = now - (SECURITY_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
      
      // Get existing attempts
      let attempts = this.rateLimitMap.get(key) || [];
      
      // Filter attempts within the time window
      attempts = attempts.filter(timestamp => timestamp > windowStart);
      
      // Check if rate limit exceeded
      if (attempts.length >= SECURITY_CONFIG.RATE_LIMIT_MAX_ATTEMPTS) {
        await this.recordEvent(SecurityEvent.RATE_LIMIT_EXCEEDED, { identifier, action });
        return false;
      }
      
      // Add current attempt
      attempts.push(now);
      this.rateLimitMap.set(key, attempts);
      
      return true;
    } catch (error) {
      console.error('SecurityService: Rate limit check failed:', error);
      return true; // Allow on error
    }
  }

  // Validate transaction
  async validateTransaction(transaction: any): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Check if account is locked
      if (this.isAccountLocked()) {
        return { valid: false, reason: 'Account is temporarily locked' };
      }

      // Check transaction amount
      if (transaction.value) {
        const amount = parseFloat(transaction.value);
        const maxAmount = parseFloat(SECURITY_CONFIG.MAX_TRANSACTION_AMOUNT);
        
        if (amount > maxAmount) {
          return { 
            valid: false, 
            reason: `Transaction amount exceeds maximum limit of ${maxAmount} CELO` 
          };
        }
      }

      // Check for valid address
      if (transaction.to && !ethers.isAddress(transaction.to)) {
        return { valid: false, reason: 'Invalid recipient address' };
      }

      // Record transaction attempt
      await this.recordEvent(SecurityEvent.TRANSACTION_ATTEMPT, {
        to: transaction.to,
        value: transaction.value,
      });

      return { valid: true };
    } catch (error) {
      console.error('SecurityService: Transaction validation failed:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Validate address
  validateAddress(address: string): { valid: boolean; reason?: string } {
    try {
      if (!address) {
        return { valid: false, reason: 'Address is required' };
      }

      if (!ethers.isAddress(address)) {
        return { valid: false, reason: 'Invalid address format' };
      }

      // Check for common scam addresses (you would maintain a list)
      if (this.isKnownScamAddress(address)) {
        return { valid: false, reason: 'This address is flagged as suspicious' };
      }

      return { valid: true };
    } catch (error) {
      console.error('SecurityService: Address validation failed:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Check if address is known scam address
  private isKnownScamAddress(address: string): boolean {
    // In a real app, you would maintain a database of known scam addresses
    const knownScamAddresses = [
      // Add known scam addresses here
    ];
    
    return knownScamAddresses.includes(address.toLowerCase());
  }

  // Get security metrics
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  // Get recent security events
  getRecentEvents(limit: number = 50): SecurityEventData[] {
    return this.eventLog.slice(0, limit);
  }

  // Clear security data
  async clearSecurityData(): Promise<void> {
    try {
      this.metrics = {
        loginAttempts: 0,
        failedLogins: 0,
        successfulLogins: 0,
        transactionsAttempted: 0,
        suspiciousActivities: 0,
        lastActivity: 0,
        isLocked: false,
      };
      
      this.eventLog = [];
      this.rateLimitMap.clear();
      
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.SECURITY_METRICS,
        this.STORAGE_KEYS.SECURITY_EVENTS,
        this.STORAGE_KEYS.RATE_LIMIT_DATA,
      ]);
      
      console.log('SecurityService: Security data cleared');
    } catch (error) {
      console.error('SecurityService: Failed to clear security data:', error);
    }
  }

  // Save security data
  private async saveSecurityData(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SECURITY_METRICS,
        JSON.stringify(this.metrics)
      );
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SECURITY_EVENTS,
        JSON.stringify(this.eventLog)
      );
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RATE_LIMIT_DATA,
        JSON.stringify(Array.from(this.rateLimitMap.entries()))
      );
    } catch (error) {
      console.error('SecurityService: Failed to save security data:', error);
    }
  }

  // Load security data
  private async loadSecurityData(): Promise<void> {
    try {
      const metricsData = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_METRICS);
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
      
      const eventsData = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_EVENTS);
      if (eventsData) {
        this.eventLog = JSON.parse(eventsData);
      }
      
      const rateLimitData = await AsyncStorage.getItem(this.STORAGE_KEYS.RATE_LIMIT_DATA);
      if (rateLimitData) {
        const entries = JSON.parse(rateLimitData);
        this.rateLimitMap = new Map(entries);
      }
    } catch (error) {
      console.error('SecurityService: Failed to load security data:', error);
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
          console.error(`SecurityService: Event listener error for ${event}:`, error);
        }
      });
    }
  }
}

export default SecurityService.getInstance();
