"use client";

import { Wallet, Plus, Download, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { PasskeyModal } from "./PasskeyModal";
import { Meteors } from "@/components/ui/meteors";
import Image from "next/image";

interface WalletConnectProps {
  onCreateWallet: () => void;
  onImportWallet: (secretKey: string) => void;
  onPasskeySuccess: (walletAddress: string, token: string) => void;
  isLoading?: boolean;
}

export function WalletConnect({
  onCreateWallet,
  onImportWallet,
  onPasskeySuccess,
  isLoading = false,
}: WalletConnectProps) {
  const [importSecret, setImportSecret] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);

  const handleImport = () => {
    if (importSecret.trim()) {
      onImportWallet(importSecret.trim());
      setImportSecret("");
      setShowImport(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
      {/* Meteors Background covering entire page */}
      <div className="fixed inset-0 w-full h-full">
        <Meteors number={40} className="absolute inset-0" />
      </div>

      <Card className="w-[40vw] max-w-3xl p-4 space-y-3 relative z-10 backdrop-blur-sm bg-card/95">
        <div className="text-center space-y-2">
          {/* TrustBridge Logo */}
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="TrustBridge Logo"
              width={56}
              height={56}
              className="rounded-full"
            />
          </div>

          <h1 className="text-lg font-bold">Welcome</h1>
          <p className="text-xs text-muted-foreground">
            Connect or create your wallet to get started
          </p>
        </div>

        <div className="space-y-2">
          {/* Passkey Authentication - Featured Option */}
          <Button
            onClick={() => setShowPasskeyModal(true)}
            disabled={isLoading}
            className="w-full h-9 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Fingerprint className="h-3 w-3 mr-2" />
            Connect with Passkey
          </Button>

          <div className="text-center text-xs text-muted-foreground">OR</div>

          <Button
            onClick={onCreateWallet}
            disabled={isLoading}
            className="w-full h-9 text-xs"
            variant="outline"
          >
            <Plus className="h-3 w-3 mr-2" />
            Create New Wallet
          </Button>

          <div className="text-center text-xs text-muted-foreground">OR</div>

          {!showImport ? (
            <Button
              variant="outline"
              onClick={() => setShowImport(true)}
              className="w-full h-9 text-xs"
            >
              <Download className="h-3 w-3 mr-2" />
              Import Existing Wallet
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="secret-key" className="text-xs">Secret Key</Label>
                <Input
                  id="secret-key"
                  type="password"
                  placeholder="Enter your secret key..."
                  value={importSecret}
                  onChange={(e) => setImportSecret(e.target.value)}
                  className="font-mono text-xs h-8"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImport(false);
                    setImportSecret("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importSecret.trim() || isLoading}
                  className="flex-1"
                >
                  Import
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center space-y-1 text-xs text-muted-foreground">
          <p>Secure biometric authentication with Passkey</p>
          <p>Stellar Testnet • For testing only</p>
        </div>
      </Card>

      {/* Passkey Modal */}
      <PasskeyModal
        isOpen={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        onSuccess={onPasskeySuccess}
      />
    </div>
  );
}
