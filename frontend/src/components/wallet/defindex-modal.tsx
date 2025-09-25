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
import Image from "next/image";

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

interface PortfolioData {
  totalDeposited: number;
  totalWithdrawn: number;
  lastKnownBalance: number;
  transactions: Array<{
    type: 'deposit' | 'withdraw';
    amount: number;
    timestamp: number;
  }>;
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

  // Updated portfolio tracking with proper persistence
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalDeposited: 0,
    totalWithdrawn: 0,
    lastKnownBalance: 0,
    transactions: []
  });

  // Load portfolio data from localStorage
  const loadPortfolioData = () => {
    if (!publicKey) return;
    
    const stored = localStorage.getItem(`defindex_portfolio_${publicKey}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPortfolioData(data);
      } catch (error) {
        console.error('Error loading portfolio data:', error);
      }
    }
  };

  // Save portfolio data to localStorage
  const savePortfolioData = (data: PortfolioData) => {
    if (!publicKey) return;
    
    localStorage.setItem(`defindex_portfolio_${publicKey}`, JSON.stringify(data));
    setPortfolioData(data);
  };

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
    if (isOpen && publicKey) {
      loadPortfolioData();
      loadData();
    }
  }, [isOpen, publicKey]);

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

      // Update portfolio tracking with proper transaction history
      const newTransaction = {
        type: 'deposit' as const,
        amount: amount,
        timestamp: Date.now()
      };

      const updatedPortfolioData = {
        ...portfolioData,
        totalDeposited: portfolioData.totalDeposited + amount,
        transactions: [...portfolioData.transactions, newTransaction]
      };

      savePortfolioData(updatedPortfolioData);

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

      // Update portfolio tracking with proper transaction history
      const newTransaction = {
        type: 'withdraw' as const,
        amount: amount,
        timestamp: Date.now()
      };

      const updatedPortfolioData = {
        ...portfolioData,
        totalWithdrawn: portfolioData.totalWithdrawn + amount,
        transactions: [...portfolioData.transactions, newTransaction]
      };

      savePortfolioData(updatedPortfolioData);

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
              {selectedStrategy?.risk} Risk
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <Label className="mb-2" htmlFor="invest-amount">
            Amount to Invest (XLM)
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
    
    // Calculate proper gains/losses based on tracked deposits and withdrawals
    const netDeposited = portfolioData.totalDeposited - portfolioData.totalWithdrawn;
    
    // If we have no transaction history but have a balance, this might be an existing investment
    // In this case, we'll treat the current balance as the initial deposit for calculation purposes
    const effectiveNetDeposited = netDeposited > 0 ? netDeposited : 
      (currentBalance > 0 && portfolioData.totalDeposited === 0 ? currentBalance : netDeposited);
    
    const totalGains = currentBalance - effectiveNetDeposited;
    const gainPercentage = effectiveNetDeposited > 0 ? (totalGains / effectiveNetDeposited) * 100 : 0;

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
          <h3 className="text-lg font-semibold">My Portfolio</h3>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Balance</p>
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
                  Net Deposited Total
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
                  Gains/Losses
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
                <p className="text-sm text-muted-foreground">Performance</p>
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
            <CardTitle className="text-base">Strategy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Current APY:</span>
              <span className="font-semibold text-green-600">
                {(currentAPY || 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Deposits:</span>
              <span className="font-semibold">
                {portfolioData.totalDeposited.toFixed(2)} XLM
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Withdrawals:</span>
              <span className="font-semibold">
                {portfolioData.totalWithdrawn.toFixed(2)} XLM
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        {portfolioData.transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {portfolioData.transactions.slice(-5).reverse().map((tx, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className={tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toFixed(2)} XLM
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Withdraw Section */}
        {currentBalance > 0 && (
          <div className="space-y-4">
            <Separator className="my-6" />
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                💰 Withdraw Funds
              </h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="withdraw-amount" className="text-blue-800 font-medium">
                    Amount to Withdraw (XLM)
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={userBalance}
                    className="mt-1 border-blue-200 focus:border-blue-400"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    💎 Available: {currentBalance.toFixed(2)} XLM
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setWithdrawAmount(userBalance)}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Withdraw All
                  </Button>
                  <Button
                    onClick={() =>
                      setWithdrawAmount((currentBalance / 2).toFixed(2))
                    }
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Withdraw 50%
                  </Button>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={isLoading || !withdrawAmount}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    "🚀 Withdraw Funds"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {currentBalance === 0 && (
          <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800">
                🌟 No Active Investments
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Start investing in one of our DeFindex strategies to grow your portfolio intelligently.
              </p>
              <Button 
                onClick={() => setViewMode("strategies")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                🚀 View Strategies
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
            <Image 
              src="/defindex.png" 
              alt="DeFindex" 
              width={20} 
              height={20}
              className="rounded-sm"
            />
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
