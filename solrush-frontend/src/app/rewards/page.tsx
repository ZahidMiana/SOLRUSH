"use client";

import { WalletButton } from "@/components/wallet/WalletButton";
import { RushRewards } from "@/components/rewards/RushRewards";
import { ClaimRewards } from "@/components/rewards/ClaimRewards";
import Link from "next/link";

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold text-blue-400">
          SolRush DEX
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4">
            <Link href="/swap" className="text-gray-300 hover:text-white transition-colors">
              Swap
            </Link>
            <Link href="/pools" className="text-gray-300 hover:text-white transition-colors">
              Pools
            </Link>
          </div>
          <WalletButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="max-w-2xl w-full space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">RUSH Rewards</h1>
            <p className="text-gray-400">Earn RUSH tokens by providing liquidity to our pools</p>
          </div>

          <RushRewards />

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">How it Works</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Provide liquidity to any of our pools</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Earn 80% of trading fees + RUSH rewards</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Claim your RUSH tokens anytime</span>
              </li>
            </ul>
          </div>

          <ClaimRewards />
        </div>
      </main>
    </div>
  );
}
