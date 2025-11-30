import { PublicKey } from "@solana/web3.js";
import { getTokenRegistry, type TokenInfo } from './tokens/registry';

// Token mint addresses - configurable via environment variables
export const TOKENS = {
    SOL: new PublicKey("So11111111111111111111111111111111111111112"),
    USDC: new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
    USDT: new PublicKey(process.env.NEXT_PUBLIC_USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    RUSH: new PublicKey(process.env.NEXT_PUBLIC_RUSH_MINT || "11111111111111111111111111111111"),
};

// Token decimals for amount conversions
export const TOKEN_DECIMALS: { [key: string]: number } = {
    SOL: 9,
    USDC: 6,
    USDT: 6,
    RUSH: 6,
};

/**
 * Get token mint address by symbol
 * Uses the token registry if available, falls back to static TOKENS
 */
export const getTokenMint = (symbol: string): PublicKey => {
    try {
        const registry = getTokenRegistry();
        const mint = registry.getMint(symbol);
        if (mint) return mint;
    } catch {
        // Registry not initialized, use static fallback
    }
    
    switch (symbol.toUpperCase()) {
        case 'SOL': return TOKENS.SOL;
        case 'USDC': return TOKENS.USDC;
        case 'USDT': return TOKENS.USDT;
        case 'RUSH': return TOKENS.RUSH;
        default: throw new Error(`Unknown token: ${symbol}`);
    }
};

/**
 * Get token decimals by symbol
 */
export const getTokenDecimals = (symbol: string): number => {
    try {
        const registry = getTokenRegistry();
        return registry.getDecimals(symbol);
    } catch {
        // Registry not initialized, use static fallback
    }
    
    return TOKEN_DECIMALS[symbol.toUpperCase()] ?? 9;
};

/**
 * Get all available tokens
 */
export const getAvailableTokens = (): TokenInfo[] => {
    try {
        return getTokenRegistry().getAllTokens();
    } catch {
        // Return static token list as fallback
        return [
            { symbol: 'SOL', name: 'Solana', mint: TOKENS.SOL, decimals: 9 },
            { symbol: 'USDC', name: 'USD Coin', mint: TOKENS.USDC, decimals: 6 },
            { symbol: 'USDT', name: 'Tether USD', mint: TOKENS.USDT, decimals: 6 },
            { symbol: 'RUSH', name: 'Rush Token', mint: TOKENS.RUSH, decimals: 6 },
        ];
    }
};

export type { TokenInfo };
