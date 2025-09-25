import { useState, useEffect, useCallback } from 'react';
import { generateWallet, getKeypairFromSecret, getAccountBalance, fundTestnetAccount } from '@/lib/stellar';

interface WalletState {
  publicKey: string | null;
  secretKey: string | null;
  isConnected: boolean;
  balance: Array<{
    asset: string;
    balance: string;
    asset_type: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    secretKey: null,
    isConnected: false,
    balance: [],
    isLoading: false,
    error: null,
  });

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('stellar-wallet');
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet);
        setWallet(prev => ({
          ...prev,
          publicKey: parsed.publicKey,
          secretKey: parsed.secretKey,
          isConnected: true,
        }));
      } catch (error) {
        localStorage.removeItem('stellar-wallet');
      }
    }
  }, []);

  // Create new wallet
  const createWallet = useCallback(() => {
    try {
      setWallet(prev => ({ ...prev, isLoading: true, error: null }));
      
      const newWallet = generateWallet();
      
      const walletData = {
        publicKey: newWallet.publicKey,
        secretKey: newWallet.secretKey,
        isConnected: true,
        balance: [],
        isLoading: false,
        error: null,
      };
      
      setWallet(walletData);
      
      // Save to localStorage
      localStorage.setItem('stellar-wallet', JSON.stringify({
        publicKey: newWallet.publicKey,
        secretKey: newWallet.secretKey,
      }));
      
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to create wallet. Please try again.',
      }));
    }
  }, []);

  // Import wallet from secret key
  const importWallet = useCallback((secretKey: string) => {
    try {
      setWallet(prev => ({ ...prev, isLoading: true, error: null }));
      
      const keypair = getKeypairFromSecret(secretKey);
      const publicKey = keypair.publicKey();
      
      const walletData = {
        publicKey,
        secretKey,
        isConnected: true,
        balance: [],
        isLoading: false,
        error: null,
      };
      
      setWallet(walletData);
      
      // Save to localStorage
      localStorage.setItem('stellar-wallet', JSON.stringify({
        publicKey,
        secretKey,
      }));
      
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid secret key. Please check and try again.',
      }));
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet({
      publicKey: null,
      secretKey: null,
      isConnected: false,
      balance: [],
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('stellar-wallet');
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!wallet.publicKey) return;
    
    try {
      setWallet(prev => ({ ...prev, isLoading: true, error: null }));
      
      const balance = await getAccountBalance(wallet.publicKey);
      
      setWallet(prev => ({
        ...prev,
        balance,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch balance. Please try again.',
      }));
    }
  }, [wallet.publicKey]);

  // Fund account with Friendbot
  const fundAccount = useCallback(async () => {
    if (!wallet.publicKey) {
      setWallet(prev => ({
        ...prev,
        error: 'No wallet connected. Please create or import a wallet first.',
      }));
      return;
    }

    try {
      setWallet(prev => ({ ...prev, isLoading: true, error: null }));

      const success = await fundTestnetAccount(wallet.publicKey);

      if (success) {
        setWallet(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        // Refresh balance after a short delay to allow network propagation
        setTimeout(() => {
          refreshBalance();
        }, 2000);
      } else {
        setWallet(prev => ({
          ...prev,
          isLoading: false,
          error: 'Account funding failed. The account may already be funded or there was a network error.',
        }));
      }
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: 'Unexpected error during funding. Please try again.',
      }));
    }
  }, [wallet.publicKey, refreshBalance]);

  // Auto-refresh balance when wallet is connected
  useEffect(() => {
    if (wallet.isConnected && wallet.publicKey) {
      refreshBalance();
    }
  }, [wallet.isConnected, wallet.publicKey, refreshBalance]);

  return {
    ...wallet,
    createWallet,
    importWallet,
    disconnect,
    refreshBalance,
    fundAccount,
  };
}