"use client";

import Link from "next/link";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">SolRush DEX</h1>
        <WalletButton />
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
        <div className="max-w-3xl space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold text-white">
            Decentralized Trading on <span className="text-blue-400">Solana</span>
          </h2>

          <p className="text-xl text-gray-300">
            Fast, cheap, and secure token swaps with lightning-fast transactions and minimal fees.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast</h3>
              <p className="text-gray-400">Sub-second transaction processing on Solana</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-lg font-semibold text-white mb-2">Cheap</h3>
              <p className="text-gray-400">Minimal fees - less than $0.01 per swap</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure</h3>
              <p className="text-gray-400">Non-custodial trading with smart contracts</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link
              href="/swap"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Start Trading <ArrowRight size={20} />
            </Link>

            <Link
              href="/pools"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Earn Rewards
            </Link>
          </div>

          {/* Pools Section */}
          <div className="mt-16 pt-12 border-t border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-6">Available Pools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-lg font-semibold text-white">SOL/USDC</p>
                <p className="text-sm text-gray-400">0.25% fee</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-lg font-semibold text-white">SOL/USDT</p>
                <p className="text-sm text-gray-400">0.25% fee</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-lg font-semibold text-white">SOL/wETH</p>
                <p className="text-sm text-gray-400">0.25% fee</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
