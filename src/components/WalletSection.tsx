'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletConnect } from './wallet/wallet-connect';
import { CreateWalletFlow } from './wallet/create-wallet-flow';
import { WalletHeader } from './wallet/wallet-header';
import { BalanceDisplay } from './wallet/balance-display';
import { ActionButtons } from './wallet/action-buttons';
import { TokensList } from './wallet/tokens-list';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'connect' | 'create-flow' | 'wallet';

export default function WalletSection() {
  const {
    publicKey,
    secretKey,
    balance,
    isLoading,
    error,
    isConnected,
    createWallet,
    importWallet,
    refreshBalance,
    fundAccount,
    disconnect
  } = useWallet();

  const [viewMode, setViewMode] = useState<ViewMode>('connect');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCreateWallet = () => {
    setViewMode('create-flow');
  };

  const handleWalletCreated = (publicKey: string, secretKey: string, password: string) => {
    createWallet();
    setViewMode('wallet');
  };

  const handleBackToConnect = () => {
    setViewMode('connect');
  };

  const handleImportWallet = (secretKey: string) => {
    importWallet(secretKey);
    setViewMode('wallet');
  };

  // Prepare token data
  const tokens = balance.map(balanceItem => ({
    symbol: balanceItem.asset_type === 'native' ? 'XLM' : (balanceItem as any).asset_code || 'Unknown',
    name: balanceItem.asset_type === 'native' ? 'Stellar Lumens' : (balanceItem as any).asset_code || 'Unknown Asset',
    balance: balanceItem.balance,
    value: balanceItem.asset_type === 'native' ? (parseFloat(balanceItem.balance) * 0.12).toFixed(2) : undefined,
    change24h: balanceItem.asset_type === 'native' ? 2.34 : undefined
  }));

  const totalBalance = balance.find(b => b.asset_type === 'native')?.balance || '0';

  // If not connected, show connection screen or creation flow
  if (!isConnected) {
    if (viewMode === 'create-flow') {
      return (
        <CreateWalletFlow 
          onWalletCreated={handleWalletCreated}
          onBack={handleBackToConnect}
        />
      );
    }
    
    return (
      <WalletConnect 
        onCreateWallet={handleCreateWallet}
        onImportWallet={handleImportWallet}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background border rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <WalletHeader
        publicKey={publicKey || undefined}
        isConnected={isConnected}
        onCopy={copyToClipboard}
      />

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Balance Display */}
      <div className="p-4">
        <BalanceDisplay
          balance={totalBalance}
          currency="XLM"
          isLoading={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <ActionButtons
        onSend={() => toast.info('Send function coming soon')}
        onReceive={() => copyToClipboard(publicKey || '')}
        onSwap={() => toast.info('Swap function coming soon')}
        onBuy={() => toast.info('Buy function coming soon')}
        disabled={isLoading}
      />

      {/* Tokens List */}
      <div className="p-4">
        <TokensList
          tokens={tokens}
          isLoading={isLoading}
          onTokenClick={(token) => toast.info(`Token selected: ${token.symbol}`)}
        />
      </div>

      {/* Utility Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalance}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await fundAccount();
            }}
            disabled={isLoading}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Funds
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          Disconnect Wallet
        </Button>
      </div>
    </div>
  );
}