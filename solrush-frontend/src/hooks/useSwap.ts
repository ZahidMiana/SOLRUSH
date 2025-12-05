import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { POOLS } from "../lib/config/pools";

export interface SwapParams {
    poolName: string;
    amountIn: number;
    minAmountOut: number;
    isAToB: boolean; // true = tokenA to tokenB, false = tokenB to tokenA
}

export interface SwapResult {
    signature: string;
    amountOut: number;
}

/**
 * Hook for swap functionality
 */
export function useSwap() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const program = useProgram();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Calculate swap output amount using constant product formula
     * amountOut = (amountIn * reserveOut * (1 - fee)) / (reserveIn + amountIn)
     */
    const calculateSwapOutput = useCallback(async (
        poolName: string,
        amountIn: number,
        isAToB: boolean
    ): Promise<number> => {
        if (!program) throw new Error("Program not initialized");

        const pool = POOLS[poolName];
        if (!pool) throw new Error("Pool not found");

        try {
            // Fetch pool account data
            const poolAccount = await program.account.liquidityPool.fetch(
                new PublicKey(pool.poolAddress)
            );

            const reserveIn = isAToB ? poolAccount.reserveA : poolAccount.reserveB;
            const reserveOut = isAToB ? poolAccount.reserveB : poolAccount.reserveA;

            // Apply 0.3% fee
            const amountInWithFee = amountIn * 997; // 1000 - 3 = 997
            const numerator = amountInWithFee * Number(reserveOut);
            const denominator = Number(reserveIn) * 1000 + amountInWithFee;

            return Math.floor(numerator / denominator);
        } catch (err: any) {
            throw new Error(`Failed to calculate swap: ${err.message}`);
        }
    }, [program]);

    /**
     * Execute a token swap
     */
    const executeSwap = useCallback(async (params: SwapParams): Promise<SwapResult> => {
        if (!program || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        setLoading(true);
        setError(null);

        try {
            const pool = POOLS[params.poolName];
            if (!pool) throw new Error("Pool not found");

            const poolPubkey = new PublicKey(pool.poolAddress);
            const tokenAMint = new PublicKey(pool.tokenA.mint);
            const tokenBMint = new PublicKey(pool.tokenB.mint);
            const tokenAVault = new PublicKey(pool.tokenAVault);
            const tokenBVault = new PublicKey(pool.tokenBVault);

            // Get user token accounts
            const userTokenA = await getAssociatedTokenAddress(tokenAMint, wallet.publicKey);
            const userTokenB = await getAssociatedTokenAddress(tokenBMint, wallet.publicKey);

            // Convert amounts to BN with proper decimals
            const decimalsIn = params.isAToB ? pool.tokenA.decimals : pool.tokenB.decimals;
            const decimalsOut = params.isAToB ? pool.tokenB.decimals : pool.tokenA.decimals;

            const amountInBN = new BN(params.amountIn * Math.pow(10, decimalsIn));
            const minAmountOutBN = new BN(params.minAmountOut * Math.pow(10, decimalsOut));

            // Execute swap
            const tx = await program.methods
                .swap(amountInBN, minAmountOutBN, params.isAToB)
                .accounts({
                    pool: poolPubkey,
                    tokenAVault: tokenAVault,
                    tokenBVault: tokenBVault,
                    userTokenA: userTokenA,
                    userTokenB: userTokenB,
                    user: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                } as any)
                .rpc();

            // Calculate actual output
            const actualOutput = await calculateSwapOutput(
                params.poolName,
                params.amountIn,
                params.isAToB
            );

            setLoading(false);
            return {
                signature: tx,
                amountOut: actualOutput / Math.pow(10, decimalsOut)
            };
        } catch (err: any) {
            const errorMsg = err.message || "Swap failed";
            setError(errorMsg);
            setLoading(false);
            throw new Error(errorMsg);
        }
    }, [program, wallet, calculateSwapOutput]);

    /**
     * Get swap quote (estimate output without executing)
     */
    const getSwapQuote = useCallback(async (
        fromToken: string,
        toToken: string,
        amount: number
    ): Promise<number> => {
        // Find pool with these tokens
        const poolEntry = Object.entries(POOLS).find(([_, pool]) =>
            (pool.tokenA.symbol === fromToken && pool.tokenB.symbol === toToken) ||
            (pool.tokenA.symbol === toToken && pool.tokenB.symbol === fromToken)
        );

        if (!poolEntry) throw new Error("Pool not found for token pair");

        const [poolName, pool] = poolEntry;
        const isAToB = pool.tokenA.symbol === fromToken;

        return calculateSwapOutput(poolName, amount, isAToB);
    }, [calculateSwapOutput]);

    return {
        executeSwap,
        calculateSwapOutput,
        getSwapQuote,
        loading,
        error
    };
}
