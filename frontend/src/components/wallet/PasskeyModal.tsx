"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Fingerprint, Plus, KeyRound, Loader2 } from "lucide-react";
import { usePasskeyWallet } from "@/hooks/usePasskeyWallet";
import { toast } from "sonner";

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string, token: string) => void;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createWallet, authenticate, isLoading } = usePasskeyWallet();
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean>(true);

  // Check WebAuthn support on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = !!(
        navigator.credentials &&
        typeof navigator.credentials.create === "function" &&
        typeof navigator.credentials.get === "function"
      );
      setWebAuthnSupported(supported);
    }
  }, []);

  const handleCreateWallet = async () => {
    try {
      if (!webAuthnSupported) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      const result = await createWallet();

      // Store auth info
      localStorage.setItem("authToken", result.token);

      // Call success callback
      onSuccess(result.walletAddress, result.token);
      onClose();

      toast.success("Wallet created successfully!", {
        description: "Your passkey wallet has been created and activated.",
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create wallet";

      // Check if it's a NotAllowedError (user cancelled or timed out)
      if (
        error instanceof Error &&
        (error.name === "NotAllowedError" ||
          error.message === "NotAllowedError" ||
          error.message.includes("not allowed") ||
          error.message.includes("timed out"))
      ) {
        toast.error("Error creating wallet with passkey", {
          description: "Creation was cancelled or timed out. Please try again.",
        });
      } else {
        toast.error("Wallet creation error", {
          description: errorMsg,
        });
      }
    }
  };

  const handleAuthenticate = async () => {
    try {
      if (!webAuthnSupported) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      const result = await authenticate();

      // Store auth info
      localStorage.setItem("authToken", result.token);

      // Call success callback
      onSuccess(result.walletAddress, result.token);
      onClose();

      toast.success("Authentication successful!", {
        description: "Welcome back to your passkey wallet.",
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to authenticate";

      // Check if it's a NotAllowedError (user cancelled or timed out)
      if (
        error instanceof Error &&
        (error.name === "NotAllowedError" ||
          error.message === "NotAllowedError" ||
          error.message.includes("not allowed") ||
          error.message.includes("timed out"))
      ) {
        toast.error("Error authenticating with passkey", {
          description:
            "Authentication was cancelled or timed out. Please try again.",
        });
      } else {
        toast.error("Authentication error", {
          description: errorMsg,
        });
      }
    }
  };

  if (!webAuthnSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              WebAuthn Not Supported
            </DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">
              Your browser doesn&apos;t support WebAuthn/Passkeys. Please use a
              modern browser like Chrome, Firefox, Safari, or Edge.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Fingerprint className="w-6 h-6 text-primary" />
            Passkey Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Wallet with Passkey */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Create New Wallet
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Create a secure Stellar wallet using your device&apos;s
                biometric authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="w-full h-12 rounded-xl px-4 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <div className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create Wallet with Passkey</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Login with Existing Passkey */}
          <Card className="border border-border/50">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-muted-foreground" />
                Access Existing Wallet
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Use your existing passkey to access your Stellar wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAuthenticate}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 rounded-xl px-4 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <div className="flex items-center">
                    <Fingerprint className="mr-2 h-4 w-4" />
                    <span>Authenticate with Passkey</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Secure biometric authentication</p>
            <p>No passwords or seed phrases required</p>
            <p>Instant wallet creation and access</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
