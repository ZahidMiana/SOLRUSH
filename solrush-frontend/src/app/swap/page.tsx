"use client";

import { WalletButton } from "@/components/wallet/WalletButton";
import { SwapInterface } from "@/components/trading/SwapInterface";
import Link from "next/link";

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold text-blue-400">
          SolRush DEX
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4">
            <Link href="/pools" className="text-gray-300 hover:text-white transition-colors">
              Pools
            </Link>
            <Link href="/rewards" className="text-gray-300 hover:text-white transition-colors">
              Rewards
            </Link>
          </div>
          <WalletButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Swap Tokens</h1>
          <SwapInterface />
        </div>
      </main>
    </div>
  );
}
