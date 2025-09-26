import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { getTransactionHistory, ProcessedTransaction } from '@/lib/stellar';

export interface TransactionFilters {
  searchTerm: string;
  filterType: 'all' | 'send' | 'receive' | 'failed';
}

export interface TransactionStats {
  total: number;
  successful: number;
  failed: number;
  totalFees: number;
}

export interface UseTransactionHistoryReturn {
  // Data
  transactions: ProcessedTransaction[];
  filteredTransactions: ProcessedTransaction[];
  stats: TransactionStats;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  
  // Pagination
  hasMore: boolean;
  
  // Filters
  filters: TransactionFilters;
  
  // Actions
  loadTransactions: () => void;
  loadMoreTransactions: () => void;
  refreshTransactions: () => void;
  updateFilters: (filters: Partial<TransactionFilters>) => void;
  copyToClipboard: (text: string, label: string) => void;
  openInStellarExpert: (hash: string) => void;
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { publicKey } = useWalletStore();
  
  // State
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    filterType: 'all'
  });

  // Load transactions function
  const loadTransactionsInternal = useCallback(async (cursor?: string, append = false) => {
    if (!publicKey) return;

    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getTransactionHistory(publicKey, 20, cursor);
      
      if (append) {
        setTransactions(prev => [...prev, ...result.transactions]);
      } else {
        setTransactions(result.transactions);
      }
      
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [publicKey]);

  // Public actions
  const loadTransactions = useCallback(() => {
    loadTransactionsInternal();
  }, [loadTransactionsInternal]);

  const loadMoreTransactions = useCallback(() => {
    if (hasMore && nextCursor && !isLoadingMore) {
      loadTransactionsInternal(nextCursor, true);
    }
  }, [hasMore, nextCursor, isLoadingMore, loadTransactionsInternal]);

  const refreshTransactions = useCallback(() => {
    loadTransactionsInternal();
  }, [loadTransactionsInternal]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You might want to use a toast library here
    console.log(`${label} copied to clipboard`);
  }, []);

  const openInStellarExpert = useCallback((hash: string) => {
    window.open(`https://stellar.expert/explorer/testnet/tx/${hash}`, '_blank');
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = filters.searchTerm === '' || 
      tx.hash.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      tx.from?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      tx.to?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      tx.memo?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesFilter = filters.filterType === 'all' || 
      (filters.filterType === 'send' && (tx.type.toLowerCase().includes('send') || (tx.from === publicKey && tx.type.toLowerCase().includes('payment')))) ||
      (filters.filterType === 'receive' && (tx.type.toLowerCase().includes('receive') || (tx.to === publicKey && tx.type.toLowerCase().includes('payment')))) ||
      (filters.filterType === 'failed' && !tx.successful);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats: TransactionStats = {
    total: transactions.length,
    successful: transactions.filter(tx => tx.successful).length,
    failed: transactions.filter(tx => !tx.successful).length,
    totalFees: transactions.reduce((sum, tx) => sum + parseFloat(tx.fee), 0)
  };

  // Load transactions on mount or when publicKey changes
  useEffect(() => {
    if (publicKey) {
      loadTransactions();
    }
  }, [publicKey, loadTransactions]);

  return {
    // Data
    transactions,
    filteredTransactions,
    stats,
    
    // Loading states
    isLoading,
    isLoadingMore,
    error,
    
    // Pagination
    hasMore,
    
    // Filters
    filters,
    
    // Actions
    loadTransactions,
    loadMoreTransactions,
    refreshTransactions,
    updateFilters,
    copyToClipboard,
    openInStellarExpert
  };
}