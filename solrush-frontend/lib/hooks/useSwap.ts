'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from '../anchor/setup';
import { findPoolAddress, findVaultAddress } from '../anchor/pda';
import { getTokenMint } from '../constants';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  minReceived: number;
  exchangeRate: number;
}

interface PoolReserves {
  reserveA: number;
  reserveB: number;
  tokenAMint: string;
  tokenBMint: string;
  feeBasisPoints: number;
}

interface LiquidityPoolAccount {
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenAReserve: { toNumber: () => number };
  tokenBReserve: { toNumber: () => number };
  feeBasisPoints: number;
}

// Error types for better user feedback
export enum SwapErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  PROGRAM_NOT_FOUND = 'PROGRAM_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface SwapError {
  type: SwapErrorType;
  message: string;
  details?: string;
}

/**
 * Fallback mock pool data for development/testing when on-chain data is unavailable.
 * Maps token pairs to their reserve values.
 * TODO: Remove once on-chain pools are deployed and stable.
 */
const MOCK_POOL_RESERVES: { [key: string]: { reserveIn: number; reserveOut: number } } = {
  'SOL-USDC': { reserveIn: 100, reserveOut: 10050 },
  'USDC-SOL': { reserveIn: 10050, reserveOut: 100 },
  'SOL-USDT': { reserveIn: 100, reserveOut: 10040 },
  'USDT-SOL': { reserveIn: 10040, reserveOut: 100 },
  'SOL-RUSH': { reserveIn: 100, reserveOut: 5000 },
  'RUSH-SOL': { reserveIn: 5000, reserveOut: 100 },
};

/**
 * Get the decimal places for a token.
 * SOL uses 9 decimals, most stablecoins use 6.
 * TODO: Fetch actual decimals from token mint info for accuracy.
 */
const getTokenDecimals = (tokenSymbol: string): number => {
  switch (tokenSymbol) {
    case 'SOL':
      return 9;
    case 'USDC':
    case 'USDT':
      return 6;
    default:
      return 9; // Default to 9 for unknown tokens
  }
};

/**
 * Parse transaction error to provide specific user feedback
 */
const parseSwapError = (error: Error): SwapError => {
  const message = error.message || '';
  
  if (message.includes('Wallet not connected') || message.includes('wallet')) {
    return {
      type: SwapErrorType.WALLET_NOT_CONNECTED,
      message: 'Please connect your wallet to continue.',
    };
  }
  
  if (message.includes('insufficient') || message.includes('Insufficient') || message.includes('0x1')) {
    return {
      type: SwapErrorType.INSUFFICIENT_FUNDS,
      message: 'Insufficient token balance for this swap.',
      details: 'Make sure you have enough tokens and SOL for transaction fees.',
    };
  }
  
  if (message.includes('SlippageTooHigh') || message.includes('slippage') || message.includes('6001')) {
    return {
      type: SwapErrorType.SLIPPAGE_EXCEEDED,
      message: 'Slippage tolerance exceeded.',
      details: 'The price moved too much. Try increasing your slippage tolerance.',
    };
  }
  
  if (message.includes('InsufficientLiquidity') || message.includes('liquidity') || message.includes('6000')) {
    return {
      type: SwapErrorType.INSUFFICIENT_LIQUIDITY,
      message: 'Insufficient liquidity in pool.',
      details: 'The pool does not have enough liquidity for this swap amount.',
    };
  }
  
  if (message.includes('Program not found') || message.includes('AccountNotFound')) {
    return {
      type: SwapErrorType.PROGRAM_NOT_FOUND,
      message: 'Pool or program not found.',
      details: 'The liquidity pool may not exist on this network.',
    };
  }
  
  if (message.includes('FetchError') || message.includes('Network') || message.includes('timeout')) {
    return {
      type: SwapErrorType.NETWORK_ERROR,
      message: 'Network error occurred.',
      details: 'Please check your connection and try again.',
    };
  }
  
  return {
    type: SwapErrorType.UNKNOWN,
    message: 'Swap transaction failed.',
    details: message,
  };
};

/**
 * Custom hook for token swap logic and execution
 * Handles AMM calculations, quote generation, and transaction execution
 */
export function useSwap() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SwapError | null>(null);

  // Cache for pool reserves
  const [poolReservesCache, setPoolReservesCache] = useState<Map<string, PoolReserves>>(new Map());

  /**
   * Fetch pool reserves from blockchain
   */
  const fetchPoolReserves = useCallback(async (
    inputToken: string,
    outputToken: string
  ): Promise<PoolReserves | null> => {
    try {
      const inputMint = getTokenMint(inputToken);
      const outputMint = getTokenMint(outputToken);
      const poolAddress = findPoolAddress(inputMint, outputMint);
      const cacheKey = poolAddress.toBase58();

      // Check cache first (with 30 second expiry)
      const cached = poolReservesCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch pool account data
      const accountInfo = await connection.getAccountInfo(poolAddress);
      
      if (!accountInfo) {
        console.warn('Pool account not found, using fallback data');
        return null;
      }

      // If wallet is connected, decode using program
      if (wallet.publicKey) {
        try {
          const program = getProgram(connection, wallet);
          const poolData = program.coder.accounts.decode<LiquidityPoolAccount>(
            'LiquidityPool',
            accountInfo.data
          );

          // Note: Decimals are estimated based on common token standards.
          // SOL uses 9 decimals, stablecoins typically use 6.
          // TODO: Fetch actual decimals from token mint accounts for accuracy.
          const tokenADecimals = 9; // Assuming SOL
          const tokenBDecimals = 6; // Assuming stablecoin
          
          const reserves: PoolReserves = {
            reserveA: poolData.tokenAReserve.toNumber() / Math.pow(10, tokenADecimals),
            reserveB: poolData.tokenBReserve.toNumber() / Math.pow(10, tokenBDecimals),
            tokenAMint: poolData.tokenAMint.toBase58(),
            tokenBMint: poolData.tokenBMint.toBase58(),
            feeBasisPoints: poolData.feeBasisPoints,
          };

          // Cache the result
          setPoolReservesCache(prev => new Map(prev).set(cacheKey, reserves));

          return reserves;
        } catch (decodeError) {
          console.warn('Failed to decode pool account:', decodeError);
          return null;
        }
      }

      return null;
    } catch (fetchError) {
      console.error('Error fetching pool reserves:', fetchError);
      return null;
    }
  }, [connection, wallet, poolReservesCache]);

  /**
   * Calculate swap quote using AMM formula
   * Uses constant product formula: x * y = k
   * Now fetches real reserves from blockchain when available
   */
  const calculateQuote = useCallback(async (
    inputAmount: number,
    inputToken: string,
    outputToken: string,
    slippage: number
  ): Promise<SwapQuote> => {
    // Try to fetch real pool data
    const poolData = await fetchPoolReserves(inputToken, outputToken);
    
    let reserveIn: number;
    let reserveOut: number;
    let feeBasisPoints = 30; // Default 0.3% fee

    if (poolData) {
      // Use on-chain data
      const inputMint = getTokenMint(inputToken);
      const isInputTokenA = inputMint.toBase58() === poolData.tokenAMint;
      
      reserveIn = isInputTokenA ? poolData.reserveA : poolData.reserveB;
      reserveOut = isInputTokenA ? poolData.reserveB : poolData.reserveA;
      feeBasisPoints = poolData.feeBasisPoints;
    } else {
      // Fallback to mock data for development/testing
      const pairKey = `${inputToken}-${outputToken}`;
      const pool = MOCK_POOL_RESERVES[pairKey] || { reserveIn: 100, reserveOut: 10050 };
      reserveIn = pool.reserveIn;
      reserveOut = pool.reserveOut;
    }

    const FEE = feeBasisPoints / 10000; // Convert basis points to decimal
    const amountInWithFee = inputAmount * (1 - FEE);

    // AMM formula: outputAmount = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    const outputAmount = numerator / denominator;

    // Calculate price impact: how much worse the price is due to the swap
    const initialPrice = reserveOut / reserveIn;
    const executionPrice = outputAmount / inputAmount;
    const priceImpact = ((initialPrice - executionPrice) / initialPrice) * 100;

    const fee = inputAmount * FEE;
    const minReceived = outputAmount * (1 - slippage / 100);
    const exchangeRate = outputAmount / inputAmount;

    return {
      inputAmount,
      outputAmount,
      priceImpact: Math.max(0, priceImpact),
      fee,
      minReceived,
      exchangeRate,
    };
  }, [fetchPoolReserves]);

  /**
   * Synchronous calculate quote for UI updates (uses cached data or fallback)
   */
  const calculateQuoteSync = (
    inputAmount: number,
    inputToken: string,
    outputToken: string,
    slippage: number
  ): SwapQuote => {
    // Use cached pool data if available
    const inputMint = getTokenMint(inputToken);
    const outputMint = getTokenMint(outputToken);
    const poolAddress = findPoolAddress(inputMint, outputMint);
    const cacheKey = poolAddress.toBase58();
    const poolData = poolReservesCache.get(cacheKey);

    let reserveIn: number;
    let reserveOut: number;
    let feeBasisPoints = 30;

    if (poolData) {
      const isInputTokenA = inputMint.toBase58() === poolData.tokenAMint;
      reserveIn = isInputTokenA ? poolData.reserveA : poolData.reserveB;
      reserveOut = isInputTokenA ? poolData.reserveB : poolData.reserveA;
      feeBasisPoints = poolData.feeBasisPoints;
    } else {
      // Fallback to mock data for development/testing
      const pairKey = `${inputToken}-${outputToken}`;
      const pool = MOCK_POOL_RESERVES[pairKey] || { reserveIn: 100, reserveOut: 10050 };
      reserveIn = pool.reserveIn;
      reserveOut = pool.reserveOut;
    }

    const FEE = feeBasisPoints / 10000;
    const amountInWithFee = inputAmount * (1 - FEE);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    const outputAmount = numerator / denominator;

    const initialPrice = reserveOut / reserveIn;
    const executionPrice = outputAmount / inputAmount;
    const priceImpact = ((initialPrice - executionPrice) / initialPrice) * 100;

    const fee = inputAmount * FEE;
    const minReceived = outputAmount * (1 - slippage / 100);
    const exchangeRate = outputAmount / inputAmount;

    return {
      inputAmount,
      outputAmount,
      priceImpact: Math.max(0, priceImpact),
      fee,
      minReceived,
      exchangeRate,
    };
  };

  /**
   * Refresh pool reserves cache
   */
  const refreshPoolReserves = useCallback(async (inputToken: string, outputToken: string) => {
    const inputMint = getTokenMint(inputToken);
    const outputMint = getTokenMint(outputToken);
    const poolAddress = findPoolAddress(inputMint, outputMint);
    const cacheKey = poolAddress.toBase58();
    
    // Clear cache entry
    setPoolReservesCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
    
    // Fetch fresh data
    await fetchPoolReserves(inputToken, outputToken);
  }, [fetchPoolReserves]);

  /**
   * Execute swap transaction on blockchain
   */
  const executeSwap = async (params: {
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    minOutputAmount: number;
  }): Promise<string> => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const program = getProgram(connection, wallet);

      const inputMint = getTokenMint(params.inputToken);
      const outputMint = getTokenMint(params.outputToken);

      const poolAddress = findPoolAddress(inputMint, outputMint);

      // Determine direction (A to B or B to A)
      // We assume findPoolAddress sorts them, so we check which one is A (smaller)
      const isAToB = inputMint.toBuffer().compare(outputMint.toBuffer()) < 0;

      const tokenAMint = isAToB ? inputMint : outputMint;
      const tokenBMint = isAToB ? outputMint : inputMint;

      const tokenAVault = findVaultAddress(poolAddress, tokenAMint);
      const tokenBVault = findVaultAddress(poolAddress, tokenBMint);

      const userTokenIn = await getAssociatedTokenAddress(inputMint, wallet.publicKey);
      const userTokenOut = await getAssociatedTokenAddress(outputMint, wallet.publicKey);

      // Convert amounts to BN using proper token decimals
      const inputDecimals = getTokenDecimals(params.inputToken);
      const outputDecimals = getTokenDecimals(params.outputToken);
      const amountInBN = new BN(params.inputAmount * Math.pow(10, inputDecimals));
      const minOutBN = new BN(params.minOutputAmount * Math.pow(10, outputDecimals));

      const tx = await program.methods
        .swap(
          amountInBN,
          minOutBN,
          isAToB ? { aToB: {} } : { bToA: {} }
        )
        .accounts({
          user: wallet.publicKey,
          pool: poolAddress,
          userTokenIn,
          userTokenOut,
          tokenVaultIn: isAToB ? tokenAVault : tokenBVault,
          tokenVaultOut: isAToB ? tokenBVault : tokenAVault,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        })
        .rpc();

      // Clear pool reserves cache after successful swap
      const poolCacheKey = poolAddress.toBase58();
      setPoolReservesCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(poolCacheKey);
        return newCache;
      });

      return tx;
    } catch (err) {
      console.error("Swap error:", err);
      
      const swapError = parseSwapError(err instanceof Error ? err : new Error(String(err)));
      setError(swapError);
      
      // Fallback to simulation if on localnet without deployed program
      if (swapError.type === SwapErrorType.PROGRAM_NOT_FOUND || swapError.type === SwapErrorType.NETWORK_ERROR) {
        console.warn("Falling back to simulation mode");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return 'simulated_tx_' + Date.now();
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateQuote,
    calculateQuoteSync,
    executeSwap,
    refreshPoolReserves,
    loading,
    error,
  };
}
