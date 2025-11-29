"use client";

import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { useSwap } from "@/lib/hooks/useSwap";

export const SwapInterface = () => {
  const [tokenA, setTokenA] = useState("SOL");
  const [tokenB, setTokenB] = useState("USDC");
  const swap = useSwap();

  const handleSwapDirections = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
  };

  const handleSwap = async () => {
    await swap.executeSwap();
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Swap Tokens</h2>

      {/* Token A Input */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-2 block">You Pay</label>
        <div className="flex gap-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <input
            type="number"
            placeholder="0.00"
            value={swap.amountIn}
            onChange={(e) => {
              swap.setAmountIn(e.target.value);
              swap.amountOut = swap.calculateOutput(e.target.value);
            }}
            className="bg-transparent flex-1 text-white placeholder-gray-500 outline-none text-lg"
          />
          <select
            value={tokenA}
            onChange={(e) => setTokenA(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded font-semibold cursor-pointer"
          >
            <option>SOL</option>
            <option>USDC</option>
            <option>USDT</option>
          </select>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSwapDirections}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowDownUp className="text-blue-400" size={20} />
        </button>
      </div>

      {/* Token B Output */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm mb-2 block">You Receive</label>
        <div className="flex gap-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <input
            type="number"
            placeholder="0.00"
            value={swap.amountOut}
            disabled
            className="bg-transparent flex-1 text-white placeholder-gray-500 outline-none text-lg cursor-not-allowed opacity-50"
          />
          <select
            value={tokenB}
            onChange={(e) => setTokenB(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded font-semibold cursor-pointer"
          >
            <option>USDC</option>
            <option>SOL</option>
            <option>USDT</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {swap.error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4">
          {swap.error}
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!swap.amountIn || swap.loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
      >
        {swap.loading ? "Processing..." : "Swap"}
      </button>

      {swap.success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-lg mt-4">
          Swap successful!
        </div>
      )}
    </div>
  );
};
