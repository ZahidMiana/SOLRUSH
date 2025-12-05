import { PublicKey } from "@solana/web3.js";

export interface TokenConfig {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

export interface PoolConfig {
    name: string;
    poolAddress: string;
    tokenA: TokenConfig;
    tokenB: TokenConfig;
    lpTokenMint: string;
    tokenAVault: string;
    tokenBVault: string;
    initialDepositA: number;
    initialDepositB: number;
    transactionSignature?: string;
}

// Token configurations
export const TOKENS: Record<string, TokenConfig> = {
    SOL: {
        mint: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        decimals: 9,
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
    },
    USDC: {
        mint: "7awnAQezfgS6WWJUiG12mLsnnxRBkquXTjrCFhSjoj35",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
    },
    USDT: {
        mint: "9CHrRN1codejuANpgBEq2QEuhBAjpBBMtFWXMhDiADDn",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png"
    },
    RUSH: {
        mint: "GqXCfSZk8kuuzhHpinY5sn19sMYfTkMw5svRfTcYDJ6k",
        symbol: "RUSH",
        name: "RUSH Token",
        decimals: 6,
    }
};

// Pool configurations from Devnet deployment
export const POOLS: Record<string, PoolConfig> = {
    "SOL/RUSH": {
        name: "SOL/RUSH",
        poolAddress: "GZSVEefVZGTmCs9rbVtbQQm2SVppZJw3U8FGer5zjc1H",
        tokenA: TOKENS.SOL,
        tokenB: TOKENS.RUSH,
        lpTokenMint: "DfuHisRy6s2cNN1k6FHf6qb9x1WT3JQknQ5SABbgnf68",
        tokenAVault: "8o1QPN11ZqvcqqBoV8xFvm9JGea8Uqx6uqnhNJRZR71j",
        tokenBVault: "8qki2eLYLsX7eA4dcW47rgFH1uATd5dX31B8UHNMXijZ",
        initialDepositA: 10000000, // 0.01 SOL
        initialDepositB: 100000000, // 100 RUSH
    },
    "SOL/USDC": {
        name: "SOL/USDC",
        poolAddress: "84ZHagR3STya8NGMAV46VPjG7uuTAYS4jJ54m3wjNkey",
        tokenA: TOKENS.SOL,
        tokenB: TOKENS.USDC,
        lpTokenMint: "5mHzkg8TKYwQ6UroqxSGU4iNz8ge4PaNUXJ6nN3u16qA",
        tokenAVault: "BniY9YL48ucV93MoFsP8oBYsSKsgbFgRgAaJ4BgYzDUc",
        tokenBVault: "82nqNeHNd4vT7mKYpA5Wj52XBksTHEXscJKVGJGytY2Y",
        initialDepositA: 1000000000, // 1 SOL
        initialDepositB: 100000000, // 100 USDC
        transactionSignature: "KV1zMLsYGK2hqCJKjm7iGGrTLUoSuCVbLKZva2Ns2Dr7rwbvvfbDtYm4zKGjaqDuceLrFgvxHabnFCSm7bvuEcQ"
    },
    "SOL/USDT": {
        name: "SOL/USDT",
        poolAddress: "DuPZshKxPRDsvMM8YjkumP79UqsSpCbwocu8vvUhGq6h",
        tokenA: TOKENS.SOL,
        tokenB: TOKENS.USDT,
        lpTokenMint: "J8Ej51yLuAtm45kT3cgYz2AoiZTRZvwsw11riL5occtZ",
        tokenAVault: "3aH1gMAKbUxvtrkviLCMaHU2PXh8jefuwg4Vhmm9sKS7",
        tokenBVault: "E7zEbhmHBDUDiW3WfYq3Zt7V2KWv37z2GKbn6m4SEu68",
        initialDepositA: 1000000000, // 1 SOL
        initialDepositB: 100000000, // 100 USDT
        transactionSignature: "64H8WyeWun8ryJfWSAPj1cpnmT6K4juRuMUgyrZzPFiXYqp3nf7NcshuRXoeHpBhxf8eEj4ed7u5WCNy3wMpZnpT"
    },
    "USDC/USDT": {
        name: "USDC/USDT",
        poolAddress: "Cqr2raQD6Zxu7mtafPxwUYXg298FqVrW2uLyXQQPvgWP",
        tokenA: TOKENS.USDC,
        tokenB: TOKENS.USDT,
        lpTokenMint: "BVM585RsFohVmpK6x86VsTZPmxGEVWiYKgbq3cubK7Vf",
        tokenAVault: "2XYJmyb26JHxhrQpYFUiA6zCqdHfnUuUY4ZmyhKC6Ati",
        tokenBVault: "54tfpDsHmetPrAmpoP4V8JSeukDU7ChwsmGYWirqyai",
        initialDepositA: 10000000000, // 10,000 USDC
        initialDepositB: 10000000000, // 10,000 USDT
        transactionSignature: "5vARnWoaCandiqUBEF23RffLvEEPWDDsx8MZRK22s5KsUKSruxxteGKnJXdEA7GU3aywW92pxV5qJunDrM8h6mjs"
    }
};

// Helper function to get pool by token pair
export function getPoolByTokens(tokenAMint: string, tokenBMint: string): PoolConfig | undefined {
    return Object.values(POOLS).find(pool =>
        (pool.tokenA.mint === tokenAMint && pool.tokenB.mint === tokenBMint) ||
        (pool.tokenA.mint === tokenBMint && pool.tokenB.mint === tokenAMint)
    );
}

// Helper function to get all pool addresses
export function getAllPoolAddresses(): PublicKey[] {
    return Object.values(POOLS).map(pool => new PublicKey(pool.poolAddress));
}

// Export pool names for easy access
export const POOL_NAMES = Object.keys(POOLS);
