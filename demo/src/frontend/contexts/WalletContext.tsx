/**
 * Wallet Context for managing wallet state across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletService, WalletConnection } from '../services/wallet';
import { WalletInfo } from '../services/api';

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  connection: WalletConnection | null;
  walletInfo: WalletInfo | null;
  
  // Loading states
  isConnecting: boolean;
  isLoadingWalletInfo: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  connectDemoWallet: () => Promise<void>;
  connectBrowserWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshWalletInfo: () => Promise<void>;
  clearError: () => void;
  
  // Utility methods
  formatBalance: (satoshis: number) => string;
  formatAddress: (address: string) => string;
  validateAddress: (address: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Initialize state from localStorage if available
  const [isConnected, setIsConnected] = useState(() => {
    try {
      return localStorage.getItem('wallet_connected') === 'true';
    } catch {
      return false;
    }
  });

  const [connection, setConnection] = useState<WalletConnection | null>(() => {
    try {
      const stored = localStorage.getItem('wallet_connection');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingWalletInfo, setIsLoadingWalletInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist wallet state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wallet_connected', isConnected.toString());
    } catch (error) {
      console.warn('Failed to persist wallet connection state:', error);
    }
  }, [isConnected]);

  useEffect(() => {
    try {
      if (connection) {
        localStorage.setItem('wallet_connection', JSON.stringify(connection));
      } else {
        localStorage.removeItem('wallet_connection');
      }
    } catch (error) {
      console.warn('Failed to persist wallet connection:', error);
    }
  }, [connection]);

  // Load wallet info when connection changes
  useEffect(() => {
    if (connection) {
      loadWalletInfo();
    } else {
      setWalletInfo(null);
    }
  }, [connection]);

  const loadWalletInfo = async () => {
    if (!connection) return;
    
    setIsLoadingWalletInfo(true);
    setError(null);
    
    try {
      const info = await walletService.getWalletInfo();
      setWalletInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load wallet info';
      setError(errorMessage);
      console.error('Failed to load wallet info:', err);
    } finally {
      setIsLoadingWalletInfo(false);
    }
  };

  const connectDemoWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const newConnection = await walletService.connectDemoWallet();
      setConnection(newConnection);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect demo wallet';
      setError(errorMessage);
      console.error('Failed to connect demo wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectBrowserWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const newConnection = await walletService.connectBrowserWallet();
      setConnection(newConnection);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect browser wallet';
      setError(errorMessage);
      console.error('Failed to connect browser wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await walletService.disconnect();
      setConnection(null);
      setWalletInfo(null);
      setIsConnected(false);
      setError(null);

      // Clear localStorage
      try {
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_connection');
      } catch (error) {
        console.warn('Failed to clear wallet state from localStorage:', error);
      }
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

  const refreshWalletInfo = async () => {
    await loadWalletInfo();
  };

  const clearError = () => {
    setError(null);
  };

  const formatBalance = (satoshis: number): string => {
    return walletService.formatBalance(satoshis);
  };

  const formatAddress = (address: string): string => {
    return walletService.formatAddress(address);
  };

  const validateAddress = (address: string): boolean => {
    return walletService.validateAddress(address);
  };

  const contextValue: WalletContextType = {
    // State
    isConnected,
    connection,
    walletInfo,
    isConnecting,
    isLoadingWalletInfo,
    error,
    
    // Actions
    connectDemoWallet,
    connectBrowserWallet,
    disconnect,
    refreshWalletInfo,
    clearError,
    
    // Utilities
    formatBalance,
    formatAddress,
    validateAddress,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook for wallet operations that require connection
export function useWalletOperations() {
  const wallet = useWallet();
  
  const requireConnection = () => {
    if (!wallet.isConnected || !wallet.connection) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    return wallet.connection;
  };

  const signTransaction = async (psbt: string) => {
    const connection = requireConnection();
    
    try {
      const result = await walletService.signTransaction({
        psbt,
        inputs: [{
          address: connection.address,
          signingIndexes: [0] // Simplified for demo
        }]
      });
      
      return result;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  };

  const getCurrentAddress = (): string => {
    const connection = requireConnection();
    return connection.address;
  };

  const getNetwork = (): 'testnet' | 'mainnet' => {
    const connection = requireConnection();
    return connection.network;
  };

  return {
    signTransaction,
    getCurrentAddress,
    getNetwork,
    requireConnection,
  };
}
