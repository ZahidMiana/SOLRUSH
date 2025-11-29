"use client";

import { useRewards } from "@/lib/hooks/useRewards";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatTokenAmount, formatCurrency } from "@/lib/utils/formatters";

export const RushRewards = () => {
  const { publicKey } = useWallet();
  const rewards = useRewards(publicKey?.toString() || null);

  if (!publicKey) {
    return (
      <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
        <p className="text-gray-400">Connect wallet to see rewards</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">RUSH Rewards</h2>

      <div className="space-y-4">
        {/* Total RUSH */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total RUSH Earned</p>
          <p className="text-white text-2xl font-bold">
            {formatTokenAmount(rewards.totalRush)}
          </p>
        </div>

        {/* Claimable */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Claimable</p>
          <p className="text-green-400 text-xl font-bold">
            {formatTokenAmount(rewards.claimable)}
          </p>
        </div>

        {/* Already Claimed */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Already Claimed</p>
          <p className="text-blue-400 text-lg font-semibold">
            {formatTokenAmount(rewards.claimed)}
          </p>
        </div>
      </div>
    </div>
  );
};
