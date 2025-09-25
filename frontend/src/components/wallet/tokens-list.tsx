"use client"

import { Star, TrendingUp, TrendingDown, Coins, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Token {
  symbol: string
  name: string
  balance: string
  value?: string
  change24h?: number
  icon?: string
}

interface TokensListProps {
  tokens: Token[]
  isLoading?: boolean
  onTokenClick?: (token: Token) => void
}

export function TokensList({ tokens, isLoading = false, onTokenClick }: TokensListProps) {
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (isNaN(num)) return "0.00"
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })
  }

  const formatValue = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return "$0.00"
    return `$${num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tokens</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-semibold">Tokens</h3>
           <Button variant="ghost" size="sm">
             <Star className="h-4 w-4 mr-1" />
             Favorites
           </Button>
         </div>

        <div className="space-y-2">
          {tokens.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Coins className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tokens found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your wallet doesn&apos;t have any tokens yet
              </p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Token
              </Button>
            </div>
          ) : (
            tokens.map((token) => (
              <div
                key={token.symbol}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onTokenClick?.(token)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {token.symbol.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    {token.symbol === "XLM" && (
                       <Badge variant="secondary" className="text-xs">
                         Native
                       </Badge>
                     )}
                  </div>
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                </div>

                <div className="text-right">
                  <p className="font-medium">{formatBalance(token.balance)}</p>
                  <div className="flex items-center gap-1 text-sm">
                    {token.value && (
                      <span className="text-muted-foreground">
                        {formatValue(token.value)}
                      </span>
                    )}
                    {token.change24h !== undefined && (
                      <div className={`flex items-center gap-1 ${
                        token.change24h >= 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {token.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs">
                          {Math.abs(token.change24h).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}