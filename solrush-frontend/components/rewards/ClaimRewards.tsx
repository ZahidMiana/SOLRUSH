"use client";

import { useRewards } from "@/lib/hooks/useRewards";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatTokenAmount } from "@/lib/utils/formatters";

export const ClaimRewards = () => {
  const { publicKey } = useWallet();
  const rewards = useRewards(publicKey?.toString() || null);

  const handleClaim = async () => {
    await rewards.claimRewards();
  };

  if (!publicKey || rewards.claimable === 0) {
    return (
      <button
        disabled
        className="w-full bg-gray-600 text-gray-400 font-bold py-3 rounded-lg cursor-not-allowed opacity-50"
      >
        No Rewards to Claim
      </button>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={rewards.loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
    >
      {rewards.loading
        ? "Claiming..."
        : `Claim ${formatTokenAmount(rewards.claimable)} RUSH`}
    </button>
  );
};
