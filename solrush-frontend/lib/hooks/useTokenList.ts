'use client';

import { useState, useEffect } from 'react';

export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
}

// Default/fallback tokens
const DEFAULT_TOKENS: Token[] = [
    {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        tags: ['popular'],
    },
    {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        tags: ['popular', 'stablecoin'],
    },
    {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        tags: ['popular', 'stablecoin'],
    },
];

const CACHE_KEY = 'solrush_token_list';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Custom hook to fetch and manage token list
 * Fetches from Jupiter API and caches in localStorage
 */
export function useTokenList() {
    const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTokenList();
    }, []);

    const fetchTokenList = async () => {
        setLoading(true);
        setError(null);

        try {
            // Check cache first
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { tokens: cachedTokens, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;

                // Use cached data if less than 24 hours old
                if (age < CACHE_DURATION) {
                    setTokens(cachedTokens);
                    setLoading(false);
                    return;
                }
            }

            // Fetch from Jupiter API
            const response = await fetch('https://token.jup.ag/strict');

            if (!response.ok) {
                throw new Error('Failed to fetch token list');
            }

            const data: Token[] = await response.json();

            // Filter and prioritize tokens
            const filteredTokens = data
                .filter(token => token.symbol && token.name && token.decimals)
                .sort((a, b) => {
                    // Prioritize popular tokens
                    const aPopular = a.tags?.includes('popular') ? 1 : 0;
                    const bPopular = b.tags?.includes('popular') ? 1 : 0;
                    if (aPopular !== bPopular) return bPopular - aPopular;

                    // Then sort alphabetically
                    return a.symbol.localeCompare(b.symbol);
                });

            // Cache the result
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                tokens: filteredTokens,
                timestamp: Date.now(),
            }));

            setTokens(filteredTokens);
        } catch (err) {
            console.error('Error fetching token list:', err);
            setError('Failed to fetch token list. Using default tokens.');

            // Use cached data if available, even if expired
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { tokens: cachedTokens } = JSON.parse(cached);
                setTokens(cachedTokens);
            } else {
                setTokens(DEFAULT_TOKENS);
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Search tokens by symbol or name
     */
    const searchTokens = (query: string): Token[] => {
        if (!query) return tokens;

        const lowerQuery = query.toLowerCase();
        return tokens.filter(
            token =>
                token.symbol.toLowerCase().includes(lowerQuery) ||
                token.name.toLowerCase().includes(lowerQuery)
        );
    };

    /**
     * Get token by symbol
     */
    const getTokenBySymbol = (symbol: string): Token | undefined => {
        return tokens.find(token => token.symbol === symbol);
    };

    /**
     * Get token by address
     */
    const getTokenByAddress = (address: string): Token | undefined => {
        return tokens.find(token => token.address === address);
    };

    /**
     * Get popular tokens
     */
    const getPopularTokens = (): Token[] => {
        return tokens.filter(token => token.tags?.includes('popular')).slice(0, 10);
    };

    /**
     * Refresh token list (force fetch)
     */
    const refreshTokenList = () => {
        localStorage.removeItem(CACHE_KEY);
        fetchTokenList();
    };

    return {
        tokens,
        loading,
        error,
        searchTokens,
        getTokenBySymbol,
        getTokenByAddress,
        getPopularTokens,
        refreshTokenList,
    };
}
