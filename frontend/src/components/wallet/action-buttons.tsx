"use client"

import { ArrowUpRight, ArrowDownLeft, Repeat, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionButtonsProps {
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  onBuy?: () => void
  onDeFi?: () => void
  disabled?: boolean
}

export function ActionButtons({ 
  onSend, 
  onReceive, 
  onSwap, 
  onBuy, 
  onDeFi,
  disabled = false 
}: ActionButtonsProps) {
  const actions = [
    {
      label: "Send",
      icon: ArrowUpRight,
      onClick: onSend,
      variant: "default" as const
    },
    {
      label: "Receive",
      icon: ArrowDownLeft,
      onClick: onReceive,
      variant: "outline" as const
    },
    {
      label: "Swap",
      icon: Repeat,
      onClick: onSwap,
      variant: "outline" as const
    },
    {
      label: "Buy",
      icon: Plus,
      onClick: onBuy,
      variant: "outline" as const
    },
    {
      label: "DeFi",
      icon: TrendingUp,
      onClick: onDeFi,
      variant: "outline" as const
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.label}
            variant={action.variant}
            className="flex flex-col gap-2 h-16 md:h-20"
            onClick={action.onClick}
            disabled={disabled}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        )
      })}
    </div>
  )
}