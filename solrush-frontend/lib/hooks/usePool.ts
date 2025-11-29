'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

export interface PoolData {
  address: string;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  totalLPSupply: number;
  lpTokenDecimals: number;
  fee: number;
  tvl: number;
  apy: number;
  userLiquidity?: number;
  loading: boolean;
  error: string | null;
}

interface AddLiquidityParams {
  amountA: number;
  amountB: number;
}

interface RemoveLiquidityParams {
  lpTokenAmount: number;
  minAmountA: number;
  minAmountB: number;
}

/**
 * Custom hook for pool data management and liquidity operations
 */
export function usePool(poolAddress: string) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [pool, setPool] = useState<PoolData>({
    address: poolAddress,
    tokenA: 'SOL',
    tokenB: 'USDC',
    reserveA: 1000,
    reserveB: 1000000,
    totalLPSupply: 10000,
    lpTokenDecimals: 8,
    fee: 0.003,
    tvl: 2050000,
    apy: 45,
    userLiquidity: 5420,
    loading: false,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  /**
   * Fetch pool data from blockchain
   */
  useEffect(() => {
    const fetchPoolData = async () => {
      setPool((prev) => ({ ...prev, loading: true }));
      try {
        // In production, fetch from actual pool program account
        // Mock data for demonstration
        await new Promise((resolve) => setTimeout(resolve, 500));

        setPool((prev) => ({
          ...prev,
          loading: false,
          reserveA: 1000,
          reserveB: 1000000,
          totalLPSupply: 10000,
          tvl: (1000 * 1005) + 1000000,
          apy: 45,
        }));
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Failed to fetch pool data';
        setPool((prev) => ({ ...prev, loading: false, error: errorMsg }));
      }
    };

    if (poolAddress) {
      fetchPoolData();
    }
  }, [poolAddress]);

  /**
   * Calculate LP tokens to receive when adding liquidity
   */
  const calculateLPTokens = (amountA: number, amountB: number): number => {
    const existingA = pool.reserveA;
    const existingB = pool.reserveB;
    const existingSupply = pool.totalLPSupply;

    if (existingSupply === 0) {
      // First liquidity provider: mint sqrt(a * b)
      return Math.sqrt(amountA * amountB);
    }

    // Calculate liquidity for both token amounts
    const liquidityFromA = (amountA / existingA) * existingSupply;
    const liquidityFromB = (amountB / existingB) * existingSupply;

    // Take the minimum (constrained by pool ratio)
    return Math.min(liquidityFromA, liquidityFromB);
  };

  /**
   * Calculate pool share percentage
   */
  const calculatePoolShare = (userLPTokens: number): number => {
    const totalSupply = pool.totalLPSupply;
    return (userLPTokens / (totalSupply + userLPTokens)) * 100;
  };

  /**
   * Add liquidity to pool
   */
  const addLiquidity = async (
    params: AddLiquidityParams
  ): Promise<string> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // In production, build and send real transaction
      const simulatedSignature = 'add_liquidity_' + Date.now();
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update pool data
      setPool((prev) => ({
        ...prev,
        reserveA: prev.reserveA + params.amountA,
        reserveB: prev.reserveB + params.amountB,
        totalLPSupply:
          prev.totalLPSupply +
          calculateLPTokens(params.amountA, params.amountB),
      }));

      return simulatedSignature;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove liquidity from pool
   */
  const removeLiquidity = async (
    params: RemoveLiquidityParams
  ): Promise<string> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // Calculate amounts to receive
      const shareA =
        (params.lpTokenAmount / pool.totalLPSupply) * pool.reserveA;
      const shareB =
        (params.lpTokenAmount / pool.totalLPSupply) * pool.reserveB;

      // Verify slippage
      if (shareA < params.minAmountA || shareB < params.minAmountB) {
        throw new Error(
          'Slippage exceeded. Received amounts less than minimum.'
        );
      }

      // In production, build and send real transaction
      const simulatedSignature = 'remove_liquidity_' + Date.now();
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update pool data
      setPool((prev) => ({
        ...prev,
        reserveA: prev.reserveA - shareA,
        reserveB: prev.reserveB - shareB,
        totalLPSupply: prev.totalLPSupply - params.lpTokenAmount,
      }));

      return simulatedSignature;
    } finally {
      setLoading(false);
    }
  };

  return {
    pool,
    loading,
    addLiquidity,
    removeLiquidity,
    calculateLPTokens,
    calculatePoolShare,
  };
}
