"use client";

import { useState } from "react";

export const RemoveLiquidity = ({
  poolId,
  tokenAName,
  tokenBName,
}: {
  poolId: string;
  tokenAName: string;
  tokenBName: string;
}) => {
  const [lpAmount, setLpAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRemoveLiquidity = async () => {
    setLoading(true);
    // TODO: Execute remove liquidity transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setLpAmount("");
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Remove Liquidity</h2>

      {/* LP Amount */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm mb-2 block">
          LP Tokens to Burn
        </label>
        <input
          type="number"
          placeholder="0.00"
          value={lpAmount}
          onChange={(e) => setLpAmount(e.target.value)}
          className="w-full bg-gray-800 text-white placeholder-gray-500 outline-none px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500"
        />
      </div>

      {/* Preview */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <p className="text-gray-400 text-sm mb-2">You will receive:</p>
        <div className="flex justify-between mb-2">
          <span className="text-white">{tokenAName}</span>
          <span className="text-white font-semibold">~0.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white">{tokenBName}</span>
          <span className="text-white font-semibold">~0.00</span>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemoveLiquidity}
        disabled={!lpAmount || loading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
      >
        {loading ? "Removing..." : "Remove Liquidity"}
      </button>
    </div>
  );
};
