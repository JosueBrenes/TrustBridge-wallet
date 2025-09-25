"use client";

import { QrCode } from "lucide-react";
import { ReceiveQR } from "@/components/wallet/receive-qr";
import { useWalletStore } from "@/stores/walletStore";

export default function ReceivePage() {
  const { publicKey } = useWalletStore();

  if (!publicKey) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <p className="text-muted-foreground">Wallet not connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Receive Payments</h1>
        </div>
        <p className="text-muted-foreground">
          Share your QR code or address to receive XLM payments on Stellar.
        </p>
      </div>

      <ReceiveQR publicKey={publicKey} />
    </div>
  );
}