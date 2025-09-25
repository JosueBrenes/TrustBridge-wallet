"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/walletStore";
import { CreateWalletFlow } from "./create-wallet-flow";
import { BalanceDisplay } from "./balance-display";
import { ActionButtons } from "./action-buttons";
import { TokensList } from "./tokens-list";
import { ReceiveQRModal } from "./receive-qr-modal";
import { WalletHeader } from "./wallet-header";
import { WalletConnect } from "./wallet-connect";

type ViewMode = "connect" | "create-flow" | "wallet";

export default function WalletSection() {
  const {
    publicKey,
    balance,
    isLoading,
    error,
    isConnected,
    createWallet,
    importWallet,
    connectPasskeyWallet,
    fundAccount,
    disconnect,
  } = useWalletStore();

  const [viewMode, setViewMode] = useState<ViewMode>("connect");
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleCreateWallet = () => {
    setViewMode("create-flow");
  };

  const handleWalletCreated = () => {
    createWallet();
    setViewMode("wallet");
  };

  const handleBackToConnect = () => {
    setViewMode("connect");
  };

  const handleImportWallet = (secretKey: string) => {
    importWallet(secretKey);
    setViewMode("wallet");
  };

  const handlePasskeySuccess = (walletAddress: string, token: string) => {
    // Store the passkey authentication info
    localStorage.setItem("passkeyWalletAddress", walletAddress);
    localStorage.setItem("authToken", token);
    
    // Get the secret key from localStorage (set by the passkey hook)
    const passkeyData = localStorage.getItem("passkeyWalletData");
    if (passkeyData) {
      const { secretKey } = JSON.parse(passkeyData);
      connectPasskeyWallet(walletAddress, secretKey);
    } else {
      // Fallback: use importWallet if no passkey data found
      importWallet(walletAddress);
    }
    
    setViewMode("wallet");
  };

  // Prepare token data
  const tokens = balance.map((balanceItem) => ({
    symbol:
      balanceItem.asset_type === "native"
        ? "XLM"
        : (balanceItem as { asset_code?: string }).asset_code || "Unknown",
    name:
      balanceItem.asset_type === "native"
        ? "Stellar Lumens"
        : (balanceItem as { asset_code?: string }).asset_code || "Unknown Asset",
    balance: balanceItem.balance,
    value:
      balanceItem.asset_type === "native"
        ? (parseFloat(balanceItem.balance) * 0.12).toFixed(2)
        : undefined,
    change24h: balanceItem.asset_type === "native" ? 2.34 : undefined,
  }));

  const totalBalance =
    balance.find((b) => b.asset_type === "native")?.balance || "0";

  // If not connected, show connection screen or creation flow
  if (!isConnected) {
    if (viewMode === "create-flow") {
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
        onPasskeySuccess={handlePasskeySuccess}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background border rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <WalletHeader
        publicKey={publicKey}
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
        onSend={() => toast.info("Send function coming soon")}
        onReceive={() => setShowReceiveModal(true)}
        onSwap={() => toast.info("Swap function coming soon")}
        onBuy={() => toast.info("Buy function coming soon")}
        disabled={isLoading}
      />

      {/* Tokens List */}
      <div className="p-4">
        <TokensList
          tokens={tokens}
          isLoading={isLoading}
          onTokenClick={(token) =>
            toast.info(`Token selected: ${token.symbol}`)
          }
        />
      </div>

      {/* Utility Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await fundAccount();
          }}
          disabled={isLoading}
          className="w-full"
        >
          <Zap className="h-4 w-4 mr-2" />
          Test Funds
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          Disconnect Wallet
        </Button>
      </div>

      {/* Receive QR Modal */}
      <ReceiveQRModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        publicKey={publicKey || ""}
      />
    </div>
  );
}
