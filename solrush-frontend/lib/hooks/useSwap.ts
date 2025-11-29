"use client";

import { useState } from "react";

interface SwapState {
  amountIn: string;
  amountOut: string;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useSwap = () => {
  const [state, setState] = useState<SwapState>({
    amountIn: "",
    amountOut: "",
    loading: false,
    error: null,
    success: false,
  });

  const calculateOutput = (amountIn: string) => {
    // TODO: Calculate based on pool reserves and AMM formula
    const output = parseFloat(amountIn) * 0.99; // 0.25% fee
    return output.toString();
  };

  const executeSwap = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // TODO: Execute swap transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setState((prev) => ({
        ...prev,
        loading: false,
        success: true,
        amountIn: "",
        amountOut: "",
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Swap failed",
      }));
    }
  };

  return {
    ...state,
    calculateOutput,
    executeSwap,
    setAmountIn: (amount: string) =>
      setState((prev) => ({ ...prev, amountIn: amount })),
  };
};
