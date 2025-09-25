"use client";

import { Plus, Download, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
      {/* Meteors Background covering entire page */}
      <div className="fixed inset-0 w-full h-full">
        <Meteors number={40} className="absolute inset-0" />
      </div>

      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 relative z-10 backdrop-blur-sm bg-card/95 mx-4">
        <div className="text-center space-y-3 sm:space-y-4">
          {/* TrustBridge Logo */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <Image
              src="/logo.png"
              alt="TrustBridge Logo"
              width={56}
              height={56}
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold">Welcome</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Connect or create your wallet to get started
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Passkey Authentication - Featured Option */}
          <Button
            onClick={() => setShowPasskeyModal(true)}
            disabled={isLoading}
            className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Connect with Passkey
          </Button>

          <div className="text-center text-sm sm:text-base text-muted-foreground">
            OR
          </div>

          {/* Wallet Options */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={onCreateWallet}
              disabled={isLoading}
              className="flex-1 h-11 sm:h-12 rounded-xl px-4 text-sm sm:text-base"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Create New Wallet
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImport(true)}
              className="flex-1 h-11 sm:h-12 rounded-xl px-4 text-sm sm:text-base"
            >
              <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Import Existing Wallet
            </Button>
          </div>

          {showImport && (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret-key" className="text-sm sm:text-base">
                  Secret Key
                </Label>
                <Input
                  id="secret-key"
                  type="password"
                  placeholder="Enter your secret key..."
                  value={importSecret}
                  onChange={(e) => setImportSecret(e.target.value)}
                  className="font-mono text-sm sm:text-base h-10 sm:h-11"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImport(false);
                    setImportSecret("");
                  }}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importSecret.trim() || isLoading}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                >
                  Import
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center space-y-1 sm:space-y-2 text-sm sm:text-base text-muted-foreground px-2">
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
