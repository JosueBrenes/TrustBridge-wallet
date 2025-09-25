"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DefindexService } from "@/services/defindex.service";
import { useWalletStore } from "@/stores/walletStore";

interface DefindexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = "strategies" | "invest" | "portfolio";

interface Strategy {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: string;
  risk: "Low" | "Medium" | "High";
  vaultAddress: string;
}

export function DefindexModal({ isOpen, onClose }: DefindexModalProps) {
  const { publicKey } = useWalletStore();
  const [viewMode, setViewMode] = useState<ViewMode>("strategies");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null
  );
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [currentAPY, setCurrentAPY] = useState<number>(0);
  const [investAmount, setInvestAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // New state for portfolio tracking
  const [totalDeposited, setTotalDeposited] = useState<string>("0");
  const [portfolioHistory, setPortfolioHistory] = useState<{
    deposits: number;
    withdrawals: number;
  }>({ deposits: 0, withdrawals: 0 });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const strategiesData = await DefindexService.getStrategies();
      setStrategies(strategiesData);

      if (publicKey) {
        const balance = await DefindexService.getUserBalance(publicKey);
        setUserBalance(balance);

        // Get APY from the first strategy's vault
        if (strategiesData.length > 0) {
          const apy = await DefindexService.getAPY(
            strategiesData[0].vaultAddress
          );
          setCurrentAPY(apy);
        }
      }
    } catch (error) {
      toast.error("Error loading DeFindex data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setViewMode("invest");
  };

  const handleInvest = async () => {
    if (!publicKey || !investAmount || !selectedStrategy) return;

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      await DefindexService.depositFunds(
        investAmount,
        publicKey,
        selectedStrategy.vaultAddress
      );

      // Update portfolio tracking
      setTotalDeposited((prev) => (parseFloat(prev) + amount).toString());
      setPortfolioHistory((prev) => ({
        ...prev,
        deposits: prev.deposits + amount,
      }));

      toast.success(
        `Successfully invested ${amount} in ${selectedStrategy.name}`
      );
      setInvestAmount("");
      await loadData(); // Refresh data
    } catch (error) {
      toast.error("Failed to invest funds");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    const balanceNum = parseFloat(userBalance);
    if (isNaN(amount) || amount <= 0 || amount > balanceNum) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      // Use the first strategy's vault address for withdrawal
      const vaultAddress =
        strategies.length > 0 ? strategies[0].vaultAddress : undefined;
      await DefindexService.withdrawFunds(
        withdrawAmount,
        publicKey,
        vaultAddress
      );

      // Update portfolio tracking
      setPortfolioHistory((prev) => ({
        ...prev,
        withdrawals: prev.withdrawals + amount,
      }));

      toast.success(`Successfully withdrew ${amount}`);
      setWithdrawAmount("");
      await loadData(); // Refresh data
    } catch (error) {
      toast.error("Failed to withdraw funds");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStrategiesView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Available Strategies</h3>
          <p className="text-sm text-muted-foreground">
            Choose a strategy that fits your risk tolerance
          </p>
        </div>
        <Button variant="outline" onClick={() => setViewMode("portfolio")}>
          My Portfolio
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map((strategy) => (
            <Card
              key={strategy.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleStrategySelect(strategy)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{strategy.name}</CardTitle>
                  <Badge className={getRiskColor(strategy.risk)}>
                    {strategy.risk} Risk
                  </Badge>
                </div>
                <CardDescription>{strategy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <span className="text-lg font-semibold text-green-600">
                    {strategy.apy}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvestView = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode("strategies")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{selectedStrategy?.name}</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Expected APY:</span>
            <span className="font-semibold text-green-600">
              {selectedStrategy?.apy}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Risk Level:</span>
            <Badge className={getRiskColor(selectedStrategy?.risk || "")}>
              {selectedStrategy?.risk}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <Label className="mb-2" htmlFor="invest-amount">
            Investment Amount (XLM)
          </Label>
          <Input
            id="invest-amount"
            type="number"
            placeholder="Enter amount to invest"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
          />
        </div>

        <Button
          onClick={handleInvest}
          disabled={isLoading || !investAmount}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Investing...
            </>
          ) : (
            "Invest Now"
          )}
        </Button>
      </div>
    </div>
  );

  const renderPortfolioView = () => {
    const currentBalance = parseFloat(userBalance);
    const totalDeposits = portfolioHistory.deposits;
    const totalWithdrawals = portfolioHistory.withdrawals;
    const netDeposited = totalDeposits - totalWithdrawals;

    // Si no hay historial de depósitos pero hay balance, asumir que el balance actual es el depósito inicial
    const effectiveNetDeposited =
      netDeposited > 0 ? netDeposited : currentBalance;
    const totalGains = currentBalance - effectiveNetDeposited;
    const gainPercentage =
      effectiveNetDeposited > 0
        ? (totalGains / effectiveNetDeposited) * 100
        : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("strategies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">Mi Portfolio</h3>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Balance Actual</p>
                <p className="text-xl font-bold">
                  {currentBalance.toFixed(2)} XLM
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Total Depositado
                </p>
                <p className="text-xl font-bold">
                  {effectiveNetDeposited.toFixed(2)} XLM
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gains/Losses Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ganancias/Pérdidas
                </p>
                <p
                  className={`text-lg font-bold ${
                    totalGains >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalGains >= 0 ? "+" : ""}
                  {totalGains.toFixed(2)} XLM
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Rendimiento</p>
                <p
                  className={`text-lg font-bold ${
                    gainPercentage >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {gainPercentage >= 0 ? "+" : ""}
                  {gainPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalles de Estrategia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>APY Actual:</span>
              <span className="font-semibold text-green-600">
                {(currentAPY || 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Depósitos:</span>
              <span className="font-semibold">
                {totalDeposits.toFixed(2)} XLM
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Retiros:</span>
              <span className="font-semibold">
                {totalWithdrawals.toFixed(2)} XLM
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Section */}
        {currentBalance > 0 && (
          <div className="space-y-4">
            <Separator />
            <div>
              <Label htmlFor="withdraw-amount">Cantidad a Retirar (XLM)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Ingresa la cantidad a retirar"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={userBalance}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Disponible: {currentBalance.toFixed(2)} XLM
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setWithdrawAmount(userBalance)}
                variant="outline"
                size="sm"
              >
                Retirar Todo
              </Button>
              <Button
                onClick={() =>
                  setWithdrawAmount((currentBalance / 2).toFixed(2))
                }
                variant="outline"
                size="sm"
              >
                Retirar 50%
              </Button>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retirando...
                </>
              ) : (
                "Retirar Fondos"
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {currentBalance === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No tienes inversiones activas
              </h3>
              <p className="text-muted-foreground mb-4">
                Comienza invirtiendo en una de nuestras estrategias para ver tu
                portfolio aquí.
              </p>
              <Button onClick={() => setViewMode("strategies")}>
                Ver Estrategias
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            DeFindex Strategies
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {viewMode === "strategies" && renderStrategiesView()}
          {viewMode === "invest" && renderInvestView()}
          {viewMode === "portfolio" && renderPortfolioView()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
