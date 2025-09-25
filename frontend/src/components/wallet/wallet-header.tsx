"use client";

import { Copy, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WalletHeaderProps {
  publicKey?: string | null;
  onCopy: (text: string) => void;
}

export function WalletHeader({ publicKey, onCopy }: WalletHeaderProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          {publicKey && (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium font-mono">
                {truncateAddress(publicKey)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => onCopy(publicKey)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
