"use client";

import { useWalletStore } from "@/stores/walletStore";
import { CreateWalletFlow } from "@/components/wallet/create-wallet-flow";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ViewMode = "connect" | "create-flow";

export default function HomePage() {
  const {
    isConnected,
    isLoading,
    createWallet,
    importWallet,
    connectPasskeyWallet,
  } = useWalletStore();

  const [viewMode, setViewMode] = useState<ViewMode>("connect");
  const router = useRouter();

  // Redirect to wallet if already connected
  useEffect(() => {
    if (isConnected) {
      router.push("/wallet");
    }
  }, [isConnected, router]);

  const handleCreateWallet = () => {
    setViewMode("create-flow");
  };

  const handleWalletCreated = () => {
    createWallet();
    // Will redirect via useEffect when isConnected becomes true
  };

  const handleBackToConnect = () => {
    setViewMode("connect");
  };

  const handleImportWallet = (secretKey: string) => {
    importWallet(secretKey);
    // Will redirect via useEffect when isConnected becomes true
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
    // Will redirect via useEffect when isConnected becomes true
  };

  // Show creation flow
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

  // Show connection screen
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
