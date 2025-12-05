import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '../solana/program';
import { PublicKey } from '@solana/web3.js';
import { TOKENS } from '../constants';

export interface Pool {
    id: string;
    name: string;
    tokens: string[];
    address: string;
    tvl: number;
    apy: number;
    fee: number;
    volume24h: number;
    reserveA: number;
    reserveB: number;
}

export const usePools = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [pools, setPools] = useState<Pool[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPools = async () => {
        setLoading(true);
        try {
            // If wallet not connected, show mock pools
            if (!wallet.publicKey) {
                const mockPools: Pool[] = [
                    {
                        id: 'sol-usdc-pool',
                        name: 'SOL/USDC',
                        tokens: ['SOL', 'USDC'],
                        address: '11111111111111111111111111111111',
                        tvl: 125000,
                        apy: 24.5,
                        fee: 0.3,
                        volume24h: 45000,
                        reserveA: 500,
                        reserveB: 50000,
                    },
                    {
                        id: 'sol-usdt-pool',
                        name: 'SOL/USDT',
                        tokens: ['SOL', 'USDT'],
                        address: '22222222222222222222222222222222',
                        tvl: 98000,
                        apy: 18.2,
                        fee: 0.3,
                        volume24h: 32000,
                        reserveA: 400,
                        reserveB: 40000,
                    },
                    {
                        id: 'usdc-usdt-pool',
                        name: 'USDC/USDT',
                        tokens: ['USDC', 'USDT'],
                        address: '33333333333333333333333333333333',
                        tvl: 75000,
                        apy: 12.8,
                        fee: 0.1,
                        volume24h: 28000,
                        reserveA: 37500,
                        reserveB: 37500,
                    },
                ];
                setPools(mockPools);
                setLoading(false);
                return;
            }

            const program = getProgram(connection, wallet);
            // Fetch all liquidity pool accounts
            // @ts-ignore - Anchor types might be tricky without full generation
            const poolAccounts = await program.account.liquidityPool.all();

            if (poolAccounts.length === 0) {
                // Show mock pools if no real pools exist
                const mockPools: Pool[] = [
                    {
                        id: 'sol-usdc-pool',
                        name: 'SOL/USDC',
                        tokens: ['SOL', 'USDC'],
                        address: '11111111111111111111111111111111',
                        tvl: 125000,
                        apy: 24.5,
                        fee: 0.3,
                        volume24h: 45000,
                        reserveA: 500,
                        reserveB: 50000,
                    },
                    {
                        id: 'sol-usdt-pool',
                        name: 'SOL/USDT',
                        tokens: ['SOL', 'USDT'],
                        address: '22222222222222222222222222222222',
                        tvl: 98000,
                        apy: 18.2,
                        fee: 0.3,
                        volume24h: 32000,
                        reserveA: 400,
                        reserveB: 40000,
                    },
                    {
                        id: 'usdc-usdt-pool',
                        name: 'USDC/USDT',
                        tokens: ['USDC', 'USDT'],
                        address: '33333333333333333333333333333333',
                        tvl: 75000,
                        apy: 12.8,
                        fee: 0.1,
                        volume24h: 28000,
                        reserveA: 37500,
                        reserveB: 37500,
                    },
                ];
                setPools(mockPools);
                setLoading(false);
                return;
            }

            const formattedPools = poolAccounts.map((account: any) => {
                const data = account.account;

                // Determine token names (simplified logic)
                // In a real app, we'd fetch mint metadata
                let tokenAName = 'Unknown';
                let tokenBName = 'Unknown';

                if (data.tokenAMint.toBase58() === TOKENS.SOL.toBase58()) tokenAName = 'SOL';
                else if (data.tokenAMint.toBase58() === TOKENS.USDC.toBase58()) tokenAName = 'USDC';
                else if (data.tokenAMint.toBase58() === TOKENS.USDT.toBase58()) tokenAName = 'USDT';
                else if (data.tokenAMint.toBase58() === TOKENS.RUSH.toBase58()) tokenAName = 'RUSH';

                if (data.tokenBMint.toBase58() === TOKENS.SOL.toBase58()) tokenBName = 'SOL';
                else if (data.tokenBMint.toBase58() === TOKENS.USDC.toBase58()) tokenBName = 'USDC';
                else if (data.tokenBMint.toBase58() === TOKENS.USDT.toBase58()) tokenBName = 'USDT';
                else if (data.tokenBMint.toBase58() === TOKENS.RUSH.toBase58()) tokenBName = 'RUSH';

                // Calculate virtual TVL (simplified)
                // Assuming 1 SOL = $100, 1 USDC = $1
                let priceA = 0;
                let priceB = 0;

                if (tokenAName === 'SOL') priceA = 100;
                if (tokenAName === 'USDC' || tokenAName === 'USDT') priceA = 1;

                if (tokenBName === 'SOL') priceB = 100;
                if (tokenBName === 'USDC' || tokenBName === 'USDT') priceB = 1;

                const reserveA = data.tokenAReserve.toNumber() / (tokenAName === 'SOL' ? 1e9 : 1e6);
                const reserveB = data.tokenBReserve.toNumber() / (tokenBName === 'SOL' ? 1e9 : 1e6);

                const tvl = (reserveA * priceA) + (reserveB * priceB);

                return {
                    id: account.publicKey.toBase58(),
                    name: `${tokenAName}/${tokenBName}`,
                    tokens: [tokenAName, tokenBName],
                    address: account.publicKey.toBase58(),
                    tvl: tvl,
                    apy: 0, // TODO: Calculate APY based on volume/fees
                    fee: data.feeBasisPoints / 10000 * 100, // e.g. 25 / 10000 * 100 = 0.25%
                    volume24h: 0, // No historical data indexer
                    reserveA,
                    reserveB
                };
            });

            setPools(formattedPools);
        } catch (error) {
            console.error('Error fetching pools:', error);
            // Show mock pools on error
            const mockPools: Pool[] = [
                {
                    id: 'sol-usdc-pool',
                    name: 'SOL/USDC',
                    tokens: ['SOL', 'USDC'],
                    address: '11111111111111111111111111111111',
                    tvl: 125000,
                    apy: 24.5,
                    fee: 0.3,
                    volume24h: 45000,
                    reserveA: 500,
                    reserveB: 50000,
                },
                {
                    id: 'sol-usdt-pool',
                    name: 'SOL/USDT',
                    tokens: ['SOL', 'USDT'],
                    address: '22222222222222222222222222222222',
                    tvl: 98000,
                    apy: 18.2,
                    fee: 0.3,
                    volume24h: 32000,
                    reserveA: 400,
                    reserveB: 40000,
                },
                {
                    id: 'usdc-usdt-pool',
                    name: 'USDC/USDT',
                    tokens: ['USDC', 'USDT'],
                    address: '33333333333333333333333333333333',
                    tvl: 75000,
                    apy: 12.8,
                    fee: 0.1,
                    volume24h: 28000,
                    reserveA: 37500,
                    reserveB: 37500,
                },
            ];
            setPools(mockPools);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPools();
    }, [wallet.publicKey]);

    const handleAddLiquidity = async (params: { amountA: number; amountB: number }) => {
        console.log('Add liquidity:', params);
        // Placeholder - would call smart contract
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'mock_tx_signature';
    };

    return {
        pools,
        loading,
        fetchPools,
        handleAddLiquidity,
    };
};
