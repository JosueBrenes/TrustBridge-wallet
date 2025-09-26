"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  // Don't show footer on root page (/) or wallet pages (they have their own layout)
  const shouldShowFooter = pathname !== "/" && !pathname.startsWith("/wallet");

  return (
    <>
      <div className="flex-1">
        {children}
      </div>
      {shouldShowFooter && <Footer />}
    </>
  );
}