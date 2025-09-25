"use client"

import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"

interface BalanceDisplayProps {
  balance: string
  currency?: string
  isLoading?: boolean
}

export function BalanceDisplay({ balance, currency = "USD", isLoading = false }: BalanceDisplayProps) {
  const [isVisible, setIsVisible] = useState(true)

  const formatBalance = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return "0.00"
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="text-3xl font-bold">
          {isVisible ? (
            `$${formatBalance(balance)} ${currency}`
          ) : (
            "••••••"
          )}
        </div>
      </div>
    </Card>
  )
}