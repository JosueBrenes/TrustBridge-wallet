"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/stores/walletStore";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Wallet,
  CreditCard,
  ArrowUpDown,
  TrendingUp,
  Settings,
  Shield,
  History,
  ChevronRight,
  BookOpen,
  ChevronsUpDown,
  CircleHelp,
  LucideIcon,
  LogOut,
  User,
  Coins,
  Send,
  QrCode,
} from "lucide-react";
import WalletHeader from "./WalletHeader";

interface WalletSidebarProps {
  children?: React.ReactNode;
}

// Team data for header
const teams = [
  {
    name: "TrustBridge",
    logo: "/logo.png",
    plan: "Secure Stellar Wallet",
  },
];

// Type for teams
type Team = {
  name: string;
  logo: string;
  plan: string;
};

// Types for navigation items
interface SubItem {
  title: string;
  url: string;
  isExternal?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isExpandable?: boolean;
  isExternal?: boolean;
  items?: SubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Navigation groups structure for wallet
const navGroups: NavGroup[] = [
  {
    label: "Wallet",
    items: [
      {
        title: "Dashboard",
        url: "/wallet",
        icon: Wallet,
        isActive: true,
        isExpandable: false,
      },
      {
        title: "Assets",
        url: "/wallet/assets",
        icon: Coins,
        isExpandable: false,
      },
    ],
  },
  {
    label: "Transactions",
    items: [
      {
        title: "Send",
        url: "/wallet/send",
        icon: Send,
        isExpandable: false,
      },
      {
        title: "Receive",
        url: "/wallet/receive",
        icon: QrCode,
        isExpandable: false,
      },
      {
        title: "Swap",
        url: "/wallet/swap",
        icon: ArrowUpDown,
        isExpandable: false,
      },
      {
        title: "History",
        url: "/wallet/history",
        icon: History,
        isExpandable: false,
      },
    ],
  },
  {
    label: "DeFi",
    items: [
      {
        title: "Staking",
        url: "/wallet/staking",
        icon: TrendingUp,
        isExpandable: false,
      },
      {
        title: "Liquidity",
        url: "/wallet/liquidity",
        icon: CreditCard,
        isExpandable: false,
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        title: "Resources",
        url: "#",
        icon: BookOpen,
        isExpandable: true,
        items: [
          {
            title: "Documentation",
            url: "",
            isExternal: true,
          },
          {
            title: "Stellar Expert",
            url: "https://stellar.expert/explorer/testnet",
            isExternal: true,
          },
          {
            title: "Website",
            url: "",
            isExternal: true,
          },
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Security",
        url: "/wallet/security",
        icon: Shield,
        isExpandable: false,
      },
      {
        title: "Settings",
        url: "/wallet/settings",
        icon: Settings,
        isExpandable: false,
      },
      {
        title: "Help",
        url: "/wallet/help",
        icon: CircleHelp,
        isExpandable: false,
      },
    ],
  },
];

function TeamSwitcher({ teams }: { teams: Team[] }) {
  const [activeTeam] = useState(teams[0]);

  return (
    <SidebarMenu className="mt-2">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Link href="/dashboard">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Image
                  width={40}
                  height={40}
                  src={activeTeam.logo}
                  alt={activeTeam.name}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeTeam.name}
                  </span>
                  <span className="truncate text-xs">{activeTeam.plan}</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Navigation Main Component
function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  const isItemActive = (itemUrl: string) => {
    if (itemUrl === "#") return false;
    if (itemUrl.startsWith("http")) return false;
    if (itemUrl === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === itemUrl || pathname.startsWith(itemUrl);
  };

  const isSubItemActive = (subItemUrl: string) => {
    if (subItemUrl.startsWith("http")) return false;
    return pathname === subItemUrl;
  };

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.isExpandable ? (
                  <Collapsible
                    defaultOpen={
                      group.label === "Resources" ||
                      group.label === "Credentials"
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubItemActive(subItem.url)}
                            >
                              <Link
                                href={subItem.url}
                                target={
                                  subItem.isExternal ? "_blank" : undefined
                                }
                                rel={
                                  subItem.isExternal
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                {subItem.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
                    <Link
                      href={item.url}
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noopener noreferrer" : undefined}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

// Navigation User Component
function NavUser() {
  const { disconnect, publicKey } = useWalletStore();

  const user = {
    name: "User",
    address: publicKey
      ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
      : "No wallet connected",
    avatar: "",
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">U</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.address}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">U</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.address}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/profile">
                <DropdownMenuItem>
                  <User />
                  Profile
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={disconnect}>
                <LogOut />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Main App Sidebar Component
function AppSidebar() {
  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  );
}

export default function Sidebar({ children }: AppSidebarProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen bg-transparent">
        <WalletHeader />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
