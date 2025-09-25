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
    balances,
    isLoading,
    error,
    isConnected,
    createWallet,
    createWalletWithPassword,
    importWallet,
    refreshBalances,
    fundAccount,
    disconnectWallet,
    isPasswordProtected,
    hasRecoveryPhrase
  } = useWallet();

  const [viewMode, setViewMode] = useState<ViewMode>('connect');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const handleCreateWallet = () => {
    setViewMode('create-flow');
  };

  const handleWalletCreated = (publicKey: string, secretKey: string, password: string) => {
    createWalletWithPassword(publicKey, secretKey, password);
    setViewMode('wallet');
  };

  const handleBackToConnect = () => {
    setViewMode('connect');
  };

  const handleImportWallet = (secretKey: string) => {
    const success = importWallet(secretKey);
    if (success) {
      setViewMode('wallet');
    }
  };

  // Preparar datos de tokens
  const tokens = balances.map(balance => ({
    symbol: balance.asset_type === 'native' ? 'XLM' : balance.asset_code || 'Unknown',
    name: balance.asset_type === 'native' ? 'Stellar Lumens' : balance.asset_code || 'Unknown Asset',
    balance: balance.balance,
    value: balance.asset_type === 'native' ? (parseFloat(balance.balance) * 0.12).toFixed(2) : undefined,
    change24h: balance.asset_type === 'native' ? 2.34 : undefined
  }));

  const totalBalance = balances.find(b => b.asset_type === 'native')?.balance || '0';

  // Si no está conectado, mostrar pantalla de conexión o flujo de creación
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
        publicKey={publicKey}
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
        onSend={() => toast.info('Función de envío próximamente')}
        onReceive={() => copyToClipboard(publicKey || '')}
        onSwap={() => toast.info('Función de intercambio próximamente')}
        onBuy={() => toast.info('Función de compra próximamente')}
        disabled={isLoading}
      />

      {/* Tokens List */}
      <div className="p-4">
        <TokensList
          tokens={tokens}
          isLoading={isLoading}
          onTokenClick={(token) => toast.info(`Token seleccionado: ${token.symbol}`)}
        />
      </div>

      {/* Utility Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalances}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const success = await fundAccount();
              if (success) {
                toast.success('Cuenta financiada exitosamente');
              } else {
                toast.error('Error al financiar la cuenta');
              }
            }}
            disabled={isLoading}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            Fondos Test
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          Desconectar Wallet
        </Button>
      </div>
    </div>
  );
}