import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { POOLS } from "../lib/config/pools";

export interface PoolData {
    reserveA: number;
    reserveB: number;
    price: number; // tokenB per tokenA
    totalLPSupply: number;
    tvl: number; // Total Value Locked in USD (simplified)
    volume24h: number;
}

/**
 * Hook for fetching real-time pool data
 */
export function usePoolData(poolName: string, refreshInterval: number = 10000) {
    const { connection } = useConnection();
    const program = useProgram();
    const [poolData, setPoolData] = useState<PoolData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch pool reserves and calculate metrics
     */
    const fetchPoolData = useCallback(async () => {
        if (!program) {
            setLoading(false);
            return;
        }

        try {
            const pool = POOLS[poolName];
            if (!pool) {
                throw new Error("Pool not found");
            }

            const poolPubkey = new PublicKey(pool.poolAddress);
            const poolAccount = await program.account.liquidityPool.fetch(poolPubkey);

            // Convert reserves to human-readable numbers
            const reserveA = Number(poolAccount.reserveA) / Math.pow(10, pool.tokenA.decimals);
            const reserveB = Number(poolAccount.reserveB) / Math.pow(10, pool.tokenB.decimals);
            const totalLPSupply = Number(poolAccount.totalLpSupply) / Math.pow(10, 6);

            // Calculate price (tokenB per tokenA)
            const price = reserveA > 0 ? reserveB / reserveA : 0;

            // Simplified TVL calculation (would need price oracle in production)
            // For now, just use reserve amounts
            const tvl = reserveA + reserveB;

            // TODO: Fetch 24h volume from transaction history
            const volume24h = 0;

            setPoolData({
                reserveA,
                reserveB,
                price,
                totalLPSupply,
                tvl,
                volume24h
            });

            setLoading(false);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch pool data");
            setLoading(false);
        }
    }, [program, poolName]);

    /**
     * Get pool price
     */
    const getPoolPrice = useCallback(async (poolName: string): Promise<number> => {
        if (!program) return 0;

        try {
            const pool = POOLS[poolName];
            if (!pool) return 0;

            const poolPubkey = new PublicKey(pool.poolAddress);
            const poolAccount = await program.account.liquidityPool.fetch(poolPubkey);

            const reserveA = Number(poolAccount.reserveA) / Math.pow(10, pool.tokenA.decimals);
            const reserveB = Number(poolAccount.reserveB) / Math.pow(10, pool.tokenB.decimals);

            return reserveA > 0 ? reserveB / reserveA : 0;
        } catch (err) {
            return 0;
        }
    }, [program]);

    /**
     * Get pool TVL
     */
    const getPoolTVL = useCallback(async (poolName: string): Promise<number> => {
        if (!program) return 0;

        try {
            const pool = POOLS[poolName];
            if (!pool) return 0;

            const poolPubkey = new PublicKey(pool.poolAddress);
            const poolAccount = await program.account.liquidityPool.fetch(poolPubkey);

            const reserveA = Number(poolAccount.reserveA) / Math.pow(10, pool.tokenA.decimals);
            const reserveB = Number(poolAccount.reserveB) / Math.pow(10, pool.tokenB.decimals);

            // Simplified TVL (would need USD prices in production)
            return reserveA + reserveB;
        } catch (err) {
            return 0;
        }
    }, [program]);

    /**
     * Get 24h volume (placeholder - would need transaction history)
     */
    const getPool24hVolume = useCallback(async (poolName: string): Promise<number> => {
        // TODO: Implement by fetching and analyzing swap transactions from the last 24h
        // For now, return 0
        return 0;
    }, []);

    // Auto-refresh pool data
    useEffect(() => {
        fetchPoolData();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchPoolData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchPoolData, refreshInterval]);

    return {
        poolData,
        loading,
        error,
        refetch: fetchPoolData,
        getPoolPrice,
        getPoolTVL,
        getPool24hVolume
    };
}
