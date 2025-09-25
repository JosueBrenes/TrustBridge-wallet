"use client";

import { useWalletStore } from "@/stores/walletStore";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WalletPage() {
  const { isConnected, isLoading } = useWalletStore();
  const router = useRouter();

  // Redirect to home if not connected
  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push("/");
    }
  }, [isConnected, isLoading, router]);

  // Show loading while checking connection
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not connected (will redirect)
  if (!isConnected) {
    return null;
  }

  // Show the wallet dashboard with sidebar
  return <WalletDashboard />;
}
