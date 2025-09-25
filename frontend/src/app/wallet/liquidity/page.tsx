'use client';

import { useWalletStore } from '@/stores/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplets, Plus, Minus, ExternalLink, Info, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function LiquidityPage() {
  const { publicKey, balance } = useWalletStore();
  const [xlmAmount, setXlmAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');

  if (!publicKey) {
    return null; // This will be handled by the layout redirect
  }

  const handleAddLiquidity = () => {
    // TODO: Implement add liquidity logic
    console.log('Adding liquidity:', { xlmAmount, usdcAmount });
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Droplets className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Liquidity Pools</h1>
          </div>
          <p className="text-muted-foreground">
            Provide liquidity to earn trading fees and rewards
          </p>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How Liquidity Pools Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Liquidity pools are smart contracts that hold tokens and enable automated trading. 
              By providing liquidity, you earn a share of trading fees proportional to your contribution.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="text-center p-3 border rounded-lg">
                <Plus className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Add Liquidity</p>
                <p className="text-xs text-muted-foreground">Deposit tokens to earn fees</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Earn Rewards</p>
                <p className="text-xs text-muted-foreground">Get trading fees & incentives</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Minus className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">Remove Anytime</p>
                <p className="text-xs text-muted-foreground">Withdraw your liquidity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Liquidity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* XLM Input */}
              <div className="space-y-2">
                <Label htmlFor="xlm-amount">XLM Amount</Label>
                <div className="relative">
                  <Input
                    id="xlm-amount"
                    type="number"
                    placeholder="0.00"
                    value={xlmAmount}
                    onChange={(e) => setXlmAmount(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                    onClick={() => setXlmAmount(balance?.find(b => b.asset_type === 'native')?.balance || '0')}
                  >
                    MAX
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Balance: {balance?.find(b => b.asset_type === 'native')?.balance ? parseFloat(balance.find(b => b.asset_type === 'native')!.balance).toFixed(2) : '0.00'} XLM
                </p>
              </div>

              {/* USDC Input */}
              <div className="space-y-2">
                <Label htmlFor="usdc-amount">USDC Amount</Label>
                <Input
                  id="usdc-amount"
                  type="number"
                  placeholder="0.00"
                  value={usdcAmount}
                  onChange={(e) => setUsdcAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Balance: 0.00 USDC
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool Share:</span>
                <span>0.00%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LP Tokens:</span>
                <span>0.00</span>
              </div>
            </div>

            <Button 
              onClick={handleAddLiquidity}
              className="w-full"
              disabled={!xlmAmount || !usdcAmount}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Liquidity
            </Button>
          </CardContent>
        </Card>

        {/* Your Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Your Liquidity Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Liquidity Positions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven&apos;t provided liquidity to any pools yet
              </p>
              <Button variant="outline" onClick={() => document.getElementById('xlm-amount')?.focus()}>
                Add Your First Position
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Pools */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Liquidity Pools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {/* XLM/USDC Pool */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        XLM
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                        USDC
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">XLM/USDC</h3>
                      <p className="text-sm text-muted-foreground">Most popular pair</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">24.5% APR</Badge>
                    <p className="text-sm text-muted-foreground mt-1">$2.1M TVL</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Add Liquidity
                </Button>
              </div>

              {/* XLM/yXLM Pool */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        XLM
                      </div>
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white">
                        yXLM
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">XLM/yXLM</h3>
                      <p className="text-sm text-muted-foreground">Yield-bearing XLM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">18.2% APR</Badge>
                    <p className="text-sm text-muted-foreground mt-1">$850K TVL</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Add Liquidity
                </Button>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button 
                variant="ghost" 
                onClick={() => window.open("https://aqua.network", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Pools on Aquarius
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}