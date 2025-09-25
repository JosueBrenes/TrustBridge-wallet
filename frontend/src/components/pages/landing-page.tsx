"use client";

import { Meteors } from "@/components/ui/meteors";
import { ShimmerButton } from "../ui/shimmer-button";
import Link from "next/link";

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      <Meteors number={30} />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center mb-16">
        <span className="pointer-events-none bg-gradient-to-b from-white to-gray-300/80 bg-clip-text text-center text-6xl md:text-8xl leading-none font-semibold whitespace-pre-wrap text-transparent mb-6">
          TrustBridge
          <br />
          Wallet
        </span>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8">
          The most secure and easy-to-use wallet for the Stellar ecosystem
        </p>
        <Link href="/wallet">
          <ShimmerButton className="shadow-2xl">
            <span>Get Started</span>
          </ShimmerButton>
        </Link>
      </div>
    </div>
  );
}
