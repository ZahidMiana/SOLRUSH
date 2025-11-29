"use client";

import { WalletButton } from "@/components/wallet/WalletButton";
import { AddLiquidity } from "@/components/liquidity/AddLiquidity";
import { PoolStats } from "@/components/liquidity/PoolStats";
import Link from "next/link";
import { useState } from "react";

export default function PoolsPage() {
  const [activeTab, setActiveTab] = useState<"add" | "remove" | "stats">("add");

  const pools = [
    { id: "sol-usdc", name: "SOL/USDC", tokenA: "SOL", tokenB: "USDC" },
    { id: "sol-usdt", name: "SOL/USDT", tokenA: "SOL", tokenB: "USDT" },
    { id: "sol-weth", name: "SOL/wETH", tokenA: "SOL", tokenB: "wETH" },
  ];

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
            <Link href="/rewards" className="text-gray-300 hover:text-white transition-colors">
              Rewards
            </Link>
          </div>
          <WalletButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Liquidity Pools</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {["add", "remove", "stats"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "add" | "remove" | "stats")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab === "add" && "Add Liquidity"}
                {tab === "remove" && "Remove Liquidity"}
                {tab === "stats" && "Pool Stats"}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "add" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <AddLiquidity
                  key={pool.id}
                  poolId={pool.id}
                  tokenAName={pool.tokenA}
                  tokenBName={pool.tokenB}
                />
              ))}
            </div>
          )}

          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pools.map((pool) => (
                <PoolStats
                  key={pool.id}
                  poolName={pool.name}
                  tokenAReserve={1000000}
                  tokenBReserve={2000000}
                  lpTokenSupply={1414214}
                  fee={0.25}
                  volume24h={5000000}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
