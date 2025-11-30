'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AddLiquidity } from '@/components/liquidity/AddLiquidity';
import { RemoveLiquidity } from '@/components/liquidity/RemoveLiquidity';
import { PoolCard } from '@/components/ui/pool-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SolIcon, UsdcIcon, UsdtIcon } from '@/components/icons/TokenIcons';
import { PoolInfo } from '@/lib/hooks/usePools';

interface PoolsViewProps {
    pools: PoolInfo[];
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
}

const getTokenIcon = (symbol: string) => {
    switch (symbol) {
        case 'SOL': return <SolIcon className="w-8 h-8" />;
        case 'USDC': return <UsdcIcon className="w-8 h-8" />;
        case 'USDT': return <UsdtIcon className="w-8 h-8" />;
        default: return <span className="text-2xl">?</span>;
    }
};

const formatReserve = (reserve: number): string => {
    if (reserve >= 1000000) {
        return `${(reserve / 1000000).toFixed(2)}M`;
    } else if (reserve >= 1000) {
        return `${(reserve / 1000).toFixed(2)}K`;
    }
    return reserve.toFixed(2);
};

export const PoolsView: React.FC<PoolsViewProps> = ({ pools, loading, error, onRefresh }) => {
    const handleAddLiquidity = (poolName: string) => {
        console.log(`Navigate to add liquidity for ${poolName}`);
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden selection:bg-purple-500/30">
            <Navbar />

            {/* Background Glow */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
                        Liquidity Pools
                    </h1>
                    <p className="text-white/40 text-lg max-w-2xl mx-auto">
                        Provide liquidity to earn from trading fees and protocol rewards
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-center justify-between">
                        <span>{error}</span>
                        {onRefresh && (
                            <button 
                                onClick={onRefresh}
                                className="px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                )}

                <Tabs defaultValue="browse" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-xl">
                        <TabsTrigger value="browse" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Browse Pools</TabsTrigger>
                        <TabsTrigger value="add" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Add Liquidity</TabsTrigger>
                        <TabsTrigger value="remove" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Remove Liquidity</TabsTrigger>
                    </TabsList>

                    {/* Browse Pools Tab */}
                    <TabsContent value="browse" className="space-y-6 mt-8">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                <span className="ml-3 text-white/60">Loading pools...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pools.map((pool) => (
                                    <PoolCard
                                        key={pool.id}
                                        token1={{
                                            symbol: pool.tokens[0],
                                            icon: getTokenIcon(pool.tokens[0]),
                                            reserve: formatReserve(pool.reserveA || 0),
                                        }}
                                        token2={{
                                            symbol: pool.tokens[1],
                                            icon: getTokenIcon(pool.tokens[1]),
                                            reserve: formatReserve(pool.reserveB || 0),
                                        }}
                                        apy={`${pool.apy}%`}
                                        tvl={pool.tvl > 0 ? `$${(pool.tvl / 1000000).toFixed(2)}M` : 'N/A'}
                                        fee={`${pool.fee}%`}
                                        onAddLiquidity={() => handleAddLiquidity(pool.name)}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* Refresh button */}
                        {onRefresh && !loading && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={onRefresh}
                                    className="px-6 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                                >
                                    Refresh Pool Data
                                </button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Add Liquidity Tab */}
                    <TabsContent value="add" className="mt-8">
                        <div className="flex justify-center">
                            {pools.length > 0 ? (
                                <AddLiquidity poolAddress={pools[0].address} />
                            ) : (
                                <div className="text-white/40">No pools available</div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Remove Liquidity Tab */}
                    <TabsContent value="remove" className="mt-8">
                        <div className="flex justify-center">
                            {pools.length > 0 ? (
                                <RemoveLiquidity poolAddress={pools[0].address} />
                            ) : (
                                <div className="text-white/40">No pools available</div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Pool Stats Summary */}
                <div className="mt-16 p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Protocol Statistics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-white/40 text-sm mb-2">Total Value Locked</div>
                            <div className="text-3xl font-black text-white">
                                ${pools.reduce((sum, p) => sum + (p.tvl || 0), 0).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-white/40 text-sm mb-2">24h Volume</div>
                            <div className="text-3xl font-black text-white">
                                ${pools
                                    .reduce((sum, p) => sum + (p.volume24h || 0), 0)
                                    .toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-white/40 text-sm mb-2">Active Pools</div>
                            <div className="text-3xl font-black text-white">{pools.length}</div>
                        </div>
                        <div>
                            <div className="text-white/40 text-sm mb-2">Average APY</div>
                            <div className="text-3xl font-black text-green-400">
                                {pools.length > 0 ? (
                                    pools.reduce((sum, p) => sum + (p.apy || 0), 0) / pools.length
                                ).toFixed(1) : 0}
                                %
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
