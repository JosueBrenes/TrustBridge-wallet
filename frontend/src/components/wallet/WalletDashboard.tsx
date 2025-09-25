"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Send, 
  QrCode, 
  ArrowUpDown, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Copy,
  ExternalLink,
  Plus,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/walletStore";
import { BalanceDisplay } from "./balance-display";
import { TokensList } from "./tokens-list";
import { ReceiveQRModal } from "./receive-qr-modal";
import { SendModal } from "./send-modal";
import { SwapModal } from "./swap-modal";
import { DeFiModal } from "./defi-modal";

export default function WalletDashboard() {
  const {
    publicKey,
    balance,
    isLoading,
    error,
    fundAccount,
  } = useWalletStore();

  const [showBalance, setShowBalance] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showDeFiModal, setShowDeFiModal] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
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

  const totalBalance = balance.find((b) => b.asset_type === "native")?.balance || "0";
  const totalValueUSD = (parseFloat(totalBalance) * 0.12).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="h-8 w-8 p-0"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(publicKey || "")}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            {showBalance ? (
              <>
                <div className="text-3xl font-bold">
                  {parseFloat(totalBalance).toFixed(4)} XLM
                </div>
                <div className="text-lg text-muted-foreground">
                  ≈ ${totalValueUSD} USD
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">••••••</div>
                <div className="text-lg text-muted-foreground">••••••</div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendModal(true)}
              disabled={isLoading}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Send className="h-4 w-4" />
              <span className="text-xs">Send</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReceiveModal(true)}
              disabled={isLoading}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <QrCode className="h-4 w-4" />
              <span className="text-xs">Receive</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSwapModal(true)}
              disabled={isLoading}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-xs">Swap</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeFiModal(true)}
              disabled={isLoading}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">DeFi</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Assets</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {tokens.length} {tokens.length === 1 ? 'Asset' : 'Assets'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TokensList
            tokens={tokens}
            isLoading={isLoading}
            onTokenClick={(token) =>
              toast.info(`Token selected: ${token.symbol}`)
            }
          />
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={async () => {
              await fundAccount();
            }}
            disabled={isLoading}
            className="w-full justify-start"
          >
            <Zap className="h-4 w-4 mr-2" />
            Get Test Funds
            <Badge variant="secondary" className="ml-auto">
              Testnet
            </Badge>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open("https://stellar.expert/explorer/testnet", "_blank")}
            className="w-full justify-start"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Stellar Expert
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No recent transactions</div>
            <div className="text-xs mt-1">Your transaction history will appear here</div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ReceiveQRModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        publicKey={publicKey || ""}
      />

      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
      />

      <SwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
      />

      <DeFiModal
        isOpen={showDeFiModal}
        onClose={() => setShowDeFiModal(false)}
      />
    </div>
  );
}