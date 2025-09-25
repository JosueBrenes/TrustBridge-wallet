'use client';

import { useWalletStore } from '@/stores/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Info, ExternalLink } from 'lucide-react';

export default function StakingPage() {
  const { publicKey } = useWalletStore();

  if (!publicKey) {
    return null; // This will be handled by the layout redirect
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Staking</h1>
          </div>
          <p className="text-muted-foreground">
            Earn rewards by staking your XLM and participating in the Stellar network
          </p>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About Staking on Stellar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stellar uses a unique consensus mechanism called Stellar Consensus Protocol (SCP). 
              While traditional staking isn&apos;t available, you can participate in the network through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Running a validator node</li>
              <li>Participating in liquidity pools</li>
              <li>Using DeFi protocols built on Stellar</li>
            </ul>
          </CardContent>
        </Card>

        {/* Available Options */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Liquidity Pools */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Liquidity Pools</CardTitle>
              <Badge variant="secondary" className="w-fit">
                Available
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Provide liquidity to AMM pools and earn trading fees
              </p>
              <Button variant="outline" className="w-full">
                Explore Pools
              </Button>
            </CardContent>
          </Card>

          {/* Validator Node */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Run a Validator</CardTitle>
              <Badge variant="outline" className="w-fit">
                Advanced
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Participate in consensus by running your own validator node
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open("https://developers.stellar.org/docs/run-core-node", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* DeFi Protocols */}
        <Card>
          <CardHeader>
            <CardTitle>DeFi Staking Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Blend Protocol */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Blend Protocol</h3>
                  <Badge variant="secondary">Lending</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lend your assets and earn interest on Stellar&apos;s premier lending protocol
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open("https://blend.capital", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Blend
                </Button>
              </div>

              {/* Aquarius */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Aquarius</h3>
                  <Badge variant="secondary">AMM</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Provide liquidity to automated market maker pools
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open("https://aqua.network", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Aquarius
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">More Staking Options Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;re working on integrating more staking and yield opportunities directly into TrustBridge
            </p>
          </CardContent>
        </Card>
      </div>
  );
}