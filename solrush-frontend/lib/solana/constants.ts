import { PublicKey } from "@solana/web3.js";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  "3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT"
);

// Token Mints (Devnet)
export const SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const USDC_MINT = new PublicKey(
  "EPjFWaJY42sPiKrraxgS5g5Pab9BbAJtPREHtVb2nNB" // This is actual USDC, check testnet
);
export const USDT_MINT = new PublicKey(
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
);
export const WETH_MINT = new PublicKey(
  "7vfCXTUXx5WJV5JAWYwqBo7dropjUiWDPvR8Ch3HfFPc"
);
export const RUSH_MINT = new PublicKey(
  "3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT"
);

// Liquidity Pools
export const POOLS = {
  SOL_USDC: {
    name: "SOL/USDC",
    tokenA: SOL_MINT,
    tokenB: USDC_MINT,
  },
  SOL_USDT: {
    name: "SOL/USDT",
    tokenA: SOL_MINT,
    tokenB: USDT_MINT,
  },
  SOL_WETH: {
    name: "SOL/wETH",
    tokenA: SOL_MINT,
    tokenB: WETH_MINT,
  },
};

// Fees
export const SWAP_FEE_BP = 25; // 0.25%
export const LP_REWARDS_PERCENTAGE = 80; // 80% of fees go to LPs
