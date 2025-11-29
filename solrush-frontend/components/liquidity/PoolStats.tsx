"use client";

interface PoolStatsProps {
  poolName: string;
  tokenAReserve: number;
  tokenBReserve: number;
  lpTokenSupply: number;
  fee: number;
  volume24h: number;
}

export const PoolStats = ({
  poolName,
  tokenAReserve,
  tokenBReserve,
  lpTokenSupply,
  fee,
  volume24h,
}: PoolStatsProps) => {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">{poolName} Pool</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Token A Reserve */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Token A Reserve</p>
          <p className="text-white text-lg font-semibold">
            {tokenAReserve.toLocaleString()}
          </p>
        </div>

        {/* Token B Reserve */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Token B Reserve</p>
          <p className="text-white text-lg font-semibold">
            {tokenBReserve.toLocaleString()}
          </p>
        </div>

        {/* LP Supply */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">LP Token Supply</p>
          <p className="text-white text-lg font-semibold">
            {lpTokenSupply.toLocaleString()}
          </p>
        </div>

        {/* Fee */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Fee</p>
          <p className="text-white text-lg font-semibold">{fee}%</p>
        </div>

        {/* 24h Volume */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 col-span-2">
          <p className="text-gray-400 text-sm mb-1">24h Volume</p>
          <p className="text-white text-lg font-semibold">
            ${volume24h.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
