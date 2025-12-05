import { PublicKey } from "@solana/web3.js";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  "5AtAVriL32asiRrkSXCLwkYy6E9DefEt6wdtVQVR9CvX"
);

// Token Mints (Devnet) - REAL ADDRESSES FROM DEPLOYMENT
export const SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const USDC_MINT = new PublicKey(
  "7awnAQezfgS6WWJUiG12mLsnnxRBkquXTjrCFhSjoj35" // Real USDC from deployment
);
export const USDT_MINT = new PublicKey(
  "9CHrRN1codejuANpgBEq2QEuhBAjpBBMtFWXMhDiADDn" // Real USDT from deployment
);
export const RUSH_MINT = new PublicKey(
  "GqXCfSZk8kuuzhHpinY5sn19sMYfTkMw5svRfTcYDJ6k" // Real RUSH from deployment
);

// Liquidity Pools - REAL ADDRESSES
export const POOLS = {
  SOL_USDC: {
    name: "SOL/USDC",
    tokenA: SOL_MINT,
    tokenB: USDC_MINT,
    address: new PublicKey("84ZHagR3STya8NGMAV46VPjG7uuTAYS4jJ54m3wjNkey"),
  },
  SOL_USDT: {
    name: "SOL/USDT",
    tokenA: SOL_MINT,
    tokenB: USDT_MINT,
    address: new PublicKey("DuPZshKxPRDsvMM8YjkumP79UqsSpCbwocu8vvUhGq6h"),
  },
  USDC_USDT: {
    name: "USDC/USDT",
    tokenA: USDC_MINT,
    tokenB: USDT_MINT,
    address: new PublicKey("Cqr2raQD6Zxu7mtafPxwUYXg298FqVrW2uLyXQQPvgWP"),
  },
  SOL_RUSH: {
    name: "SOL/RUSH",
    tokenA: SOL_MINT,
    tokenB: RUSH_MINT,
    address: new PublicKey("GZSVEefVZGTmCs9rbVtbQQm2SVppZJw3U8FGer5zjc1H"),
  },
};

// Fees
export const SWAP_FEE_BP = 30; // 0.3%
export const LP_REWARDS_PERCENTAGE = 100; // 100% of fees go to LPs

// TOKENS object for backward compatibility
export const TOKENS = {
  SOL: SOL_MINT,
  USDC: USDC_MINT,
  USDT: USDT_MINT,
  RUSH: RUSH_MINT,
};

/**
 * Get token mint address by symbol
 * @param symbol - Token symbol (SOL, USDC, USDT, etc.)
 * @returns PublicKey of the token mint
 */
export function getTokenMint(symbol: string): PublicKey {
  const mints: Record<string, PublicKey> = {
    SOL: SOL_MINT,
    USDC: USDC_MINT,
    USDT: USDT_MINT,
    RUSH: RUSH_MINT,
  };

  const mint = mints[symbol.toUpperCase()];
  if (!mint) {
    throw new Error(`Unknown token symbol: ${symbol}`);
  }

  return mint;
}

/**
 * Get token decimals by symbol
 * @param symbol - Token symbol
 * @returns Number of decimals
 */
export function getTokenDecimals(symbol: string): number {
  const decimals: Record<string, number> = {
    SOL: 9,
    USDC: 6,
    USDT: 6,
    RUSH: 6,
  };

  return decimals[symbol.toUpperCase()] || 9;
}
