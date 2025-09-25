"use client";

import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Copy, Settings, Bell } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/walletStore";
import { Badge } from "@/components/ui/badge";

interface WalletHeaderProps {
  className?: string;
}

const WalletHeader = ({ className }: WalletHeaderProps) => {
  const { publicKey, isConnected, balance } = useWalletStore();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const totalBalance =
    balance.find((b) => b.asset_type === "native")?.balance || "0";

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-2 transition-all duration-300 ease-in-out group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm sticky top-0 z-40",
        className
      )}
    >
      <div className="flex flex-row w-full justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <SidebarTrigger className="h-10 w-10 z-0 flex-shrink-0" />

          <Breadcrumb className="hidden sm:block flex-1 min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/wallet">Wallet</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-muted-foreground">Dashboard</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {isConnected && (
          <div className="flex gap-3 items-center flex-shrink-0">
            {/* Balance Badge */}
            <Badge
              variant="secondary"
              className="hidden sm:flex items-center gap-2"
            >
              <span className="text-sm font-medium">
                {parseFloat(totalBalance).toFixed(2)} XLM
              </span>
            </Badge>

            {/* Address Display */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <span className="text-sm font-mono text-muted-foreground">
                {formatAddress(publicKey || "")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(publicKey || "")}
                className="h-6 w-6 p-0 hover:bg-background"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default WalletHeader;
