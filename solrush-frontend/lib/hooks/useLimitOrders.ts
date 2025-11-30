'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useCallback, useEffect } from 'react';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { getProgram, PROGRAM_ID } from '../anchor/setup';
import { findPoolAddress } from '../anchor/pda';
import { getTokenMint, getTokenDecimals } from '../constants';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface LimitOrder {
  id: string;
  publicKey: PublicKey | null;
  owner: string;
  pool: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  targetPrice: number;
  minimumReceive: number;
  status: 'pending' | 'executed' | 'cancelled' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  isOnChain: boolean;
}

interface CreateLimitOrderParams {
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  targetPrice: number;
  minimumReceive: number;
  expiryDays: number;
}

/**
 * Hook for limit order management
 * Connects to on-chain limit order program when available
 */
export function useLimitOrders() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<LimitOrder[]>([]);

  /**
   * Find limit order PDA address
   */
  const findLimitOrderAddress = useCallback((
    poolAddress: PublicKey,
    userAddress: PublicKey
  ): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('limit_order'), poolAddress.toBuffer(), userAddress.toBuffer()],
      PROGRAM_ID
    );
  }, []);

  /**
   * Fetch user's limit orders from blockchain
   */
  const fetchOrders = useCallback(async () => {
    if (!wallet.publicKey) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const program = getProgram(connection, wallet);
      
      // Fetch all limit order accounts owned by the user
      const allOrders = await program.account.limitOrder.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      const fetchedOrders: LimitOrder[] = allOrders.map((order) => {
        const data = order.account;
        const statusMap: { [key: number]: 'pending' | 'executed' | 'cancelled' | 'expired' } = {
          0: 'pending',
          1: 'executed',
          2: 'cancelled',
          3: 'expired',
        };

        return {
          id: order.publicKey.toBase58(),
          publicKey: order.publicKey,
          owner: data.owner.toBase58(),
          pool: data.pool.toBase58(),
          inputToken: 'SOL', // Would need to map from mint
          outputToken: 'USDC', // Would need to map from mint
          inputAmount: Number(data.sellAmount) / 1e9,
          targetPrice: Number(data.targetPrice) / 1e6,
          minimumReceive: Number(data.minimumReceive) / 1e6,
          status: statusMap[(data.status as { pending?: unknown; executed?: unknown; cancelled?: unknown; expired?: unknown }).pending ? 0 : 
                           (data.status as { executed?: unknown }).executed ? 1 : 
                           (data.status as { cancelled?: unknown }).cancelled ? 2 : 3],
          expiresAt: new Date(Number(data.expiresAt) * 1000),
          createdAt: new Date(Number(data.createdAt) * 1000),
          isOnChain: true,
        };
      });

      setOrders(fetchedOrders);
    } catch (err) {
      console.warn('Failed to fetch on-chain orders, using local state:', err);
      // Keep existing local orders if on-chain fetch fails
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  /**
   * Create a new limit order
   */
  const createOrder = useCallback(async (params: CreateLimitOrderParams): Promise<LimitOrder> => {
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
      const [limitOrderPDA] = findLimitOrderAddress(poolAddress, wallet.publicKey);

      // Get user token accounts
      const userTokenIn = await getAssociatedTokenAddress(inputMint, wallet.publicKey);
      const userTokenOut = await getAssociatedTokenAddress(outputMint, wallet.publicKey);

      // Calculate amounts with proper decimals
      const inputDecimals = getTokenDecimals(params.inputToken);
      const outputDecimals = getTokenDecimals(params.outputToken);

      const sellAmountBN = new BN(Math.floor(params.inputAmount * Math.pow(10, inputDecimals)));
      const targetPriceBN = new BN(Math.floor(params.targetPrice * 1e6)); // Price with 6 decimal precision
      const minimumReceiveBN = new BN(Math.floor(params.minimumReceive * Math.pow(10, outputDecimals)));
      const expiryDaysBN = new BN(params.expiryDays);

      try {
        // Try to create on-chain limit order
        const tx = await program.methods
          .createLimitOrder(sellAmountBN, targetPriceBN, minimumReceiveBN, expiryDaysBN)
          .accounts({
            pool: poolAddress,
            limitOrder: limitOrderPDA,
            sellTokenMint: inputMint,
            userTokenIn,
            userTokenOut,
            user: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: new PublicKey('11111111111111111111111111111111'),
            rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
          })
          .rpc();

        console.log('Limit order created on-chain:', tx);

        const newOrder: LimitOrder = {
          id: limitOrderPDA.toBase58(),
          publicKey: limitOrderPDA,
          owner: wallet.publicKey.toBase58(),
          pool: poolAddress.toBase58(),
          inputToken: params.inputToken,
          outputToken: params.outputToken,
          inputAmount: params.inputAmount,
          targetPrice: params.targetPrice,
          minimumReceive: params.minimumReceive,
          status: 'pending',
          expiresAt: new Date(Date.now() + params.expiryDays * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          isOnChain: true,
        };

        setOrders((prev) => [...prev, newOrder]);
        return newOrder;
      } catch (txError: unknown) {
        const errorMessage = txError instanceof Error ? txError.message : 'Unknown error';
        
        // Fall back to local order if program not deployed
        if (errorMessage.includes('Program not found') || errorMessage.includes('FetchError')) {
          console.warn('Program not deployed, creating local limit order');
          
          const localOrder: LimitOrder = {
            id: Date.now().toString(),
            publicKey: null,
            owner: wallet.publicKey.toBase58(),
            pool: poolAddress.toBase58(),
            inputToken: params.inputToken,
            outputToken: params.outputToken,
            inputAmount: params.inputAmount,
            targetPrice: params.targetPrice,
            minimumReceive: params.minimumReceive,
            status: 'pending',
            expiresAt: new Date(Date.now() + params.expiryDays * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            isOnChain: false,
          };

          setOrders((prev) => [...prev, localOrder]);
          return localOrder;
        }

        throw new Error(`Failed to create limit order: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, findLimitOrderAddress]);

  /**
   * Cancel a limit order
   */
  const cancelOrder = useCallback(async (orderId: string): Promise<void> => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.isOnChain && order.publicKey) {
        const program = getProgram(connection, wallet);
        const inputMint = getTokenMint(order.inputToken);
        const userTokenIn = await getAssociatedTokenAddress(inputMint, wallet.publicKey);

        try {
          await program.methods
            .cancelLimitOrder()
            .accounts({
              limitOrder: order.publicKey,
              userTokenIn,
              user: wallet.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();
        } catch (txError: unknown) {
          const errorMessage = txError instanceof Error ? txError.message : 'Unknown error';
          if (!errorMessage.includes('Program not found')) {
            throw txError;
          }
        }
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        )
      );
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, orders]);

  // Fetch orders when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      fetchOrders();
    }
  }, [wallet.publicKey, fetchOrders]);

  return {
    orders,
    loading,
    error,
    createOrder,
    cancelOrder,
    refreshOrders: fetchOrders,
  };
}
