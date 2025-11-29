"use client";

import { useState } from "react";
import { usePool } from "@/lib/hooks/usePool";

interface AddLiquidityProps {
  poolId: string;
  tokenAName: string;
  tokenBName: string;
}

export const AddLiquidity = ({
  poolId,
  tokenAName,
  tokenBName,
}: AddLiquidityProps) => {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const pool = usePool(poolId);

  const handleAddLiquidity = async () => {
    setLoading(true);
    // TODO: Execute add liquidity transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setAmountA("");
    setAmountB("");
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Add Liquidity</h2>

      {/* Amount A */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-2 block">{tokenAName}</label>
        <input
          type="number"
          placeholder="0.00"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
          className="w-full bg-gray-800 text-white placeholder-gray-500 outline-none px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500"
        />
      </div>

      {/* Amount B */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm mb-2 block">{tokenBName}</label>
        <input
          type="number"
          placeholder="0.00"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
          className="w-full bg-gray-800 text-white placeholder-gray-500 outline-none px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500"
        />
      </div>

      {/* Pool Stats */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Pool Fee:</span>
          <span className="text-white font-semibold">{pool.fee}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Pool Size:</span>
          <span className="text-white font-semibold">
            ${(pool.tokenAReserve + pool.tokenBReserve).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddLiquidity}
        disabled={!amountA || !amountB || loading || pool.loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
      >
        {loading ? "Adding..." : "Add Liquidity"}
      </button>
    </div>
  );
};
