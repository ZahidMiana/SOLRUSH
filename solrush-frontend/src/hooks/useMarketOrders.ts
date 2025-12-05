import { useState, useCallback } from "react";
import { useSwap } from "./useSwap";

export interface MarketOrderParams {
    poolName: string;
    amount: number;
    isBuy: boolean; // true = buy tokenA with tokenB, false = sell tokenA for tokenB
    slippageTolerance?: number; // percentage, default 1%
}

/**
 * Hook for market buy/sell functionality
 * Market orders are essentially swaps at the current market price with slippage protection
 */
export function useMarketOrders() {
    const { executeSwap, calculateSwapOutput, loading, error } = useSwap();
    const [priceImpact, setPriceImpact] = useState<number>(0);

    /**
     * Calculate price impact of a market order
     */
    const calculatePriceImpact = useCallback(async (
        poolName: string,
        amountIn: number,
        isAToB: boolean
    ): Promise<number> => {
        try {
            const amountOut = await calculateSwapOutput(poolName, amountIn, isAToB);

            // Simple price impact calculation
            // impact = (amountIn / amountOut - idealPrice) / idealPrice * 100
            // For now, we'll use a simplified version
            const impact = (amountIn * 0.003) * 100; // 0.3% fee as base impact

            setPriceImpact(impact);
            return impact;
        } catch (err) {
            return 0;
        }
    }, [calculateSwapOutput]);

    /**
     * Execute a market buy order
     * Buy tokenA with tokenB at current market price
     */
    const marketBuy = useCallback(async (params: MarketOrderParams): Promise<string> => {
        const slippage = params.slippageTolerance || 1; // 1% default slippage

        // Calculate expected output
        const expectedOutput = await calculateSwapOutput(
            params.poolName,
            params.amount,
            false // tokenB to tokenA
        );

        // Apply slippage tolerance
        const minAmountOut = expectedOutput * (1 - slippage / 100);

        // Execute swap (tokenB to tokenA)
        const result = await executeSwap({
            poolName: params.poolName,
            amountIn: params.amount,
            minAmountOut: minAmountOut,
            isAToB: false
        });

        return result.signature;
    }, [calculateSwapOutput, executeSwap]);

    /**
     * Execute a market sell order
     * Sell tokenA for tokenB at current market price
     */
    const marketSell = useCallback(async (params: MarketOrderParams): Promise<string> => {
        const slippage = params.slippageTolerance || 1; // 1% default slippage

        // Calculate expected output
        const expectedOutput = await calculateSwapOutput(
            params.poolName,
            params.amount,
            true // tokenA to tokenB
        );

        // Apply slippage tolerance
        const minAmountOut = expectedOutput * (1 - slippage / 100);

        // Execute swap (tokenA to tokenB)
        const result = await executeSwap({
            poolName: params.poolName,
            amountIn: params.amount,
            minAmountOut: minAmountOut,
            isAToB: true
        });

        return result.signature;
    }, [calculateSwapOutput, executeSwap]);

    return {
        marketBuy,
        marketSell,
        calculatePriceImpact,
        priceImpact,
        loading,
        error
    };
}
