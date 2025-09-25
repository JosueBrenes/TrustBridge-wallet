"use client"

import { Wallet, Plus, Download, Fingerprint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { PasskeyModal } from "./PasskeyModal"

interface WalletConnectProps {
  onCreateWallet: () => void
  onImportWallet: (secretKey: string) => void
  onPasskeySuccess: (walletAddress: string, token: string) => void
  isLoading?: boolean
}

export function WalletConnect({ 
  onCreateWallet, 
  onImportWallet, 
  onPasskeySuccess,
  isLoading = false 
}: WalletConnectProps) {
  const [importSecret, setImportSecret] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [showPasskeyModal, setShowPasskeyModal] = useState(false)

  const handleImport = () => {
    if (importSecret.trim()) {
      onImportWallet(importSecret.trim())
      setImportSecret("")
      setShowImport(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold">Welcome</h1>
            <p className="text-muted-foreground">
              Connect or create your wallet to get started
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Passkey Authentication - Featured Option */}
          <Button 
            onClick={() => setShowPasskeyModal(true)}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            size="lg"
          >
            <Fingerprint className="h-5 w-5 mr-2" />
            Connect with Passkey
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OR
              </span>
            </div>
          </div>

          <Button 
            onClick={onCreateWallet}
            disabled={isLoading}
            className="w-full h-12"
            size="lg"
            variant="outline"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Wallet
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OR
              </span>
            </div>
          </div>

          {!showImport ? (
            <Button 
              variant="outline" 
              onClick={() => setShowImport(true)}
              className="w-full h-12"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Import Existing Wallet
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key</Label>
                <Input
                  id="secret-key"
                  type="password"
                  placeholder="Enter your secret key..."
                  value={importSecret}
                  onChange={(e) => setImportSecret(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImport(false)
                    setImportSecret("")
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

        <div className="text-center text-xs text-muted-foreground space-y-1">
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
  )
}