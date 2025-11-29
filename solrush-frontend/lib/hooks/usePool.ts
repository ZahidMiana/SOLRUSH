"use client";

import { useState, useEffect } from "react";

interface PoolData {
  tokenAReserve: number;
  tokenBReserve: number;
  lpTokenSupply: number;
  fee: number;
  loading: boolean;
  error: string | null;
}

export const usePool = (poolId: string) => {
  const [pool, setPool] = useState<PoolData>({
    tokenAReserve: 0,
    tokenBReserve: 0,
    lpTokenSupply: 0,
    fee: 0.25,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        setPool((prev) => ({ ...prev, loading: true }));
        // TODO: Fetch actual pool data from blockchain
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPool((prev) => ({
          ...prev,
          loading: false,
          tokenAReserve: 1000,
          tokenBReserve: 1000,
          lpTokenSupply: 1000,
        }));
      } catch (error) {
        setPool((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    fetchPoolData();
  }, [poolId]);

  return pool;
};
