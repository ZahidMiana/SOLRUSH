import { PublicKey, clusterApiUrl } from "@solana/web3.js";

// Network configuration
export type NetworkType = 'localnet' | 'devnet' | 'mainnet-beta';

const getNetworkUrl = (): string => {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as NetworkType;
  
  // Allow custom RPC URL override
  const customRpc = process.env.NEXT_PUBLIC_RPC_URL;
  if (customRpc) {
    return customRpc;
  }
  
  switch (network) {
    case 'localnet':
      return 'http://127.0.0.1:8899';
    case 'mainnet-beta':
      return clusterApiUrl('mainnet-beta');
    case 'devnet':
    default:
      return clusterApiUrl('devnet');
  }
};

export const DEVNET_RPC = getNetworkUrl();
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT"
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
