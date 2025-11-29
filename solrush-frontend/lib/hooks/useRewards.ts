"use client";

import { useState, useEffect } from "react";

interface RewardData {
  totalRush: number;
  claimable: number;
  claimed: number;
  loading: boolean;
  error: string | null;
}

export const useRewards = (walletAddress: string | null) => {
  const [rewards, setRewards] = useState<RewardData>({
    totalRush: 0,
    claimable: 0,
    claimed: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!walletAddress) {
      setRewards((prev) => ({ ...prev, loading: false }));
      return;
    }

    const fetchRewards = async () => {
      try {
        setRewards((prev) => ({ ...prev, loading: true }));
        // TODO: Fetch actual rewards from blockchain
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRewards((prev) => ({
          ...prev,
          loading: false,
          totalRush: 1500,
          claimable: 500,
          claimed: 1000,
        }));
      } catch (error) {
        setRewards((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to fetch rewards",
        }));
      }
    };

    fetchRewards();
  }, [walletAddress]);

  const claimRewards = async () => {
    try {
      setRewards((prev) => ({ ...prev, loading: true }));
      // TODO: Execute claim transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setRewards((prev) => ({
        ...prev,
        loading: false,
        claimable: 0,
        claimed: prev.claimed + prev.claimable,
      }));
    } catch (error) {
      setRewards((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Claim failed",
      }));
    }
  };

  return { ...rewards, claimRewards };
};
