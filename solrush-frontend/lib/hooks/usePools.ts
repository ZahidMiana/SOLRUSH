'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { TOKENS } from '../constants';
import { findPoolAddress } from '../anchor/pda';

export interface PoolInfo {
    id: string;
    name: string;
    tokens: string[];
    address: string;
    tvl: number;
    apy: number;
    fee: number;
    volume24h: number;
    reserveA: number;
    reserveB: number;
    totalLpSupply: number;
    isLoaded: boolean;
}

// Default pool configurations
const DEFAULT_POOLS = [
    { id: 'sol-usdc', name: 'SOL/USDC', tokens: ['SOL', 'USDC'], tokenMintA: TOKENS.SOL, tokenMintB: TOKENS.USDC },
    { id: 'sol-usdt', name: 'SOL/USDT', tokens: ['SOL', 'USDT'], tokenMintA: TOKENS.SOL, tokenMintB: TOKENS.USDT },
    { id: 'usdc-usdt', name: 'USDC/USDT', tokens: ['USDC', 'USDT'], tokenMintA: TOKENS.USDC, tokenMintB: TOKENS.USDT },
];

// Estimated SOL price in USD for TVL calculation
const SOL_PRICE_USD = 100;

/**
 * Custom hook for fetching and managing pool data
 * Attempts to fetch real pool data from the blockchain, falls back to defaults
 */
export const usePools = () => {
    const { connection } = useConnection();
    const [loading, setLoading] = useState(true);
    const [pools, setPools] = useState<PoolInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch pool account data from the blockchain
     */
    const fetchPoolData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const poolsData = await Promise.all(
                DEFAULT_POOLS.map(async (poolConfig) => {
                    const poolAddress = findPoolAddress(poolConfig.tokenMintA, poolConfig.tokenMintB);
                    const addressStr = poolAddress.toBase58();
                    
                    try {
                        // Try to fetch the pool account from the blockchain
                        const accountInfo = await connection.getAccountInfo(poolAddress);
                        
                        if (accountInfo && accountInfo.data) {
                            // Parse LiquidityPool account data
                            // Account layout based on state.rs:
                            // 8 bytes discriminator + 32*6 pubkeys + 8*5 u64s + 1 byte bump
                            const data = accountInfo.data;
                            
                            // Skip 8-byte discriminator + 32*6 = 200 bytes for pubkeys
                            const offset = 8 + 32 * 6;
                            
                            // Read reserve_a (8 bytes)
                            const reserveA = Number(data.readBigUInt64LE(offset));
                            // Read reserve_b (8 bytes)
                            const reserveB = Number(data.readBigUInt64LE(offset + 8));
                            // Read total_lp_supply (8 bytes)
                            const totalLpSupply = Number(data.readBigUInt64LE(offset + 16));
                            // Read fee_numerator (8 bytes)
                            const feeNumerator = Number(data.readBigUInt64LE(offset + 24));
                            // Read fee_denominator (8 bytes)
                            const feeDenominator = Number(data.readBigUInt64LE(offset + 32));
                            
                            // Calculate TVL (assuming token A is SOL or stablecoin)
                            const reserveANormalized = reserveA / 1e9; // Assuming 9 decimals
                            const reserveBNormalized = reserveB / 1e6; // Assuming 6 decimals for USDC/USDT
                            
                            const tvl = poolConfig.tokens[0] === 'SOL' 
                                ? (reserveANormalized * SOL_PRICE_USD) + reserveBNormalized
                                : reserveANormalized + reserveBNormalized;
                            
                            // Calculate fee percentage
                            const fee = feeDenominator > 0 ? (feeNumerator / feeDenominator) * 100 : 0.3;
                            
                            // Estimate APY based on pool activity (simplified)
                            const apy = tvl > 0 ? Math.min(50, (5000000 / tvl) * 100) : 0;

                            return {
                                id: poolConfig.id,
                                name: poolConfig.name,
                                tokens: poolConfig.tokens,
                                address: addressStr,
                                tvl,
                                apy,
                                fee,
                                volume24h: tvl * 0.1, // Estimated as 10% of TVL
                                reserveA: reserveANormalized,
                                reserveB: reserveBNormalized,
                                totalLpSupply: totalLpSupply / 1e9,
                                isLoaded: true,
                            };
                        }
                    } catch (fetchError) {
                        console.warn(`Failed to fetch pool ${poolConfig.name}:`, fetchError);
                    }
                    
                    // Return default/mock data if pool not found on-chain
                    return getDefaultPoolData(poolConfig, addressStr);
                })
            );
            
            setPools(poolsData);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch pools';
            console.error('Error fetching pools:', errorMsg);
            setError(errorMsg);
            
            // Fall back to default pool data
            setPools(DEFAULT_POOLS.map(poolConfig => {
                const poolAddress = findPoolAddress(poolConfig.tokenMintA, poolConfig.tokenMintB);
                return getDefaultPoolData(poolConfig, poolAddress.toBase58());
            }));
        } finally {
            setLoading(false);
        }
    }, [connection]);

    /**
     * Get default pool data when on-chain data is unavailable
     */
    const getDefaultPoolData = (
        poolConfig: typeof DEFAULT_POOLS[0], 
        address: string
    ): PoolInfo => {
        const defaultTvl = poolConfig.id === 'sol-usdc' ? 1200000 
            : poolConfig.id === 'sol-usdt' ? 850000 
            : 2100000;
        const defaultApy = poolConfig.id === 'usdc-usdt' ? 15 : 45;
        const defaultFee = poolConfig.id === 'usdc-usdt' ? 0.01 : 0.3;
        
        return {
            id: poolConfig.id,
            name: poolConfig.name,
            tokens: poolConfig.tokens,
            address,
            tvl: defaultTvl,
            apy: defaultApy,
            fee: defaultFee,
            volume24h: defaultTvl * 0.1,
            reserveA: defaultTvl / (2 * SOL_PRICE_USD),
            reserveB: defaultTvl / 2,
            totalLpSupply: 10000,
            isLoaded: false,
        };
    };

    // Fetch pool data on mount and when connection changes
    useEffect(() => {
        fetchPoolData();
    }, [fetchPoolData]);

    /**
     * Refresh pool data
     */
    const refreshPools = useCallback(() => {
        fetchPoolData();
    }, [fetchPoolData]);

    const handleAddLiquidity = (poolName: string) => {
        console.log(`Add liquidity to ${poolName}`);
    };

    return {
        pools,
        loading,
        error,
        handleAddLiquidity,
        refreshPools,
    };
};
