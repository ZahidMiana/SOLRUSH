'use client';

import React from 'react';
import { usePools } from '@/lib/hooks/usePools';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplet } from 'lucide-react';

/**
 * Pools Page - Liquidity pool management
 */
export default function PoolsPage() {
  const { pools, loading } = usePools();
  const [selectedPool, setSelectedPool] = React.useState<string | null>(null);
  const [amountA, setAmountA] = React.useState('');
  const [amountB, setAmountB] = React.useState('');

  const selected = pools.find(p => p.id === selectedPool);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Navbar />

      {/* Background */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 min-h-screen pt-24 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Liquidity Pools
            </h1>
            <p className="text-white/40 text-lg">
              Add liquidity to earn fees and rewards
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pool List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">All Pools</h2>
              {loading ? (
                <div className="text-white/40">Loading pools...</div>
              ) : (
                pools.map((pool) => (
                  <Card
                    key={pool.id}
                    className={`p-6 cursor-pointer transition ${selectedPool === pool.id
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    onClick={() => setSelectedPool(pool.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          <Droplet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{pool.name}</h3>
                          <p className="text-sm text-white/40">
                            {pool.tokens.join('/')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/40">TVL</p>
                        <p className="text-white font-semibold">${pool.tvl.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/40">APY</p>
                        <p className="text-white font-semibold">{pool.apy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-white/40">Reserve {pool.tokens[0]}</p>
                        <p className="text-white font-semibold">{pool.reserveA.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Reserve {pool.tokens[1]}</p>
                        <p className="text-white font-semibold">{pool.reserveB.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Add Liquidity */}
            <div>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {selected ? `Add Liquidity - ${selected.name}` : 'Select a Pool'}
                </h2>

                {selected ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">
                        Amount {selected.tokens[0]}
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amountA}
                        onChange={(e) => setAmountA(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/60">
                        Amount {selected.tokens[1]}
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between text-white/60">
                        <span>Current Price:</span>
                        <span>{(selected.reserveB / selected.reserveA).toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Pool Share:</span>
                        <span>~0.1%</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => alert('Add liquidity feature coming soon!')}
                      disabled={!amountA || !amountB}
                      className="w-full"
                    >
                      <Droplet className="w-4 h-4 mr-2" />
                      Add Liquidity
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-white/40 py-12">
                    Select a pool to add liquidity
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
