'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from '../solana/program';
import { getTokenMint, getTokenDecimals } from '../solana/constants';
import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
} from '@solana/spl-token';

export interface LimitOrder {
    id: string;
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    targetPrice: number;
    status: 'pending' | 'executed' | 'cancelled' | 'expired';
    expiresAt: Date;
    createdAt: Date;
}

interface LPPosition {
    poolId: string;
    lpTokens: number;
    tokenA: string;
    tokenB: string;
    sharePercentage: number;
}

// Real pool addresses from Devnet deployment
const POOL_ADDRESSES: Record<string, string> = {
    'SOL-USDC': '84ZHagR3STya8NGMAV46VPjG7uuTAYS4jJ54m3wjNkey',
    'SOL-USDT': 'DuPZshKxPRDsvMM8YjkumP79UqsSpCbwocu8vvUhGq6h',
    'USDC-USDT': 'Cqr2raQD6Zxu7mtafPxwUYXg298FqVrW2uLyXQQPvgWP',
    'SOL-RUSH': 'GZSVEefVZGTmCs9rbVtbQQm2SVppZJw3U8FGer5zjc1H',
};

/**
 * Custom hook for REAL on-chain liquidity management
 */
export function useLiquidity() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);
    const [loading, setLoading] = useState(false);

    /**
     * Add liquidity to pool - REAL ON-CHAIN TRANSACTION
     */
    const addLiquidity = async (
        tokenA: string,
        tokenB: string,
        amountA: number,
        amountB: number
    ): Promise<{ lpTokens: number; poolId: string; signature: string }> => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            throw new Error('Wallet not connected');
        }

        setLoading(true);

        try {
            const program = getProgram(connection, wallet);

            // Get token mints
            const mintA = getTokenMint(tokenA);
            const mintB = getTokenMint(tokenB);

            // Find pool address
            const poolKey = `${tokenA}-${tokenB}`;
            const reverseKey = `${tokenB}-${tokenA}`;
            const poolAddress = POOL_ADDRESSES[poolKey] || POOL_ADDRESSES[reverseKey];

            if (!poolAddress) {
                throw new Error(`Pool not found for ${poolKey}`);
            }

            const pool = new PublicKey(poolAddress);

            // Fetch pool data
            const poolData = await program.account.liquidityPool.fetch(pool);

            // Get user token accounts
            const userTokenAAccount = await getAssociatedTokenAddress(mintA, wallet.publicKey);
            const userTokenBAccount = await getAssociatedTokenAddress(mintB, wallet.publicKey);
            const userLpTokenAccount = await getAssociatedTokenAddress(
                poolData.lpTokenMint,
                wallet.publicKey
            );

            // Convert amounts to smallest units
            const decimalsA = getTokenDecimals(tokenA);
            const decimalsB = getTokenDecimals(tokenB);
            const amountALamports = Math.floor(amountA * Math.pow(10, decimalsA));
            const amountBLamports = Math.floor(amountB * Math.pow(10, decimalsB));

            // Execute add liquidity instruction
            const tx = await program.methods
                .addLiquidity(
                    new (program as any).BN(amountALamports),
                    new (program as any).BN(amountBLamports)
                )
                .accounts({
                    user: wallet.publicKey,
                    pool: pool,
                    tokenAMint: poolData.tokenAMint,
                    tokenBMint: poolData.tokenBMint,
                    lpTokenMint: poolData.lpTokenMint,
                    tokenAVault: poolData.tokenAVault,
                    tokenBVault: poolData.tokenBVault,
                    userTokenAAccount: userTokenAAccount,
                    userTokenBAccount: userTokenBAccount,
                    userLpTokenAccount: userLpTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                } as any)
                .rpc();

            console.log('Add liquidity transaction:', tx);

            // Calculate LP tokens (simplified - should fetch from transaction)
            const lpTokens = Math.sqrt(amountA * amountB);

            return { lpTokens, poolId: poolKey, signature: tx };
        } catch (err: any) {
            console.error('Add liquidity error:', err);
            throw new Error(err.message || 'Failed to add liquidity');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Remove liquidity from pool - REAL ON-CHAIN TRANSACTION
     */
    const removeLiquidity = async (
        poolId: string,
        lpTokenAmount: number
    ): Promise<{ tokenA: string; tokenB: string; amountA: number; amountB: number; signature: string }> => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            throw new Error('Wallet not connected');
        }

        setLoading(true);

        try {
            const program = getProgram(connection, wallet);

            // Parse pool ID to get tokens
            const [tokenA, tokenB] = poolId.split('-');

            // Get pool address
            const poolAddress = POOL_ADDRESSES[poolId];
            if (!poolAddress) {
                throw new Error(`Pool not found for ${poolId}`);
            }

            const pool = new PublicKey(poolAddress);

            // Fetch pool data
            const poolData = await program.account.liquidityPool.fetch(pool);

            // Get token mints
            const mintA = getTokenMint(tokenA);
            const mintB = getTokenMint(tokenB);

            // Get user token accounts
            const userTokenAAccount = await getAssociatedTokenAddress(mintA, wallet.publicKey);
            const userTokenBAccount = await getAssociatedTokenAddress(mintB, wallet.publicKey);
            const userLpTokenAccount = await getAssociatedTokenAddress(
                poolData.lpTokenMint,
                wallet.publicKey
            );

            // Convert LP amount to smallest units (assuming 9 decimals for LP tokens)
            const lpAmountLamports = Math.floor(lpTokenAmount * Math.pow(10, 9));

            // Execute remove liquidity instruction
            const tx = await program.methods
                .removeLiquidity(new (program as any).BN(lpAmountLamports))
                .accounts({
                    user: wallet.publicKey,
                    pool: pool,
                    tokenAMint: poolData.tokenAMint,
                    tokenBMint: poolData.tokenBMint,
                    lpTokenMint: poolData.lpTokenMint,
                    tokenAVault: poolData.tokenAVault,
                    tokenBVault: poolData.tokenBVault,
                    userTokenAAccount: userTokenAAccount,
                    userTokenBAccount: userTokenBAccount,
                    userLpTokenAccount: userLpTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                } as any)
                .rpc();

            console.log('Remove liquidity transaction:', tx);

            // Calculate returned amounts (simplified)
            const amountA = lpTokenAmount * 0.5;
            const amountB = lpTokenAmount * 50;

            return {
                tokenA,
                tokenB,
                amountA,
                amountB,
                signature: tx,
            };
        } catch (err: any) {
            console.error('Remove liquidity error:', err);
            throw new Error(err.message || 'Failed to remove liquidity');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calculate LP tokens to be minted
     */
    const calculateLPTokens = (
        amountA: number,
        amountB: number,
        existingLPSupply: number = 0
    ): number => {
        if (existingLPSupply === 0) {
            return Math.sqrt(amountA * amountB);
        } else {
            return Math.sqrt(amountA * amountB);
        }
    };

    /**
     * Get user's LP balance for a specific pool - REAL ON-CHAIN DATA
     */
    const getUserLPBalance = async (poolId: string): Promise<number> => {
        if (!wallet.publicKey) return 0;

        try {
            const poolAddress = POOL_ADDRESSES[poolId];
            if (!poolAddress) return 0;

            const program = getProgram(connection, wallet);
            const pool = new PublicKey(poolAddress);
            const poolData = await program.account.liquidityPool.fetch(pool);

            // Get user's LP token account
            const userLpTokenAccount = await getAssociatedTokenAddress(
                poolData.lpTokenMint,
                wallet.publicKey
            );

            // Fetch token account balance
            const balance = await connection.getTokenAccountBalance(userLpTokenAccount);
            return parseFloat(balance.value.uiAmountString || '0');
        } catch (err) {
            console.error('Error fetching LP balance:', err);
            return 0;
        }
    };

    /**
     * Get all user LP positions
     */
    const getAllPositions = (): LPPosition[] => {
        return lpPositions;
    };

    return {
        addLiquidity,
        removeLiquidity,
        calculateLPTokens,
        getUserLPBalance,
        getAllPositions,
        lpPositions,
        loading,
    };
}
