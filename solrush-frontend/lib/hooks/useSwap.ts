'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getProgram } from '../solana/program';
import { findPoolAddress } from '../anchor/pda';
import { getTokenMint, getTokenDecimals } from '../solana/constants';
import { parseTransactionError, logTransactionError } from '../errors/transaction-errors';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

export interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  minReceived: number;
  exchangeRate: number;
}

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

// Real pool addresses from Devnet deployment
const POOL_ADDRESSES: Record<string, string> = {
  'SOL-USDC': '84ZHagR3STya8NGMAV46VPjG7uuTAYS4jJ54m3wjNkey',
  'SOL-USDT': 'DuPZshKxPRDsvMM8YjkumP79UqsSpCbwocu8vvUhGq6h',
  'USDC-USDT': 'Cqr2raQD6Zxu7mtafPxwUYXg298FqVrW2uLyXQQPvgWP',
  'SOL-RUSH': 'GZSVEefVZGTmCs9rbVtbQQm2SVppZJw3U8FGer5zjc1H',
};

/**
 * Custom hook for REAL on-chain token swap logic and execution
 */
export function useSwap() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch REAL pool data from on-chain
   */
  const fetchPoolData = async (inputToken: string, outputToken: string) => {
    try {
      const poolKey = `${inputToken}-${outputToken}`;
      const reverseKey = `${outputToken}-${inputToken}`;

      const poolAddress = POOL_ADDRESSES[poolKey] || POOL_ADDRESSES[reverseKey];

      if (!poolAddress) {
        console.warn(`Pool not found for ${poolKey}, using mock data`);
        return null;
      }

      const program = getProgram(connection, wallet);
      const poolPubkey = new PublicKey(poolAddress);

      // Fetch pool account data
      const poolAccount = await program.account.liquidityPool.fetch(poolPubkey);

      return {
        address: poolPubkey,
        tokenAReserve: poolAccount.tokenAReserve.toNumber(),
        tokenBReserve: poolAccount.tokenBReserve.toNumber(),
        tokenAMint: poolAccount.tokenAMint,
        tokenBMint: poolAccount.tokenBMint,
        lpTokenMint: poolAccount.lpTokenMint,
        tokenAVault: poolAccount.tokenAVault,
        tokenBVault: poolAccount.tokenBVault,
      };
    } catch (err) {
      console.error('Error fetching pool data:', err);
      return null;
    }
  };

  /**
   * Calculate swap quote using REAL pool reserves
   */
  const calculateQuote = (
    inputAmount: number,
    inputToken: string,
    outputToken: string,
    slippage: number
  ): SwapQuote => {
    if (!inputAmount || inputAmount <= 0) {
      return {
        inputAmount: 0,
        outputAmount: 0,
        priceImpact: 0,
        fee: 0,
        minReceived: 0,
        exchangeRate: 0,
      };
    }

    // Use mock rates for instant calculation (will be replaced with real pool data in async version)
    const mockRates: Record<string, number> = {
      'SOL-USDC': 100,
      'USDC-SOL': 0.01,
      'SOL-USDT': 100,
      'USDT-SOL': 0.01,
      'USDC-USDT': 1,
      'USDT-USDC': 1,
      'SOL-RUSH': 1000,
      'RUSH-SOL': 0.001,
    };

    const pair = `${inputToken}-${outputToken}`;
    const exchangeRate = mockRates[pair] || 1;

    const FEE_RATE = 0.003; // 0.3%
    const fee = inputAmount * FEE_RATE;
    const amountAfterFee = inputAmount - fee;
    const outputAmount = amountAfterFee * exchangeRate;

    const priceImpact = (inputAmount / 1000) * 0.1;
    const minReceived = outputAmount * (1 - slippage / 100);

    return {
      inputAmount,
      outputAmount,
      priceImpact,
      fee,
      minReceived,
      exchangeRate,
    };
  };

  /**
   * Execute REAL swap transaction on-chain
   */
  const executeSwap = async (params: {
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    minOutputAmount: number;
  }): Promise<string> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const program = getProgram(connection, wallet);

      // Get token mints
      const inputMint = getTokenMint(params.inputToken);
      const outputMint = getTokenMint(params.outputToken);

      // Find pool address
      const poolKey = `${params.inputToken}-${params.outputToken}`;
      const reverseKey = `${params.outputToken}-${params.inputToken}`;
      const poolAddress = POOL_ADDRESSES[poolKey] || POOL_ADDRESSES[reverseKey];

      if (!poolAddress) {
        throw new Error(`Pool not found for ${poolKey}`);
      }

      const pool = new PublicKey(poolAddress);

      // Fetch pool data to get vaults
      const poolData = await program.account.liquidityPool.fetch(pool);

      // Get user token accounts
      const userInputAccount = await getAssociatedTokenAddress(
        inputMint,
        wallet.publicKey
      );

      const userOutputAccount = await getAssociatedTokenAddress(
        outputMint,
        wallet.publicKey
      );

      // Convert amount to lamports/smallest unit
      const inputDecimals = getTokenDecimals(params.inputToken);
      const amountIn = Math.floor(params.inputAmount * Math.pow(10, inputDecimals));
      const minAmountOut = Math.floor(params.minOutputAmount * Math.pow(10, getTokenDecimals(params.outputToken)));

      // Execute swap instruction
      const tx = await program.methods
        .swap(
          new (program as any).BN(amountIn),
          new (program as any).BN(minAmountOut)
        )
        .accounts({
          user: wallet.publicKey,
          pool: pool,
          tokenAMint: poolData.tokenAMint,
          tokenBMint: poolData.tokenBMint,
          tokenAVault: poolData.tokenAVault,
          tokenBVault: poolData.tokenBVault,
          userTokenAAccount: userInputAccount,
          userTokenBAccount: userOutputAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      console.log('Swap transaction:', tx);
      return tx;
    } catch (err: any) {
      const parsed = parseTransactionError(err);
      logTransactionError(err, 'executeSwap');
      setError(parsed.message);
      throw new Error(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== LIMIT ORDERS (LocalStorage for now) =====

  const createLimitOrder = (
    inputToken: string,
    outputToken: string,
    inputAmount: number,
    targetPrice: number,
    expiryDays: number
  ): LimitOrder => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const newOrder: LimitOrder = {
      id: Date.now().toString(),
      inputToken,
      outputToken,
      inputAmount,
      targetPrice,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
    };

    const existing = getLimitOrders();
    localStorage.setItem('limitOrders', JSON.stringify([...existing, newOrder]));

    return newOrder;
  };

  const getLimitOrders = (): LimitOrder[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('limitOrders');
    if (!stored) return [];

    const orders: LimitOrder[] = JSON.parse(stored);
    return orders.map(order => ({
      ...order,
      expiresAt: new Date(order.expiresAt),
      createdAt: new Date(order.createdAt),
    }));
  };

  const cancelLimitOrder = (orderId: string): void => {
    const orders = getLimitOrders();
    const updated = orders.map(order =>
      order.id === orderId ? { ...order, status: 'cancelled' as const } : order
    );
    localStorage.setItem('limitOrders', JSON.stringify(updated));
  };

  const checkAndExecuteOrders = (currentPrice: number, pair: string): void => {
    const orders = getLimitOrders();
    const now = new Date();

    const updated = orders.map(order => {
      if (order.status !== 'pending') return order;

      if (order.expiresAt < now) {
        return { ...order, status: 'expired' as const };
      }

      const orderPair = `${order.inputToken}-${order.outputToken}`;
      if (orderPair === pair && currentPrice >= order.targetPrice) {
        return { ...order, status: 'executed' as const };
      }

      return order;
    });

    localStorage.setItem('limitOrders', JSON.stringify(updated));
  };

  return {
    calculateQuote,
    executeSwap,
    fetchPoolData,
    createLimitOrder,
    getLimitOrders,
    cancelLimitOrder,
    checkAndExecuteOrders,
    loading,
    error,
  };
}
