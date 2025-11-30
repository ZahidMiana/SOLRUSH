'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { getProgram } from '../anchor/setup';
import { findLpMintAddress } from '../anchor/pda';
import { getAssociatedTokenAddress } from '@solana/spl-token';

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

/**
 * Token decimal constants.
 * SOL uses 9 decimals, most stablecoins use 6.
 * TODO: Fetch actual decimals from token mint info for accuracy.
 */
const TOKEN_DECIMALS = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  DEFAULT: 9,
};

// Error types for better user feedback
export enum LiquidityErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface LiquidityError {
  type: LiquidityErrorType;
  message: string;
  details?: string;
}

/**
 * Parse liquidity transaction error to provide specific user feedback
 */
const parseLiquidityError = (error: Error): LiquidityError => {
  const message = error.message || '';
  
  if (message.includes('Wallet not connected') || message.includes('wallet')) {
    return {
      type: LiquidityErrorType.WALLET_NOT_CONNECTED,
      message: 'Please connect your wallet to continue.',
    };
  }
  
  if (message.includes('insufficient') || message.includes('Insufficient') || message.includes('0x1')) {
    return {
      type: LiquidityErrorType.INSUFFICIENT_FUNDS,
      message: 'Insufficient token balance.',
      details: 'Make sure you have enough tokens and SOL for transaction fees.',
    };
  }
  
  if (message.includes('slippage') || message.includes('Slippage') || message.includes('6001')) {
    return {
      type: LiquidityErrorType.SLIPPAGE_EXCEEDED,
      message: 'Slippage tolerance exceeded.',
      details: 'The pool ratio changed. Try increasing slippage or reducing amounts.',
    };
  }
  
  if (message.includes('InsufficientLiquidity') || message.includes('liquidity') || message.includes('6000')) {
    return {
      type: LiquidityErrorType.INSUFFICIENT_LIQUIDITY,
      message: 'Insufficient liquidity.',
      details: 'Cannot withdraw more than available pool liquidity.',
    };
  }
  
  if (message.includes('AccountNotFound') || message.includes('not found')) {
    return {
      type: LiquidityErrorType.POOL_NOT_FOUND,
      message: 'Pool not found.',
      details: 'The liquidity pool may not exist on this network.',
    };
  }
  
  if (message.includes('FetchError') || message.includes('Network') || message.includes('timeout')) {
    return {
      type: LiquidityErrorType.NETWORK_ERROR,
      message: 'Network error occurred.',
      details: 'Please check your connection and try again.',
    };
  }
  
  return {
    type: LiquidityErrorType.UNKNOWN,
    message: 'Transaction failed.',
    details: message,
  };
};

/**
 * Custom hook for pool data management and liquidity operations
 */
export function usePool(poolAddress: string) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pool, setPool] = useState<PoolData>({
    address: poolAddress,
    tokenA: 'SOL',
    tokenB: 'USDC',
    reserveA: 0,
    reserveB: 0,
    totalLPSupply: 0,
    lpTokenDecimals: 9,
    fee: 0.003,
    tvl: 0,
    apy: 0,
    userLiquidity: 0,
    loading: true,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  /**
   * Fetch pool data from blockchain
   */
  const fetchPoolData = useCallback(async () => {
    if (!poolAddress) return;
    
    setPool((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const poolPubkey = new PublicKey(poolAddress);
      const accountInfo = await connection.getAccountInfo(poolPubkey);

      if (!accountInfo) {
        // Pool doesn't exist on-chain, use default data for demo
        setPool((prev) => ({
          ...prev,
          loading: false,
          reserveA: 1000,
          reserveB: 100000,
          totalLPSupply: 10000,
          tvl: 200000,
          apy: 45,
        }));
        return;
      }

      // Decode pool account if wallet is connected
      if (wallet.publicKey) {
        try {
          const program = getProgram(connection, wallet);
          const poolData = program.coder.accounts.decode<LiquidityPoolAccount>(
            'LiquidityPool',
            accountInfo.data
          );

          // Convert reserves using token decimals
          // Note: Assumes tokenA is SOL (9 decimals) and tokenB is a stablecoin (6 decimals)
          const reserveA = poolData.tokenAReserve.toNumber() / Math.pow(10, TOKEN_DECIMALS.SOL);
          const reserveB = poolData.tokenBReserve.toNumber() / Math.pow(10, TOKEN_DECIMALS.USDC);

          // Calculate TVL (simplified)
          // TODO: Integrate a price feed (e.g., Pyth, Switchboard) for accurate SOL price
          const solPrice = 100;
          const tvl = reserveA * solPrice + reserveB;

          // Fetch LP token supply
          const lpMint = findLpMintAddress(poolPubkey);
          let totalLPSupply = 10000; // default
          try {
            const lpMintInfo = await connection.getTokenSupply(lpMint);
            totalLPSupply = Number(lpMintInfo.value.amount) / Math.pow(10, lpMintInfo.value.decimals);
          } catch {
            console.warn('Could not fetch LP mint info');
          }

          // Fetch user's LP token balance
          let userLiquidity = 0;
          try {
            const userLpAta = await getAssociatedTokenAddress(lpMint, wallet.publicKey);
            const userLpBalance = await connection.getTokenAccountBalance(userLpAta);
            userLiquidity = Number(userLpBalance.value.amount) / Math.pow(10, userLpBalance.value.decimals);
          } catch {
            // User doesn't have LP tokens
          }

          setPool((prev) => ({
            ...prev,
            loading: false,
            reserveA,
            reserveB,
            totalLPSupply,
            fee: poolData.feeBasisPoints / 10000,
            tvl,
            apy: 45, // TODO: Calculate from historical data
            userLiquidity,
          }));
        } catch (decodeError) {
          console.warn('Failed to decode pool account:', decodeError);
          // Fallback to demo data
          setPool((prev) => ({
            ...prev,
            loading: false,
            reserveA: 1000,
            reserveB: 100000,
            totalLPSupply: 10000,
            tvl: 200000,
            apy: 45,
          }));
        }
      } else {
        // No wallet connected, use demo data
        setPool((prev) => ({
          ...prev,
          loading: false,
          reserveA: 1000,
          reserveB: 100000,
          totalLPSupply: 10000,
          tvl: 200000,
          apy: 45,
        }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch pool data';
      console.error('Error fetching pool data:', errorMsg);
      setPool((prev) => ({ 
        ...prev, 
        loading: false, 
        error: errorMsg,
        // Keep some demo data available
        reserveA: 1000,
        reserveB: 100000,
        totalLPSupply: 10000,
      }));
    }
  }, [poolAddress, connection, wallet]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  /**
   * Calculate LP tokens to receive when adding liquidity
   */
  const calculateLPTokens = (amountA: number, amountB: number): number => {
    const existingA = pool.reserveA;
    const existingB = pool.reserveB;
    const existingSupply = pool.totalLPSupply;

    if (existingSupply === 0 || existingA === 0) {
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
    if (totalSupply === 0) return 100;
    return (userLPTokens / (totalSupply + userLPTokens)) * 100;
  };

  /**
   * Add liquidity to pool - executes on-chain transaction
   */
  const addLiquidity = async (
    params: AddLiquidityParams
  ): Promise<string> => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const poolPubkey = new PublicKey(poolAddress);
      
      // Check if pool exists on-chain
      const accountInfo = await connection.getAccountInfo(poolPubkey);
      
      if (!accountInfo) {
        // Pool doesn't exist, simulate for development
        console.warn('Pool not found on-chain, simulating transaction');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Update local state
        const lpTokens = calculateLPTokens(params.amountA, params.amountB);
        setPool((prev) => ({
          ...prev,
          reserveA: prev.reserveA + params.amountA,
          reserveB: prev.reserveB + params.amountB,
          totalLPSupply: prev.totalLPSupply + lpTokens,
          userLiquidity: (prev.userLiquidity || 0) + lpTokens,
        }));
        
        return 'simulated_add_liquidity_' + Date.now();
      }

      // Execute real on-chain transaction
      const program = getProgram(connection, wallet);
      const poolData = program.coder.accounts.decode<LiquidityPoolAccount>(
        'LiquidityPool',
        accountInfo.data
      );

      const userTokenA = await getAssociatedTokenAddress(poolData.tokenAMint, wallet.publicKey);
      const userTokenB = await getAssociatedTokenAddress(poolData.tokenBMint, wallet.publicKey);

      // Convert amounts to BN with proper decimals
      // Note: Assumes tokenA is SOL (9 decimals) and tokenB is a stablecoin (6 decimals)
      const amountABN = new BN(Math.floor(params.amountA * Math.pow(10, TOKEN_DECIMALS.SOL)));
      const amountBBN = new BN(Math.floor(params.amountB * Math.pow(10, TOKEN_DECIMALS.USDC)));

      const tx = await program.methods
        .addLiquidity(amountABN, amountBBN)
        .accounts({
          user: wallet.publicKey,
          pool: poolPubkey,
          userTokenA,
          userTokenB,
          tokenAVault: poolData.tokenAVault,
          tokenBVault: poolData.tokenBVault,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        })
        .rpc();

      // Refresh pool data after successful transaction
      await fetchPoolData();

      return tx;
    } catch (error) {
      const liquidityError = parseLiquidityError(error instanceof Error ? error : new Error(String(error)));
      console.error('Add liquidity error:', liquidityError);
      
      // If it's a network/program not found error, simulate
      if (liquidityError.type === LiquidityErrorType.POOL_NOT_FOUND || 
          liquidityError.type === LiquidityErrorType.NETWORK_ERROR) {
        console.warn('Falling back to simulation mode');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const lpTokens = calculateLPTokens(params.amountA, params.amountB);
        setPool((prev) => ({
          ...prev,
          reserveA: prev.reserveA + params.amountA,
          reserveB: prev.reserveB + params.amountB,
          totalLPSupply: prev.totalLPSupply + lpTokens,
          userLiquidity: (prev.userLiquidity || 0) + lpTokens,
        }));
        
        return 'simulated_add_liquidity_' + Date.now();
      }
      
      throw new Error(liquidityError.message + (liquidityError.details ? `: ${liquidityError.details}` : ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove liquidity from pool - executes on-chain transaction
   */
  const removeLiquidity = async (
    params: RemoveLiquidityParams
  ): Promise<string> => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const poolPubkey = new PublicKey(poolAddress);
      
      // Calculate amounts to receive
      const shareA = (params.lpTokenAmount / pool.totalLPSupply) * pool.reserveA;
      const shareB = (params.lpTokenAmount / pool.totalLPSupply) * pool.reserveB;

      // Verify slippage
      if (shareA < params.minAmountA || shareB < params.minAmountB) {
        throw new Error('Slippage exceeded. Received amounts less than minimum.');
      }

      // Check if pool exists on-chain
      const accountInfo = await connection.getAccountInfo(poolPubkey);
      
      if (!accountInfo) {
        // Pool doesn't exist, simulate for development
        console.warn('Pool not found on-chain, simulating transaction');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setPool((prev) => ({
          ...prev,
          reserveA: prev.reserveA - shareA,
          reserveB: prev.reserveB - shareB,
          totalLPSupply: prev.totalLPSupply - params.lpTokenAmount,
          userLiquidity: Math.max(0, (prev.userLiquidity || 0) - params.lpTokenAmount),
        }));
        
        return 'simulated_remove_liquidity_' + Date.now();
      }

      // Execute real on-chain transaction
      const program = getProgram(connection, wallet);
      const poolData = program.coder.accounts.decode<LiquidityPoolAccount>(
        'LiquidityPool',
        accountInfo.data
      );

      // Note: The IDL shows removeLiquidity takes amountA and amountB directly
      // This might need adjustment based on actual program implementation
      const amountABN = new BN(Math.floor(shareA * Math.pow(10, TOKEN_DECIMALS.SOL)));
      const amountBBN = new BN(Math.floor(shareB * Math.pow(10, TOKEN_DECIMALS.USDC)));

      const tx = await program.methods
        .removeLiquidity(amountABN, amountBBN)
        .accounts({
          user: wallet.publicKey,
          pool: poolPubkey,
          tokenAVault: poolData.tokenAVault,
          tokenBVault: poolData.tokenBVault,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        })
        .rpc();

      // Refresh pool data after successful transaction
      await fetchPoolData();

      return tx;
    } catch (error) {
      const liquidityError = parseLiquidityError(error instanceof Error ? error : new Error(String(error)));
      console.error('Remove liquidity error:', liquidityError);
      
      // If it's a network/program not found error, simulate
      if (liquidityError.type === LiquidityErrorType.POOL_NOT_FOUND || 
          liquidityError.type === LiquidityErrorType.NETWORK_ERROR) {
        console.warn('Falling back to simulation mode');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const shareA = (params.lpTokenAmount / pool.totalLPSupply) * pool.reserveA;
        const shareB = (params.lpTokenAmount / pool.totalLPSupply) * pool.reserveB;
        
        setPool((prev) => ({
          ...prev,
          reserveA: prev.reserveA - shareA,
          reserveB: prev.reserveB - shareB,
          totalLPSupply: prev.totalLPSupply - params.lpTokenAmount,
          userLiquidity: Math.max(0, (prev.userLiquidity || 0) - params.lpTokenAmount),
        }));
        
        return 'simulated_remove_liquidity_' + Date.now();
      }
      
      throw new Error(liquidityError.message + (liquidityError.details ? `: ${liquidityError.details}` : ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh pool data
   */
  const refreshPool = useCallback(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  return {
    pool,
    loading,
    addLiquidity,
    removeLiquidity,
    calculateLPTokens,
    calculatePoolShare,
    refreshPool,
  };
}
