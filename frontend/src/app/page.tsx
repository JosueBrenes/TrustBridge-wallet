"use client";

import { useWalletStore } from "@/stores/walletStore";
import WalletSidebar from "@/components/layout/WalletSidebar";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import { CreateWalletFlow } from "@/components/wallet/create-wallet-flow";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { useState } from "react";

type ViewMode = "connect" | "create-flow" | "wallet";

export default function WalletPage() {
  const {
    publicKey,
    isConnected,
    isLoading,
    createWallet,
    importWallet,
    connectPasskeyWallet,
  } = useWalletStore();

  const [viewMode, setViewMode] = useState<ViewMode>("connect");

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

  // If not connected, show connection screen or creation flow without sidebar
  if (!isConnected) {
    if (viewMode === "create-flow") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <CreateWalletFlow
            onWalletCreated={handleWalletCreated}
            onBack={handleBackToConnect}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <WalletConnect
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
          onPasskeySuccess={handlePasskeySuccess}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // If connected, show the dashboard with sidebar
  return (
    <WalletSidebar>
      <WalletDashboard />
    </WalletSidebar>
  );
}
