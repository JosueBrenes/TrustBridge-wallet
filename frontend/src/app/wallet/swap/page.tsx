'use client';

import { useWalletStore } from '@/stores/walletStore';
import { SwapForm } from '@/components/wallet/swap-form';
import { ArrowUpDown } from 'lucide-react';

export default function SwapPage() {
  const { publicKey } = useWalletStore();

  if (!publicKey) {
    return null; // This will be handled by the layout redirect
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <ArrowUpDown className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Swap XLM to USDC</h1>
          </div>
          <p className="text-muted-foreground">
            Exchange your XLM for USDC using Stellar&apos;s decentralized exchange
          </p>
        </div>

        {/* Swap Form */}
        <div className="bg-card border rounded-lg p-6">
          <SwapForm />
      </div>
    </div>
  );
}