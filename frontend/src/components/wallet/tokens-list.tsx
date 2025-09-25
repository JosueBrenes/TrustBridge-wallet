"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Coins, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-full"></div>
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
    )
  }

  return (
    <div className="space-y-1">
      {tokens.length === 0 ? (
        <div className="text-center py-12">
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
            className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-border/50"
            onClick={() => onTokenClick?.(token)}
          >
            <Avatar className="h-12 w-12 border-2 border-muted">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm">
                {token.symbol.slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">{token.symbol}</span>
                {token.symbol === "XLM" && (
                   <Badge variant="secondary" className="text-xs px-2 py-0.5">
                     Native
                   </Badge>
                 )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{token.name}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-foreground text-lg">{formatBalance(token.balance)}</p>
              <div className="flex items-center justify-end gap-2 text-sm mt-1">
                {token.value && (
                  <span className="text-muted-foreground">
                    {formatValue(token.value)}
                  </span>
                )}
                {token.change24h !== undefined && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    token.change24h >= 0 
                      ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30" 
                      : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
                  }`}>
                    {token.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>
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
  )
}