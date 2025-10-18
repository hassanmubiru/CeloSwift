# MetaMask Connection Popup Troubleshooting Guide

## 🔍 **Root Cause Analysis**

The MetaMask connection popup not appearing is typically caused by one of these issues:

### **1. Browser Security & Popup Blockers**
- **Issue**: Browser popup blockers preventing MetaMask popup
- **Symptoms**: No popup appears, no error messages
- **Solution**: Disable popup blockers for your domain

### **2. User Interaction Requirements**
- **Issue**: MetaMask requires user-initiated actions (button clicks)
- **Symptoms**: Popup appears but immediately closes
- **Solution**: Ensure connection is triggered by user gesture

### **3. Incorrect Provider Detection**
- **Issue**: `window.ethereum` not properly detected
- **Symptoms**: "MetaMask not found" errors
- **Solution**: Verify MetaMask installation and provider detection

### **4. Network Configuration Issues**
- **Issue**: Incorrect network setup or provider configuration
- **Symptoms**: Connection fails after popup appears
- **Solution**: Verify network configuration and RPC endpoints

### **5. Timing and Async Issues**
- **Issue**: Race conditions in async operations
- **Symptoms**: Intermittent connection failures
- **Solution**: Implement proper error handling and retry logic

## 🛠 **Step-by-Step Troubleshooting**

### **Step 1: Environment Check**

```typescript
// Add this to your component to check environment
const checkEnvironment = () => {
  console.log('Platform:', Platform.OS);
  console.log('Has window:', typeof window !== 'undefined');
  console.log('Has ethereum:', !!(window as any).ethereum);
  console.log('Is MetaMask:', !!(window as any).ethereum?.isMetaMask);
  console.log('Secure context:', window.isSecureContext);
  console.log('User agent:', navigator.userAgent);
};
```

### **Step 2: MetaMask Detection Test**

```typescript
const testMetaMaskDetection = () => {
  if (typeof window === 'undefined') {
    console.error('Not in browser environment');
    return false;
  }

  if (!(window as any).ethereum) {
    console.error('MetaMask not found');
    return false;
  }

  const ethereum = (window as any).ethereum;
  console.log('Ethereum provider found:', typeof ethereum);
  console.log('Is MetaMask:', ethereum.isMetaMask);
  console.log('Version:', ethereum.version);
  
  return true;
};
```

### **Step 3: Connection Test with Error Handling**

```typescript
const testConnection = async () => {
  try {
    if (!(window as any).ethereum) {
      throw new Error('MetaMask not found');
    }

    const ethereum = (window as any).ethereum;
    
    // Check if already connected
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      console.log('Already connected:', accounts[0]);
      return accounts[0];
    }

    // Request new connection
    console.log('Requesting account access...');
    const newAccounts = await ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    console.log('Connection successful:', newAccounts);
    return newAccounts[0];
    
  } catch (error: any) {
    console.error('Connection failed:', error);
    
    // Handle specific MetaMask errors
    if (error.code === 4001) {
      console.error('User rejected the connection request');
    } else if (error.code === -32002) {
      console.error('Connection request already pending');
    } else if (error.code === 4902) {
      console.error('MetaMask is not connected to any network');
    }
    
    throw error;
  }
};
```

## 🔧 **Code Fixes & Improvements**

### **Fix 1: Enhanced Connection Method**

Replace your current connection method with this improved version:

```typescript
// Enhanced connect method with proper error handling
async connect(): Promise<boolean> {
  try {
    // Check environment
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    if (!(window as any).ethereum) {
      this.showMetaMaskNotFoundDialog();
      return false;
    }

    const ethereum = (window as any).ethereum;
    
    // Verify MetaMask
    if (!ethereum.isMetaMask) {
      console.warn('MetaMask not detected as primary provider');
    }

    // Create provider
    const provider = new ethers.BrowserProvider(ethereum);

    // Request account access with retry logic
    const accounts = await this.requestAccountsWithRetry(ethereum);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
    }

    // Continue with connection logic...
    return true;
    
  } catch (error) {
    console.error('Connection error:', error);
    this.handleConnectionError(error);
    return false;
  }
}

// Retry logic for account requests
private async requestAccountsWithRetry(ethereum: any, maxRetries: number = 3): Promise<string[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Account request attempt ${attempt}/${maxRetries}`);
      
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        return accounts;
      }
      
      throw new Error('No accounts returned');
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      // Handle specific errors
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending');
      } else if (error.code === 4902) {
        throw new Error('MetaMask is not connected to any network');
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Failed to connect after multiple attempts');
}
```

### **Fix 2: Proper Error Handling**

```typescript
private handleConnectionError(error: any): void {
  console.error('Connection error:', error);
  
  let errorMessage = 'Connection failed';
  
  if (error.message) {
    if (error.message.includes('User rejected')) {
      errorMessage = 'Connection was rejected by user';
    } else if (error.message.includes('already pending')) {
      errorMessage = 'Connection request already pending. Please check MetaMask.';
    } else if (error.message.includes('not connected')) {
      errorMessage = 'MetaMask is not connected to any network';
    } else {
      errorMessage = error.message;
    }
  }
  
  // Show user-friendly error message
  if (Platform.OS === 'web') {
    console.error('MetaMask Connection Error:', errorMessage);
    // You could also show a custom modal here
  } else {
    Alert.alert('Connection Error', errorMessage);
  }
  
  // Emit error event
  this.emit('error', { message: errorMessage, error });
}
```

### **Fix 3: User Interaction Requirements**

Ensure the connection is triggered by a user-initiated event:

```typescript
// ✅ CORRECT - User-initiated
const handleConnectClick = async () => {
  const connected = await MetaMaskService.connect();
  if (connected) {
    console.log('Connected successfully');
  }
};

// ❌ WRONG - Not user-initiated
useEffect(() => {
  MetaMaskService.connect(); // This will fail
}, []);
```

### **Fix 4: Browser Compatibility**

```typescript
// Check browser compatibility
const checkBrowserCompatibility = () => {
  const userAgent = navigator.userAgent;
  const isChrome = userAgent.includes('Chrome');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  const isEdge = userAgent.includes('Edge');
  
  console.log('Browser detected:', { isChrome, isFirefox, isSafari, isEdge });
  
  // MetaMask works best with Chrome and Firefox
  if (!isChrome && !isFirefox) {
    console.warn('MetaMask may not work properly in this browser');
  }
};
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "MetaMask not found"**
**Cause**: MetaMask extension not installed or not detected
**Solutions**:
- Install MetaMask extension
- Refresh the page
- Check if MetaMask is enabled
- Try in incognito mode

### **Issue 2: "User rejected the connection request"**
**Cause**: User clicked "Cancel" in MetaMask popup
**Solutions**:
- Ensure user clicks "Connect" in MetaMask
- Check if MetaMask is unlocked
- Clear MetaMask cache and try again

### **Issue 3: "Connection request already pending"**
**Cause**: Previous connection request still pending
**Solutions**:
- Wait for current request to complete
- Refresh the page
- Check MetaMask for pending requests

### **Issue 4: "MetaMask is not connected to any network"**
**Cause**: MetaMask not connected to any network
**Solutions**:
- Connect MetaMask to a network
- Switch to a supported network
- Check network configuration

### **Issue 5: Popup appears but closes immediately**
**Cause**: Browser security policies or timing issues
**Solutions**:
- Disable popup blockers
- Ensure connection is user-initiated
- Check browser console for errors
- Try in different browser

## 🔍 **Debugging Tools**

### **Debug Component**
Use the `MetaMaskDebugger` component to diagnose issues:

```typescript
import MetaMaskDebugger from './src/components/MetaMaskDebugger';

// Add to your app for debugging
<MetaMaskDebugger />
```

### **Console Debugging**
Add these debug logs to your connection method:

```typescript
const debugConnection = async () => {
  console.log('=== MetaMask Connection Debug ===');
  console.log('Platform:', Platform.OS);
  console.log('Has window:', typeof window !== 'undefined');
  console.log('Has ethereum:', !!(window as any).ethereum);
  
  if ((window as any).ethereum) {
    const ethereum = (window as any).ethereum;
    console.log('Is MetaMask:', ethereum.isMetaMask);
    console.log('Version:', ethereum.version);
    console.log('Is connected:', ethereum.isConnected?.());
  }
  
  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Connection successful:', accounts);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

## 🛡 **Prevention Strategies**

### **1. User Education**
- Show clear instructions before connection
- Explain what MetaMask is and why it's needed
- Provide installation links if MetaMask not found

### **2. Graceful Degradation**
- Check for MetaMask before attempting connection
- Provide alternative connection methods
- Show helpful error messages

### **3. Retry Logic**
- Implement retry mechanisms for failed connections
- Handle rate limiting and temporary failures
- Provide manual retry options

### **4. Network Validation**
- Verify network configuration before connection
- Provide network switching options
- Handle network errors gracefully

## 📱 **Platform-Specific Issues**

### **Web Platform**
- **Popup Blockers**: Disable for your domain
- **HTTPS Required**: Ensure secure connection
- **Browser Compatibility**: Test in multiple browsers
- **User Gesture**: Ensure user-initiated actions

### **Mobile Platform**
- **Deep Linking**: Configure URL schemes properly
- **App Installation**: Check if MetaMask app is installed
- **Permission Handling**: Handle app permissions correctly
- **Fallback Methods**: Provide alternative connection methods

## 🎯 **Best Practices**

### **1. Always Check Environment**
```typescript
if (typeof window === 'undefined' || !(window as any).ethereum) {
  // Handle non-browser environment or missing MetaMask
  return;
}
```

### **2. Handle All Error Cases**
```typescript
try {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
} catch (error: any) {
  switch (error.code) {
    case 4001:
      // User rejected
      break;
    case -32002:
      // Request already pending
      break;
    case 4902:
      // Not connected to network
      break;
    default:
      // Other errors
      break;
  }
}
```

### **3. Provide User Feedback**
```typescript
// Show loading state
setIsConnecting(true);

try {
  const connected = await MetaMaskService.connect();
  if (connected) {
    showSuccessMessage();
  }
} catch (error) {
  showErrorMessage(error.message);
} finally {
  setIsConnecting(false);
}
```

### **4. Implement Retry Logic**
```typescript
const connectWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await MetaMaskService.connect();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
```

## 🚀 **Quick Fix Implementation**

Replace your current MetaMask service with the improved version:

1. **Use the `ImprovedMetaMaskService`** provided above
2. **Add the `MetaMaskDebugger`** component for debugging
3. **Implement proper error handling** in your UI components
4. **Test in multiple browsers** and environments
5. **Add user education** and fallback options

This comprehensive approach should resolve the MetaMask connection popup issues and provide a robust, user-friendly wallet integration experience.
