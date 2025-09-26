"use client";

import Footer from "@/components/layout/Footer";
import WalletSidebar from "@/components/layout/WalletSidebar";
import { useWalletStore } from "@/stores/walletStore";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useWalletStore();

  useEffect(() => {
    if (!isConnected) {
      redirect("/");
    }
  }, [isConnected]);

  if (!isConnected) {
    return null;
  }

  return <WalletSidebar>{children}</WalletSidebar>;
}
