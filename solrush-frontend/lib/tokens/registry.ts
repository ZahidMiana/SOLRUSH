'use client';

import { PublicKey } from '@solana/web3.js';

/**
 * Token information interface
 */
export interface TokenInfo {
  symbol: string;
  name: string;
  mint: PublicKey;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
}

/**
 * Token registry configuration
 */
export interface TokenRegistryConfig {
  chainId: number;
  tokens: TokenInfo[];
}

// Default token registry - can be extended or replaced via environment
const DEFAULT_TOKENS: TokenInfo[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: new PublicKey('So11111111111111111111111111111111111111112'),
    decimals: 9,
    logoURI: '/tokens/sol.png',
    coingeckoId: 'solana',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
    decimals: 6,
    logoURI: '/tokens/usdc.png',
    coingeckoId: 'usd-coin',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: new PublicKey(process.env.NEXT_PUBLIC_USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    decimals: 6,
    logoURI: '/tokens/usdt.png',
    coingeckoId: 'tether',
  },
  {
    symbol: 'RUSH',
    name: 'Rush Token',
    mint: new PublicKey(process.env.NEXT_PUBLIC_RUSH_MINT || '11111111111111111111111111111111'),
    decimals: 6,
    logoURI: '/tokens/rush.png',
    coingeckoId: undefined,
  },
];

/**
 * Token Registry class for managing supported tokens
 */
class TokenRegistry {
  private tokens: Map<string, TokenInfo> = new Map();
  private mintToSymbol: Map<string, string> = new Map();
  
  constructor(initialTokens: TokenInfo[] = DEFAULT_TOKENS) {
    this.loadTokens(initialTokens);
  }
  
  /**
   * Load tokens into the registry
   */
  loadTokens(tokens: TokenInfo[]): void {
    for (const token of tokens) {
      this.tokens.set(token.symbol.toUpperCase(), token);
      this.mintToSymbol.set(token.mint.toBase58(), token.symbol.toUpperCase());
    }
  }
  
  /**
   * Add a new token to the registry
   */
  addToken(token: TokenInfo): void {
    this.tokens.set(token.symbol.toUpperCase(), token);
    this.mintToSymbol.set(token.mint.toBase58(), token.symbol.toUpperCase());
  }
  
  /**
   * Get token info by symbol
   */
  getToken(symbol: string): TokenInfo | undefined {
    return this.tokens.get(symbol.toUpperCase());
  }
  
  /**
   * Get token info by mint address
   */
  getTokenByMint(mint: PublicKey | string): TokenInfo | undefined {
    const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
    const symbol = this.mintToSymbol.get(mintStr);
    return symbol ? this.tokens.get(symbol) : undefined;
  }
  
  /**
   * Get token mint address by symbol
   */
  getMint(symbol: string): PublicKey | undefined {
    return this.tokens.get(symbol.toUpperCase())?.mint;
  }
  
  /**
   * Get token decimals by symbol
   */
  getDecimals(symbol: string): number {
    return this.tokens.get(symbol.toUpperCase())?.decimals ?? 9;
  }
  
  /**
   * Get all registered tokens
   */
  getAllTokens(): TokenInfo[] {
    return Array.from(this.tokens.values());
  }
  
  /**
   * Get all token symbols
   */
  getAllSymbols(): string[] {
    return Array.from(this.tokens.keys());
  }
  
  /**
   * Check if a token is registered
   */
  hasToken(symbol: string): boolean {
    return this.tokens.has(symbol.toUpperCase());
  }
  
  /**
   * Remove a token from the registry
   */
  removeToken(symbol: string): boolean {
    const token = this.tokens.get(symbol.toUpperCase());
    if (token) {
      this.mintToSymbol.delete(token.mint.toBase58());
      return this.tokens.delete(symbol.toUpperCase());
    }
    return false;
  }
}

// Singleton instance
let registryInstance: TokenRegistry | null = null;

/**
 * Get the token registry singleton
 */
export function getTokenRegistry(): TokenRegistry {
  if (!registryInstance) {
    registryInstance = new TokenRegistry();
  }
  return registryInstance;
}

/**
 * Initialize the token registry with custom tokens
 */
export function initializeTokenRegistry(tokens?: TokenInfo[]): TokenRegistry {
  registryInstance = new TokenRegistry(tokens || DEFAULT_TOKENS);
  return registryInstance;
}

/**
 * Convenience function to get token mint by symbol
 */
export function getTokenMintFromRegistry(symbol: string): PublicKey {
  const registry = getTokenRegistry();
  const mint = registry.getMint(symbol);
  if (!mint) {
    throw new Error(`Token not found in registry: ${symbol}`);
  }
  return mint;
}

/**
 * Convenience function to get token decimals by symbol
 */
export function getTokenDecimalsFromRegistry(symbol: string): number {
  return getTokenRegistry().getDecimals(symbol);
}

export { TokenRegistry };
export default getTokenRegistry;
