'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKENS } from '../constants';
import { findPoolAddress } from '../anchor/pda';
import { getProgram, PROGRAM_ID } from '../anchor/setup';

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
    tokenAMint: string;
    tokenBMint: string;
}

interface LiquidityPoolAccount {
    authority: PublicKey;
    tokenAMint: PublicKey;
    tokenBMint: PublicKey;
    tokenAVault: PublicKey;
    tokenBVault: PublicKey;
    poolMint: PublicKey;
    name: string;
    feeBasisPoints: number;
    tokenAReserve: { toNumber: () => number };
    tokenBReserve: { toNumber: () => number };
    bump: number;
}

// Token symbols mapping
const TOKEN_SYMBOLS: { [key: string]: string } = {
    [TOKENS.SOL.toBase58()]: 'SOL',
    [TOKENS.USDC.toBase58()]: 'USDC',
    [TOKENS.USDT.toBase58()]: 'USDT',
    [TOKENS.RUSH.toBase58()]: 'RUSH',
};

// Default/fallback pools when blockchain data is unavailable
const getDefaultPools = (): PoolInfo[] => {
    const solUsdcPool = findPoolAddress(TOKENS.SOL, TOKENS.USDC).toBase58();
    const solUsdtPool = findPoolAddress(TOKENS.SOL, TOKENS.USDT).toBase58();
    const usdcUsdtPool = findPoolAddress(TOKENS.USDC, TOKENS.USDT).toBase58();

    return [
        {
            id: 'sol-usdc',
            name: 'SOL/USDC',
            tokens: ['SOL', 'USDC'],
            address: solUsdcPool,
            tvl: 0,
            apy: 0,
            fee: 0.3,
            volume24h: 0,
            reserveA: 0,
            reserveB: 0,
            tokenAMint: TOKENS.SOL.toBase58(),
            tokenBMint: TOKENS.USDC.toBase58(),
        },
        {
            id: 'sol-usdt',
            name: 'SOL/USDT',
            tokens: ['SOL', 'USDT'],
            address: solUsdtPool,
            tvl: 0,
            apy: 0,
            fee: 0.3,
            volume24h: 0,
            reserveA: 0,
            reserveB: 0,
            tokenAMint: TOKENS.SOL.toBase58(),
            tokenBMint: TOKENS.USDT.toBase58(),
        },
        {
            id: 'usdc-usdt',
            name: 'USDC/USDT',
            tokens: ['USDC', 'USDT'],
            address: usdcUsdtPool,
            tvl: 0,
            apy: 0,
            fee: 0.01,
            volume24h: 0,
            reserveA: 0,
            reserveB: 0,
            tokenAMint: TOKENS.USDC.toBase58(),
            tokenBMint: TOKENS.USDT.toBase58(),
        },
    ];
};

export const usePools = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [pools, setPools] = useState<PoolInfo[]>(getDefaultPools());
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all liquidity pool accounts from the blockchain
     */
    const fetchPools = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch all pool accounts from the program
            // Note: We try multiple data sizes to handle different pool account versions
            // In production, you might want to use the program's account discriminator instead
            const dataSizesToTry = [256, 280, 320]; // Common sizes for pool accounts
            let poolAccounts: { pubkey: PublicKey; account: { data: Buffer } }[] = [];
            
            for (const dataSize of dataSizesToTry) {
                try {
                    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                        filters: [
                            { dataSize },
                        ],
                    });
                    if (accounts.length > 0) {
                        poolAccounts = accounts;
                        break;
                    }
                } catch {
                    console.warn(`No pools found with dataSize ${dataSize}`);
                }
            }

            if (poolAccounts.length === 0) {
                // No pools found on-chain, return default pools with zero values
                setPools(getDefaultPools());
                return;
            }

            // If we have a connected wallet, we can use the program to decode accounts
            if (wallet.publicKey) {
                try {
                    const program = getProgram(connection, wallet);
                    const decodedPools: PoolInfo[] = [];

                    for (const { pubkey, account } of poolAccounts) {
                        try {
                            const poolData = program.coder.accounts.decode<LiquidityPoolAccount>(
                                'LiquidityPool',
                                account.data
                            );

                            const tokenASymbol = TOKEN_SYMBOLS[poolData.tokenAMint.toBase58()] || 'Unknown';
                            const tokenBSymbol = TOKEN_SYMBOLS[poolData.tokenBMint.toBase58()] || 'Unknown';

                            // Calculate TVL (simplified - assumes 1:1 USD for USDC/USDT, needs price feed for SOL)
                            const reserveA = poolData.tokenAReserve.toNumber() / 1e9; // Assuming 9 decimals
                            const reserveB = poolData.tokenBReserve.toNumber() / 1e6; // USDC/USDT have 6 decimals

                            // Simplified TVL calculation
                            const solPrice = 100; // TODO: Fetch real SOL price
                            const tvl = tokenASymbol === 'SOL' 
                                ? (reserveA * solPrice) + reserveB 
                                : reserveA + reserveB;

                            decodedPools.push({
                                id: `${tokenASymbol.toLowerCase()}-${tokenBSymbol.toLowerCase()}`,
                                name: poolData.name || `${tokenASymbol}/${tokenBSymbol}`,
                                tokens: [tokenASymbol, tokenBSymbol],
                                address: pubkey.toBase58(),
                                tvl,
                                apy: 0, // TODO: Calculate from historical fees
                                fee: poolData.feeBasisPoints / 10000 * 100, // Convert basis points to percentage
                                volume24h: 0, // TODO: Track from events
                                reserveA,
                                reserveB,
                                tokenAMint: poolData.tokenAMint.toBase58(),
                                tokenBMint: poolData.tokenBMint.toBase58(),
                            });
                        } catch (decodeError) {
                            console.warn('Failed to decode pool account:', pubkey.toBase58(), decodeError);
                        }
                    }

                    if (decodedPools.length > 0) {
                        setPools(decodedPools);
                    } else {
                        setPools(getDefaultPools());
                    }
                } catch (programError) {
                    console.warn('Failed to decode pools with program, using defaults:', programError);
                    setPools(getDefaultPools());
                }
            } else {
                // No wallet connected, use default pools
                setPools(getDefaultPools());
            }
        } catch (fetchError) {
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to fetch pools';
            console.error('Error fetching pools:', errorMessage);
            setError(errorMessage);
            // Fallback to default pools
            setPools(getDefaultPools());
        } finally {
            setLoading(false);
        }
    }, [connection, wallet]);

    // Fetch pools on mount and when wallet/connection changes
    useEffect(() => {
        fetchPools();
    }, [fetchPools]);

    /**
     * Get pool by address
     */
    const getPoolByAddress = useCallback((address: string): PoolInfo | undefined => {
        return pools.find(pool => pool.address === address);
    }, [pools]);

    /**
     * Get pool by token pair
     */
    const getPoolByTokens = useCallback((tokenA: string, tokenB: string): PoolInfo | undefined => {
        return pools.find(pool => 
            (pool.tokens[0] === tokenA && pool.tokens[1] === tokenB) ||
            (pool.tokens[0] === tokenB && pool.tokens[1] === tokenA)
        );
    }, [pools]);

    /**
     * Refresh pool data
     */
    const refreshPools = useCallback(() => {
        fetchPools();
    }, [fetchPools]);

    return {
        pools,
        loading,
        error,
        getPoolByAddress,
        getPoolByTokens,
        refreshPools,
    };
};
