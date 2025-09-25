"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/stores/walletStore";
import { toast } from "sonner";
import { Loader2, ArrowUpDown, RefreshCw } from "lucide-react";

interface SwapFormProps {
  onSuccess?: () => void;
}

export function SwapForm({ onSuccess }: SwapFormProps) {
  const [xlmAmount, setXlmAmount] = useState("");
  const [minUSDCAmount, setMinUSDCAmount] = useState("");
  const [marketPrice, setMarketPrice] = useState<{ price: string; spread: string } | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [estimatedUSDC, setEstimatedUSDC] = useState("");

  const { swapXLMToUSDC, getMarketPrice, isLoading, balance } = useWalletStore();

  // Get XLM balance
  const xlmBalance = balance.find(b => b.asset === "XLM")?.balance || "0";

  const loadMarketPrice = useCallback(async () => {
    try {
      setIsLoadingPrice(true);
      const price = await getMarketPrice();
      setMarketPrice(price);
    } catch (error) {
      toast.error("Error fetching market price");
      console.error("Error loading market price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  }, [getMarketPrice]);

  // Load market price on component mount
  useEffect(() => {
    loadMarketPrice();
  }, [loadMarketPrice]);

  // Calculate estimated USDC when XLM amount changes
  useEffect(() => {
    if (xlmAmount && marketPrice) {
      const xlmNum = parseFloat(xlmAmount);
      const priceNum = parseFloat(marketPrice.price);
      if (!isNaN(xlmNum) && !isNaN(priceNum)) {
        const estimated = (xlmNum * priceNum).toFixed(6);
        setEstimatedUSDC(estimated);
        // Set minimum USDC to 95% of estimated (5% slippage tolerance)
        setMinUSDCAmount((parseFloat(estimated) * 0.95).toFixed(6));
      }
    } else {
      setEstimatedUSDC("");
      setMinUSDCAmount("");
    }
  }, [xlmAmount, marketPrice]);

  const handleSwap = async () => {
    if (!xlmAmount || !minUSDCAmount) {
      toast.error("Please enter all required fields");
      return;
    }

    const xlmNum = parseFloat(xlmAmount);
    const xlmBalanceNum = parseFloat(xlmBalance);

    if (isNaN(xlmNum) || xlmNum <= 0) {
      toast.error("Please enter a valid XLM amount");
      return;
    }

    if (xlmNum > xlmBalanceNum) {
      toast.error("Insufficient XLM balance");
      return;
    }

    // Reserve some XLM for transaction fees (minimum 1 XLM)
    if (xlmNum > xlmBalanceNum - 1) {
      toast.error("You must keep at least 1 XLM for transaction fees");
      return;
    }

    try {
      const result = await swapXLMToUSDC(xlmAmount, minUSDCAmount);

      if (result.success) {
        toast.success(`Swap successful! You received ${result.receivedAmount || 'N/A'} USDC`);
        setXlmAmount("");
        setMinUSDCAmount("");
        setEstimatedUSDC("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Error performing swap");
      }
    } catch (error) {
      toast.error("Unexpected error performing swap");
      console.error("Swap error:", error);
    }
  };

  const handleMaxClick = () => {
    const maxAmount = Math.max(0, parseFloat(xlmBalance) - 1); // Reserve 1 XLM for fees
    setXlmAmount(maxAmount.toString());
  };

  return (
    <div className="space-y-4">
      {/* Market Price Display */}
      <div className="bg-muted/50 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Market price:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMarketPrice}
            disabled={isLoadingPrice}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPrice ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {isLoadingPrice ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading price...</span>
          </div>
        ) : marketPrice ? (
          <div className="mt-1">
            <div className="text-lg font-semibold">1 XLM = {marketPrice.price} USDC</div>
            <div className="text-xs text-muted-foreground">Spread: {marketPrice.spread}%</div>
          </div>
        ) : (
          <div className="text-sm text-destructive mt-1">Error loading price</div>
        )}
      </div>

      {/* XLM Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="xlm-amount">XLM amount to swap</Label>
        <div className="flex gap-2">
          <Input
            id="xlm-amount"
            type="number"
            placeholder="0.00"
            value={xlmAmount}
            onChange={(e) => setXlmAmount(e.target.value)}
            step="0.000001"
            min="0"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleMaxClick}
            disabled={!xlmBalance || parseFloat(xlmBalance) <= 1}
          >
            MAX
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Available balance: {parseFloat(xlmBalance).toFixed(6)} XLM
        </div>
      </div>

      {/* Estimated USDC */}
      {estimatedUSDC && (
        <div className="bg-primary/10 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">You will receive approximately:</div>
          <div className="text-lg font-semibold text-primary">{estimatedUSDC} USDC</div>
        </div>
      )}

      {/* Minimum USDC Amount */}
      <div className="space-y-2">
        <Label htmlFor="min-usdc">Minimum USDC amount to receive</Label>
        <Input
          id="min-usdc"
          type="number"
          placeholder="0.000000"
          value={minUSDCAmount}
          onChange={(e) => setMinUSDCAmount(e.target.value)}
          step="0.000001"
          min="0"
        />
        <div className="text-xs text-muted-foreground">
          Slippage protection
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleSwap}
        disabled={isLoading || !xlmAmount || !minUSDCAmount || !marketPrice}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Execute Swap
          </>
        )}
      </Button>

      {/* Warning */}
      <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
        <strong>Notice:</strong> Swaps use Stellar&apos;s DEX. Prices may change between quote and transaction execution.
      </div>
    </div>
  );
}