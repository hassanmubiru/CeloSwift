import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import MetaMaskService, { MetaMaskConnection } from './MetaMaskService';

// Types for authentication
export interface AuthUser {
  address: string;
  ensName?: string;
  avatar?: string;
  isVerified: boolean;
  loginTime: number;
  lastActivity: number;
  sessionId: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export interface AuthChallenge {
  message: string;
  timestamp: number;
  nonce: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

// Storage keys
const STORAGE_KEYS = {
  AUTH_SESSION: 'auth_session',
  AUTH_USER: 'auth_user',
  AUTH_TOKEN: 'auth_token',
  LAST_CHALLENGE: 'last_challenge',
  USER_PREFERENCES: 'user_preferences',
};

// Session configuration
const SESSION_CONFIG = {
  TOKEN_EXPIRY_HOURS: 24,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  CHALLENGE_EXPIRY_MINUTES: 5,
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION_MINUTES: 15,
};

class AuthService {
  private static instance: AuthService;
  private currentSession: AuthSession | null = null;
  private metaMaskService: MetaMaskService;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.metaMaskService = MetaMaskService;
    this.setupEventListeners();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize authentication service
  async initialize(): Promise<boolean> {
    try {
      console.log('AuthService: Initializing...');
      
      // Load existing session
      await this.loadSession();
      
      // Set up MetaMask event listeners
      this.metaMaskService.on('connected', this.handleWalletConnected.bind(this));
      this.metaMaskService.on('disconnected', this.handleWalletDisconnected.bind(this));
      this.metaMaskService.on('accountsChanged', this.handleAccountsChanged.bind(this));
      
      console.log('AuthService: Initialization completed');
      return true;
    } catch (error) {
      console.error('AuthService: Initialization failed:', error);
      return false;
    }
  }

  // Authenticate user with MetaMask
  async authenticate(): Promise<AuthResult> {
    try {
      console.log('AuthService: Starting authentication...');

      // Check if wallet is connected
      if (!this.metaMaskService.isConnected()) {
        const connected = await this.metaMaskService.connect();
        if (!connected) {
          return {
            success: false,
            error: 'Failed to connect to MetaMask'
          };
        }
      }

      // Get wallet connection
      const connection = this.metaMaskService.getConnectionStatus();
      if (!connection.address) {
        return {
          success: false,
          error: 'No wallet address found'
        };
      }

      // Check for existing valid session
      if (this.currentSession && this.isSessionValid()) {
        console.log('AuthService: Using existing valid session');
        return {
          success: true,
          user: this.currentSession.user,
          token: this.currentSession.token
        };
      }

      // Create authentication challenge
      const challenge = await this.createChallenge(connection.address);
      
      // Sign the challenge
      const signature = await this.metaMaskService.signMessage(challenge.message);
      
      // Verify signature and create session
      const authResult = await this.verifySignatureAndCreateSession(
        connection.address,
        challenge,
        signature
      );

      if (authResult.success) {
        // Save session
        await this.saveSession(authResult as AuthSession);
        
        // Emit authentication event
        this.emit('authenticated', authResult);
        
        console.log('AuthService: Authentication successful');
      }

      return authResult;
    } catch (error) {
      console.error('AuthService: Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  // Create authentication challenge
  private async createChallenge(address: string): Promise<AuthChallenge> {
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    
    // Create a message that includes timestamp and nonce for security
    const message = `Welcome to CeloSwift!

Please sign this message to authenticate your wallet.

Address: ${address}
Timestamp: ${timestamp}
Nonce: ${nonce}

This request will not trigger a blockchain transaction or cost any gas fees.`;

    const challenge: AuthChallenge = {
      message,
      timestamp,
      nonce,
    };

    // Store challenge temporarily
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_CHALLENGE,
      JSON.stringify(challenge)
    );

    return challenge;
  }

  // Verify signature and create session
  private async verifySignatureAndCreateSession(
    address: string,
    challenge: AuthChallenge,
    signature: string
  ): Promise<AuthResult> {
    try {
      // Verify the signature
      const isValid = await this.verifySignature(address, challenge.message, signature);
      
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Check challenge expiry
      const now = Date.now();
      const challengeAge = now - challenge.timestamp;
      if (challengeAge > SESSION_CONFIG.CHALLENGE_EXPIRY_MINUTES * 60 * 1000) {
        return {
          success: false,
          error: 'Challenge expired'
        };
      }

      // Create user object
      const user: AuthUser = {
        address: address.toLowerCase(),
        isVerified: true,
        loginTime: now,
        lastActivity: now,
        sessionId: this.generateSessionId(),
      };

      // Try to resolve ENS name (optional)
      try {
        const ensName = await this.resolveENSName(address);
        if (ensName) {
          user.ensName = ensName;
        }
      } catch (error) {
        console.log('AuthService: ENS resolution failed:', error);
      }

      // Generate authentication token
      const token = await this.generateAuthToken(user);
      const expiresAt = now + (SESSION_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      const session: AuthSession = {
        user,
        token,
        expiresAt,
      };

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('AuthService: Session creation error:', error);
      return {
        success: false,
        error: 'Failed to create session'
      };
    }
  }

  // Verify signature
  private async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare addresses (case-insensitive)
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('AuthService: Signature verification error:', error);
      return false;
    }
  }

  // Generate authentication token
  private async generateAuthToken(user: AuthUser): Promise<string> {
    try {
      // Create a simple JWT-like token
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      const payload = {
        sub: user.address,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + SESSION_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000) / 1000),
        sessionId: user.sessionId,
        loginTime: user.loginTime,
      };

      // In production, use a proper JWT library with a secret key
      const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.signature';
      
      return token;
    } catch (error) {
      console.error('AuthService: Token generation error:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  // Resolve ENS name (optional feature)
  private async resolveENSName(address: string): Promise<string | null> {
    try {
      // This would require an ENS resolver
      // For now, return null as ENS is not commonly used on Celo
      return null;
    } catch (error) {
      console.error('AuthService: ENS resolution error:', error);
      return null;
    }
  }

  // Check if session is valid
  isSessionValid(): boolean {
    if (!this.currentSession) {
      return false;
    }

    const now = Date.now();
    return this.currentSession.expiresAt > now;
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentSession?.user || null;
  }

  // Get current session
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isSessionValid() && this.metaMaskService.isConnected();
  }

  // Refresh session
  async refreshSession(): Promise<AuthResult> {
    try {
      if (!this.currentSession) {
        return {
          success: false,
          error: 'No session to refresh'
        };
      }

      // Check if wallet is still connected
      if (!this.metaMaskService.isConnected()) {
        return {
          success: false,
          error: 'Wallet disconnected'
        };
      }

      // Update last activity
      this.currentSession.user.lastActivity = Date.now();
      
      // Extend session expiry
      this.currentSession.expiresAt = Date.now() + (SESSION_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
      
      // Save updated session
      await this.saveSession(this.currentSession);
      
      return {
        success: true,
        user: this.currentSession.user,
        token: this.currentSession.token
      };
    } catch (error) {
      console.error('AuthService: Session refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh session'
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      console.log('AuthService: Logging out user...');

      // Clear current session
      this.currentSession = null;

      // Clear stored data
      await this.clearSession();

      // Disconnect wallet
      await this.metaMaskService.disconnect();

      // Emit logout event
      this.emit('loggedOut', {});

      console.log('AuthService: Logout completed');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    }
  }

  // Update user activity
  async updateActivity(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.user.lastActivity = Date.now();
        await this.saveSession(this.currentSession);
      }
    } catch (error) {
      console.error('AuthService: Update activity error:', error);
    }
  }

  // Save session to storage
  private async saveSession(session: AuthSession): Promise<void> {
    try {
      this.currentSession = session;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);
      
      // Save to Keychain for sensitive data
      await Keychain.setInternetCredentials(
        'celoswift_auth',
        session.user.address,
        session.token
      );
    } catch (error) {
      console.error('AuthService: Save session error:', error);
    }
  }

  // Load session from storage
  private async loadSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      
      if (sessionData) {
        const session: AuthSession = JSON.parse(sessionData);
        
        // Check if session is still valid
        if (this.isSessionValid()) {
          this.currentSession = session;
          console.log('AuthService: Loaded valid session for:', session.user.address);
        } else {
          console.log('AuthService: Session expired, clearing...');
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('AuthService: Load session error:', error);
      await this.clearSession();
    }
  }

  // Clear session from storage
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_SESSION,
        STORAGE_KEYS.AUTH_USER,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.LAST_CHALLENGE,
      ]);
      
      await Keychain.resetInternetCredentials('celoswift_auth');
    } catch (error) {
      console.error('AuthService: Clear session error:', error);
    }
  }

  // Event handlers
  private handleWalletConnected(connection: MetaMaskConnection): void {
    console.log('AuthService: Wallet connected:', connection.address);
    this.emit('walletConnected', connection);
  }

  private handleWalletDisconnected(): void {
    console.log('AuthService: Wallet disconnected');
    this.logout();
  }

  private handleAccountsChanged(accounts: string[]): void {
    console.log('AuthService: Accounts changed:', accounts);
    
    if (accounts.length === 0) {
      this.logout();
    } else if (this.currentSession && accounts[0].toLowerCase() !== this.currentSession.user.address) {
      // Different account selected, need to re-authenticate
      this.logout();
    }
  }

  // Utility functions
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSessionId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          console.error(`AuthService: Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Set up any global event listeners here
  }
}

export default AuthService.getInstance();
