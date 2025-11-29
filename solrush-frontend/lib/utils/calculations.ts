/**
 * Calculate output amount using AMM formula (x * y = k)
 */
export const calculateSwapOutput = (
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBasisPoints: number = 25
): number => {
  const fee = Math.floor((amountIn * feeBasisPoints) / 10000);
  const amountInWithFee = amountIn - fee;

  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;

  return Math.floor(numerator / denominator);
};

/**
 * Calculate price impact percentage
 */
export const calculatePriceImpact = (
  amountIn: number,
  amountOut: number,
  reserveIn: number,
  reserveOut: number
): number => {
  const spotPrice = (reserveOut * 1000) / reserveIn;
  const executionPrice = (amountOut * 1000) / amountIn;
  const impact = ((spotPrice - executionPrice) * 100) / spotPrice;
  return impact / 100;
};

/**
 * Calculate LP token amount
 */
export const calculateLPTokens = (
  amountA: number,
  amountB: number,
  reserveA: number,
  reserveB: number,
  totalSupply: number
): number => {
  if (reserveA === 0 || reserveB === 0) {
    return Math.sqrt(amountA * amountB);
  }

  const liquidity1 = (amountA * totalSupply) / reserveA;
  const liquidity2 = (amountB * totalSupply) / reserveB;

  return Math.min(liquidity1, liquidity2);
};

/**
 * Format number with decimals
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Convert lamports to SOL
 */
export const lamportsToSol = (lamports: number): number => {
  return lamports / 1e9;
};

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * 1e9);
};
