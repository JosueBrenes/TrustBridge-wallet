"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/walletStore";
import { Textarea } from "../ui/textarea";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const { sendMoney, isLoading, balance } = useWalletStore();
  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionResult, setTransactionResult] = useState<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  } | null>(null);

  // Get XLM balance
  const xlmBalance = balance.find((b) => b.asset === "XLM")?.balance || "0";
  const availableBalance = parseFloat(xlmBalance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationAddress.trim()) {
      toast.error("Please enter a destination address");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const sendAmount = parseFloat(amount);
    if (sendAmount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    // Basic validation for Stellar address format
    if (
      destinationAddress.length !== 56 ||
      !destinationAddress.startsWith("G")
    ) {
      toast.error("Invalid Stellar address format");
      return;
    }

    setIsSubmitting(true);
    setTransactionResult(null);

    try {
      const result = await sendMoney(
        destinationAddress.trim(),
        amount.trim(),
        memo.trim() || undefined
      );

      setTransactionResult(result);

      if (result.success) {
        toast.success("Payment sent successfully!");
        // Reset form
        setDestinationAddress("");
        setAmount("");
        setMemo("");
      } else {
        toast.error(result.error || "Failed to send payment");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send payment";
      toast.error(errorMessage);
      setTransactionResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDestinationAddress("");
      setAmount("");
      setMemo("");
      setTransactionResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send XLM
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance Display */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-2xl font-bold">
                  {availableBalance.toFixed(7)} XLM
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Result */}
          {transactionResult && (
            <Card
              className={
                transactionResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  {transactionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        transactionResult.success
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {transactionResult.success
                        ? "Transaction Successful!"
                        : "Transaction Failed"}
                    </p>
                    {transactionResult.success &&
                      transactionResult.transactionHash && (
                        <p className="text-sm text-green-700 mt-1 break-all">
                          Hash: {transactionResult.transactionHash}
                        </p>
                      )}
                    {!transactionResult.success && transactionResult.error && (
                      <p className="text-sm text-red-700 mt-1">
                        {transactionResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Address</Label>
              <Input
                id="destination"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                disabled={isSubmitting}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (XLM)</Label>
              <Input
                id="amount"
                type="number"
                step="0.0000001"
                min="0.0000001"
                max={availableBalance}
                placeholder="0.0000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Textarea
                id="memo"
                placeholder="Add a note to your transaction..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                disabled={isSubmitting}
                maxLength={28}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {memo.length}/28 characters
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || availableBalance <= 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
