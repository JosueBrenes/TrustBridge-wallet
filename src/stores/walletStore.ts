import { create } from "zustand";
import {
  generateWallet,
  getKeypairFromSecret,
  getAccountBalance,
  fundTestnetAccount,
} from "@/lib/stellar";

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
  autoRefreshInterval: NodeJS.Timeout | null;
}

interface WalletActions {
  createWallet: () => void;
  importWallet: (secretKey: string) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  fundAccount: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>((set, get) => ({
  // Initial state
  publicKey: null,
  secretKey: null,
  isConnected: false,
  balance: [],
  isLoading: false,
  error: null,
  autoRefreshInterval: null,

  // Actions
  createWallet: () => {
    try {
      set({ isLoading: true, error: null });

      const newWallet = generateWallet();

      // Save to localStorage
      localStorage.setItem(
        "stellar-wallet",
        JSON.stringify({
          publicKey: newWallet.publicKey,
          secretKey: newWallet.secretKey,
        })
      );

      set({
        publicKey: newWallet.publicKey,
        secretKey: newWallet.secretKey,
        isConnected: true,
        balance: [],
        isLoading: false,
        error: null,
      });

      // Start auto refresh
      get().startAutoRefresh();
    } catch {
      set((state) => ({
        ...state,
        isLoading: false,
        error: 'Failed to create wallet. Please try again.',
      }));
    }
  },

  importWallet: (secretKey: string) => {
    try {
      set({ isLoading: true, error: null });

      const keypair = getKeypairFromSecret(secretKey);
      const publicKey = keypair.publicKey();

      // Save to localStorage
      localStorage.setItem(
        "stellar-wallet",
        JSON.stringify({
          publicKey,
          secretKey,
        })
      );

      set({
        publicKey,
        secretKey,
        isConnected: true,
        balance: [],
        isLoading: false,
        error: null,
      });

      // Start auto refresh
      get().startAutoRefresh();
    } catch {
      set((state) => ({
        ...state,
        isLoading: false,
        error: 'Failed to import wallet. Please check your secret key.',
      }));
    }
  },

  disconnect: () => {
    const { autoRefreshInterval } = get();

    // Stop auto refresh
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }

    set({
      publicKey: null,
      secretKey: null,
      isConnected: false,
      balance: [],
      isLoading: false,
      error: null,
      autoRefreshInterval: null,
    });

    localStorage.removeItem("stellar-wallet");
  },

  refreshBalance: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    try {
      set({ isLoading: true, error: null });

      const balance = await getAccountBalance(publicKey);

      set({
        balance,
        isLoading: false,
        error: null,
      });
    } catch {
      set((state) => ({
        ...state,
        isLoading: false,
        error: 'Failed to refresh balance. Please try again.',
      }));
    }
  },

  fundAccount: async () => {
    const { publicKey, refreshBalance } = get();

    if (!publicKey) {
      set({
        error: "No wallet connected. Please create or import a wallet first.",
      });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const success = await fundTestnetAccount(publicKey);

      if (success) {
        set({
          isLoading: false,
          error: null,
        });

        // Refresh balance after a short delay to allow network propagation
        setTimeout(() => {
          refreshBalance();
        }, 2000);
      } else {
        set({
          isLoading: false,
          error:
            "Account funding failed. The account may already be funded or there was a network error.",
        });
      }
    } catch {
      set((state) => ({
        ...state,
        isLoading: false,
        error: 'Failed to fund account. Please try again.',
      }));
    }
  },

  startAutoRefresh: () => {
    const { autoRefreshInterval, refreshBalance } = get();

    // Clear existing interval if any
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }

    // Initial refresh
    refreshBalance();

    // Set up auto refresh every 30 seconds
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    set({ autoRefreshInterval: interval });
  },

  stopAutoRefresh: () => {
    const { autoRefreshInterval } = get();

    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      set({ autoRefreshInterval: null });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

// Initialize wallet from localStorage
const initializeWallet = () => {
  const savedWallet = localStorage.getItem("stellar-wallet");
  if (savedWallet) {
    try {
      const parsed = JSON.parse(savedWallet);
      useWalletStore.setState({
        publicKey: parsed.publicKey,
        secretKey: parsed.secretKey,
        isConnected: true,
      });

      // Start auto refresh for existing wallet
      useWalletStore.getState().startAutoRefresh();
    } catch {
      localStorage.removeItem('stellar-wallet');
    }
  }
};

// Initialize on module load
if (typeof window !== "undefined") {
  initializeWallet();
}
