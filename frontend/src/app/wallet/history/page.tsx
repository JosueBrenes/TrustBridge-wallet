'use client';

import { useWalletStore } from '@/stores/walletStore';
import { Button } from '@/components/ui/button';
import { History, RefreshCw } from 'lucide-react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { TransactionFilters } from '@/components/history/TransactionFilters';
import { TransactionList } from '@/components/history/TransactionList';
import { TransactionSummary } from '@/components/history/TransactionSummary';
import { toast } from 'sonner';

export default function HistoryPage() {
  const { publicKey } = useWalletStore();
  const {
    filteredTransactions,
    stats,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    filters,
    refreshTransactions,
    loadMoreTransactions,
    updateFilters,
    copyToClipboard: originalCopyToClipboard,
    openInStellarExpert
  } = useTransactionHistory();

  const copyToClipboard = (text: string, label: string) => {
    originalCopyToClipboard(text, label);
    toast.success(`${label} copied to clipboard`);
  };

  if (!publicKey) {
    return null; // This will be handled by the layout redirect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Transaction History</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshTransactions}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filter */}
      <TransactionFilters 
        filters={filters}
        onFiltersChange={updateFilters}
      />

      {/* Transaction List */}
      <TransactionList
        transactions={filteredTransactions}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        hasMore={hasMore}
        publicKey={publicKey}
        onRefresh={refreshTransactions}
        onLoadMore={loadMoreTransactions}
        onCopyToClipboard={copyToClipboard}
        onOpenInStellarExpert={openInStellarExpert}
      />

      {/* Summary Stats */}
      <TransactionSummary 
        stats={stats}
        isVisible={stats.total > 0}
      />
    </div>
  );
}