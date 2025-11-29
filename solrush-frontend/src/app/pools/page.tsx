'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AddLiquidity } from '@/components/liquidity/AddLiquidity';
import { RemoveLiquidity } from '@/components/liquidity/RemoveLiquidity';
import { PoolCard } from '@/components/ui/pool-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Pools Page - Module 6.4
 * Liquidity pool management with add/remove liquidity and pool browsing
 */
export default function PoolsPage() {
  // Mock pool addresses and data
  const pools = [
    {
      id: 'sol-usdc',
      name: 'SOL/USDC',
      tokens: ['SOL', 'USDC'],
      address: 'PoolSOLUSDC123456789',
      tvl: 1200000,
      apy: 45,
      fee: 0.3,
      volume24h: 5000000,
    },
    {
      id: 'sol-usdt',
      name: 'SOL/USDT',
      tokens: ['SOL', 'USDT'],
      address: 'PoolSOLUSDT123456789',
      tvl: 850000,
      apy: 42,
      fee: 0.3,
      volume24h: 3500000,
    },
    {
      id: 'usdc-usdt',
      name: 'USDC/USDT',
      tokens: ['USDC', 'USDT'],
      address: 'PoolUSDCUSDT123456789',
      tvl: 2100000,
      apy: 15,
      fee: 0.01,
      volume24h: 8000000,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#0a0a2e]">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-400 via-purple-300 to-green-400 bg-clip-text text-transparent mb-2">
            Liquidity Pools
          </h1>
          <p className="text-white/50">
            Provide liquidity to earn from trading fees and protocol rewards
          </p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Pools</TabsTrigger>
            <TabsTrigger value="add">Add Liquidity</TabsTrigger>
            <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
          </TabsList>

          {/* Browse Pools Tab */}
          <TabsContent value="browse" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  token1={{
                    symbol: pool.tokens[0],
                    icon: pool.tokens[0] === 'SOL' ? '◎' : '$',
                    reserve: '1,000,000',
                  }}
                  token2={{
                    symbol: pool.tokens[1],
                    icon: pool.tokens[1] === 'USDC' ? '$' : '₩',
                    reserve: '2,000,000',
                  }}
                  apy={`${pool.apy}%`}
                  tvl={`$${(pool.tvl / 1000000).toFixed(2)}M`}
                  fee={`${pool.fee}%`}
                  onAddLiquidity={() => {
                    // Can be enhanced with routing or state management
                    console.log(`Add liquidity to ${pool.name}`);
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* Add Liquidity Tab */}
          <TabsContent value="add" className="mt-6">
            <div className="flex justify-center">
              <AddLiquidity poolAddress={pools[0].address} />
            </div>
          </TabsContent>

          {/* Remove Liquidity Tab */}
          <TabsContent value="remove" className="mt-6">
            <div className="flex justify-center">
              <RemoveLiquidity poolAddress={pools[0].address} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Pool Stats Summary */}
        <div className="mt-12 p-6 bg-white/5 rounded-lg border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">
            Protocol Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-white/50 text-sm mb-1">Total Value Locked</div>
              <div className="text-2xl font-bold text-white">
                ${pools.reduce((sum, p) => sum + p.tvl, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-white/50 text-sm mb-1">24h Volume</div>
              <div className="text-2xl font-bold text-white">
                ${pools
                  .reduce((sum, p) => sum + p.volume24h, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-white/50 text-sm mb-1">Active Pools</div>
              <div className="text-2xl font-bold text-white">{pools.length}</div>
            </div>
            <div>
              <div className="text-white/50 text-sm mb-1">Average APY</div>
              <div className="text-2xl font-bold text-green-400">
                {(
                  pools.reduce((sum, p) => sum + p.apy, 0) / pools.length
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
