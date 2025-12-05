import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { POOLS } from "../lib/config/pools";

export interface CreateLimitOrderParams {
    poolName: string;
    sellAmount: number;
    targetPrice: number;
    minimumReceive: number;
    expiryDays: number;
}

export interface LimitOrder {
    address: string;
    owner: string;
    pool: string;
    sellAmount: number;
    targetPrice: number;
    minimumReceive: number;
    expiry: number;
    isActive: boolean;
}

/**
 * Hook for limit order functionality
 */
export function useLimitOrders() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const program = useProgram();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Create a limit order
     */
    const createLimitOrder = useCallback(async (params: CreateLimitOrderParams): Promise<string> => {
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

            // Derive limit order PDA
            const orderSeed = Date.now().toString();
            const [limitOrder] = PublicKey.findProgramAddressSync(
                [Buffer.from("limit_order"), wallet.publicKey.toBuffer(), Buffer.from(orderSeed)],
                program.programId
            );

            // Convert amounts to BN
            const sellAmountBN = new BN(params.sellAmount * Math.pow(10, pool.tokenA.decimals));
            const targetPriceBN = new BN(params.targetPrice * Math.pow(10, 6)); // Price with 6 decimals
            const minimumReceiveBN = new BN(params.minimumReceive * Math.pow(10, pool.tokenB.decimals));

            // Execute create limit order
            const tx = await program.methods
                .createLimitOrder(
                    sellAmountBN,
                    targetPriceBN,
                    minimumReceiveBN,
                    new BN(params.expiryDays)
                )
                .accounts({
                    limitOrder: limitOrder,
                    pool: poolPubkey,
                    tokenAVault: tokenAVault,
                    tokenBVault: tokenBVault,
                    userTokenA: userTokenA,
                    userTokenB: userTokenB,
                    owner: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any)
                .rpc();

            setLoading(false);
            return tx;
        } catch (err: any) {
            const errorMsg = err.message || "Create limit order failed";
            setError(errorMsg);
            setLoading(false);
            throw new Error(errorMsg);
        }
    }, [program, wallet]);

    /**
     * Cancel a limit order
     */
    const cancelLimitOrder = useCallback(async (orderAddress: string): Promise<string> => {
        if (!program || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        setLoading(true);
        setError(null);

        try {
            const orderPubkey = new PublicKey(orderAddress);

            // Fetch order to get pool and token info
            const orderAccount = await program.account.limitOrder.fetch(orderPubkey);
            const poolPubkey = orderAccount.pool as PublicKey;

            // Find pool config
            const poolEntry = Object.entries(POOLS).find(([_, pool]) =>
                pool.poolAddress === poolPubkey.toBase58()
            );

            if (!poolEntry) throw new Error("Pool not found");
            const pool = poolEntry[1];

            const tokenAMint = new PublicKey(pool.tokenA.mint);
            const tokenBMint = new PublicKey(pool.tokenB.mint);
            const tokenAVault = new PublicKey(pool.tokenAVault);
            const tokenBVault = new PublicKey(pool.tokenBVault);

            const userTokenA = await getAssociatedTokenAddress(tokenAMint, wallet.publicKey);
            const userTokenB = await getAssociatedTokenAddress(tokenBMint, wallet.publicKey);

            // Execute cancel
            const tx = await program.methods
                .cancelLimitOrder()
                .accounts({
                    limitOrder: orderPubkey,
                    pool: poolPubkey,
                    tokenAVault: tokenAVault,
                    tokenBVault: tokenBVault,
                    userTokenA: userTokenA,
                    userTokenB: userTokenB,
                    owner: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                } as any)
                .rpc();

            setLoading(false);
            return tx;
        } catch (err: any) {
            const errorMsg = err.message || "Cancel limit order failed";
            setError(errorMsg);
            setLoading(false);
            throw new Error(errorMsg);
        }
    }, [program, wallet]);

    /**
     * Get user's active orders
     */
    const getUserOrders = useCallback(async (): Promise<LimitOrder[]> => {
        if (!program || !wallet.publicKey) {
            return [];
        }

        try {
            // Fetch all limit orders for the user
            const orders = await program.account.limitOrder.all([
                {
                    memcmp: {
                        offset: 8, // After discriminator
                        bytes: wallet.publicKey.toBase58(),
                    }
                }
            ]);

            return orders.map(order => ({
                address: order.publicKey.toBase58(),
                owner: (order.account.owner as PublicKey).toBase58(),
                pool: (order.account.pool as PublicKey).toBase58(),
                sellAmount: Number(order.account.sellAmount) / Math.pow(10, 6),
                targetPrice: Number(order.account.targetPrice) / Math.pow(10, 6),
                minimumReceive: Number(order.account.minimumReceive) / Math.pow(10, 6),
                expiry: Number(order.account.expiry),
                isActive: order.account.isActive as boolean,
            }));
        } catch (err) {
            console.error("Failed to fetch user orders:", err);
            return [];
        }
    }, [program, wallet]);

    /**
     * Get order book for a pool
     */
    const getOrderBook = useCallback(async (poolName: string): Promise<LimitOrder[]> => {
        if (!program) return [];

        try {
            const pool = POOLS[poolName];
            if (!pool) return [];

            const poolPubkey = new PublicKey(pool.poolAddress);

            // Fetch all orders for this pool
            const orders = await program.account.limitOrder.all([
                {
                    memcmp: {
                        offset: 8 + 32, // After discriminator + owner
                        bytes: poolPubkey.toBase58(),
                    }
                }
            ]);

            return orders
                .filter(order => order.account.isActive)
                .map(order => ({
                    address: order.publicKey.toBase58(),
                    owner: (order.account.owner as PublicKey).toBase58(),
                    pool: (order.account.pool as PublicKey).toBase58(),
                    sellAmount: Number(order.account.sellAmount) / Math.pow(10, 6),
                    targetPrice: Number(order.account.targetPrice) / Math.pow(10, 6),
                    minimumReceive: Number(order.account.minimumReceive) / Math.pow(10, 6),
                    expiry: Number(order.account.expiry),
                    isActive: order.account.isActive as boolean,
                }));
        } catch (err) {
            console.error("Failed to fetch order book:", err);
            return [];
        }
    }, [program]);

    return {
        createLimitOrder,
        cancelLimitOrder,
        getUserOrders,
        getOrderBook,
        loading,
        error
    };
}
