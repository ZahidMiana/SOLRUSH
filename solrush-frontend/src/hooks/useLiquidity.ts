import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { POOLS } from "../lib/config/pools";

export interface AddLiquidityParams {
    poolName: string;
    amountA: number;
    amountB: number;
    minLPTokens: number;
}

export interface RemoveLiquidityParams {
    poolName: string;
    lpTokenAmount: number;
    minAmountA: number;
    minAmountB: number;
}

export interface LiquidityResult {
    signature: string;
    lpTokens?: number;
    amountA?: number;
    amountB?: number;
}

export interface UserLPPosition {
    lpTokens: number;
    shareOfPool: number;
}

/**
 * Hook for liquidity management
 */
export function useLiquidity() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const program = useProgram();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Add liquidity to a pool
     */
    const addLiquidity = useCallback(async (params: AddLiquidityParams): Promise<LiquidityResult> => {
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
            const lpTokenMint = new PublicKey(pool.lpTokenMint);
            const tokenAVault = new PublicKey(pool.tokenAVault);
            const tokenBVault = new PublicKey(pool.tokenBVault);

            // Get user token accounts
            const userTokenA = await getAssociatedTokenAddress(tokenAMint, wallet.publicKey);
            const userTokenB = await getAssociatedTokenAddress(tokenBMint, wallet.publicKey);
            const userLPTokenAccount = await getAssociatedTokenAddress(lpTokenMint, wallet.publicKey);

            // Derive user position PDA
            const [userPosition] = PublicKey.findProgramAddressSync(
                [Buffer.from("position"), poolPubkey.toBuffer(), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Convert amounts to BN with proper decimals
            const amountABN = new BN(params.amountA * Math.pow(10, pool.tokenA.decimals));
            const amountBBN = new BN(params.amountB * Math.pow(10, pool.tokenB.decimals));
            const minLPTokensBN = new BN(params.minLPTokens * Math.pow(10, 6)); // LP tokens have 6 decimals

            // Execute add liquidity
            const tx = await program.methods
                .addLiquidity(amountABN, amountBBN, minLPTokensBN)
                .accounts({
                    pool: poolPubkey,
                    tokenAMint: tokenAMint,
                    tokenBMint: tokenBMint,
                    lpTokenMint: lpTokenMint,
                    userPosition: userPosition,
                    tokenAVault: tokenAVault,
                    tokenBVault: tokenBVault,
                    userTokenA: userTokenA,
                    userTokenB: userTokenB,
                    userLpTokenAccount: userLPTokenAccount,
                    user: wallet.publicKey,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any)
                .rpc();

            setLoading(false);
            return {
                signature: tx,
                lpTokens: params.minLPTokens // Actual LP tokens would be calculated from event logs
            };
        } catch (err: any) {
            const errorMsg = err.message || "Add liquidity failed";
            setError(errorMsg);
            setLoading(false);
            throw new Error(errorMsg);
        }
    }, [program, wallet]);

    /**
     * Remove liquidity from a pool
     */
    const removeLiquidity = useCallback(async (params: RemoveLiquidityParams): Promise<LiquidityResult> => {
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
            const lpTokenMint = new PublicKey(pool.lpTokenMint);
            const tokenAVault = new PublicKey(pool.tokenAVault);
            const tokenBVault = new PublicKey(pool.tokenBVault);

            // Get user token accounts
            const userTokenA = await getAssociatedTokenAddress(tokenAMint, wallet.publicKey);
            const userTokenB = await getAssociatedTokenAddress(tokenBMint, wallet.publicKey);
            const userLPTokenAccount = await getAssociatedTokenAddress(lpTokenMint, wallet.publicKey);

            // Derive user position PDA
            const [userPosition] = PublicKey.findProgramAddressSync(
                [Buffer.from("position"), poolPubkey.toBuffer(), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Convert amounts to BN with proper decimals
            const lpTokensBN = new BN(params.lpTokenAmount * Math.pow(10, 6));
            const minAmountABN = new BN(params.minAmountA * Math.pow(10, pool.tokenA.decimals));
            const minAmountBBN = new BN(params.minAmountB * Math.pow(10, pool.tokenB.decimals));

            // Execute remove liquidity
            const tx = await program.methods
                .removeLiquidity(lpTokensBN, minAmountABN, minAmountBBN)
                .accounts({
                    pool: poolPubkey,
                    lpTokenMint: lpTokenMint,
                    userPosition: userPosition,
                    tokenAVault: tokenAVault,
                    tokenBVault: tokenBVault,
                    userLpTokenAccount: userLPTokenAccount,
                    userTokenA: userTokenA,
                    userTokenB: userTokenB,
                    user: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                } as any)
                .rpc();

            setLoading(false);
            return {
                signature: tx,
                amountA: params.minAmountA,
                amountB: params.minAmountB
            };
        } catch (err: any) {
            const errorMsg = err.message || "Remove liquidity failed";
            setError(errorMsg);
            setLoading(false);
            throw new Error(errorMsg);
        }
    }, [program, wallet]);

    /**
     * Get user's LP token balance and pool share
     */
    const getUserLPBalance = useCallback(async (poolName: string): Promise<UserLPPosition> => {
        if (!program || !wallet.publicKey) {
            return { lpTokens: 0, shareOfPool: 0 };
        }

        try {
            const pool = POOLS[poolName];
            if (!pool) throw new Error("Pool not found");

            const poolPubkey = new PublicKey(pool.poolAddress);
            const lpTokenMint = new PublicKey(pool.lpTokenMint);

            // Get user LP token account
            const userLPTokenAccount = await getAssociatedTokenAddress(lpTokenMint, wallet.publicKey);
            const accountInfo = await connection.getTokenAccountBalance(userLPTokenAccount);

            const lpTokens = parseFloat(accountInfo.value.amount) / Math.pow(10, 6);

            // Get pool data to calculate share
            const poolAccount = await program.account.liquidityPool.fetch(poolPubkey);
            const totalLPSupply = Number(poolAccount.totalLpSupply) / Math.pow(10, 6);

            const shareOfPool = totalLPSupply > 0 ? (lpTokens / totalLPSupply) * 100 : 0;

            return {
                lpTokens,
                shareOfPool
            };
        } catch (err) {
            return { lpTokens: 0, shareOfPool: 0 };
        }
    }, [program, wallet, connection]);

    /**
     * Calculate pool share percentage
     */
    const calculatePoolShare = useCallback(async (
        lpTokenAmount: number,
        poolName: string
    ): Promise<number> => {
        if (!program) return 0;

        try {
            const pool = POOLS[poolName];
            if (!pool) return 0;

            const poolPubkey = new PublicKey(pool.poolAddress);
            const poolAccount = await program.account.liquidityPool.fetch(poolPubkey);
            const totalLPSupply = Number(poolAccount.totalLpSupply) / Math.pow(10, 6);

            return totalLPSupply > 0 ? (lpTokenAmount / totalLPSupply) * 100 : 0;
        } catch (err) {
            return 0;
        }
    }, [program]);

    return {
        addLiquidity,
        removeLiquidity,
        getUserLPBalance,
        calculatePoolShare,
        loading,
        error
    };
}
