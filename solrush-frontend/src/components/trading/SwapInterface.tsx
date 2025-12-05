'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSwap } from '@/lib/hooks/useSwap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownUp, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface SwapInterfaceProps {
    onTokenChange?: (inputToken: string, outputToken: string) => void;
}

const TOKENS = ['SOL', 'USDC', 'USDT', 'RUSH'];

export function SwapInterface({ onTokenChange }: SwapInterfaceProps) {
    const { connected } = useWallet();
    const { calculateQuote, executeSwap, createLimitOrder, loading, error } = useSwap();

    const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'buy' | 'sell'>('swap');
    const [inputToken, setInputToken] = useState('SOL');
    const [outputToken, setOutputToken] = useState('USDC');
    const [inputAmount, setInputAmount] = useState('');
    const [slippage, setSlippage] = useState(1);
    const [limitPrice, setLimitPrice] = useState('');
    const [expiryDays, setExpiryDays] = useState(7);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Calculate quote
    const quote = calculateQuote(
        parseFloat(inputAmount) || 0,
        inputToken,
        outputToken,
        slippage
    );

    // Notify parent of token changes
    useEffect(() => {
        onTokenChange?.(inputToken, outputToken);
    }, [inputToken, outputToken, onTokenChange]);

    // Swap tokens
    const handleSwap = () => {
        setInputToken(outputToken);
        setOutputToken(inputToken);
        setInputAmount(quote.outputAmount.toFixed(6));
    };

    // Execute swap
    const handleExecuteSwap = async () => {
        if (!connected || !inputAmount) return;

        try {
            const tx = await executeSwap({
                inputToken,
                outputToken,
                inputAmount: parseFloat(inputAmount),
                minOutputAmount: quote.minReceived
            });

            setTxSignature(tx);
            setInputAmount('');
        } catch (err: any) {
            console.error('Swap failed:', err);
        }
    };

    // Execute limit order
    const handleLimitOrder = () => {
        if (!connected || !inputAmount || !limitPrice) return;

        try {
            createLimitOrder(
                inputToken,
                outputToken,
                parseFloat(inputAmount),
                parseFloat(limitPrice),
                expiryDays
            );

            setInputAmount('');
            setLimitPrice('');
            alert('Limit order created successfully!');
        } catch (err: any) {
            console.error('Limit order failed:', err);
        }
    };

    // Market Buy
    const handleMarketBuy = async () => {
        if (!connected || !inputAmount) return;

        try {
            const tx = await executeSwap({
                inputToken: outputToken, // Spend outputToken to buy inputToken
                outputToken: inputToken,
                inputAmount: parseFloat(inputAmount),
                minOutputAmount: parseFloat(inputAmount) * 0.99 // 1% slippage
            });

            setTxSignature(tx);
            setInputAmount('');
            alert(`Market Buy executed! Bought ${inputToken}`);
        } catch (err: any) {
            console.error('Market buy failed:', err);
        }
    };

    // Market Sell
    const handleMarketSell = async () => {
        if (!connected || !inputAmount) return;

        try {
            const tx = await executeSwap({
                inputToken: inputToken,
                outputToken: outputToken,
                inputAmount: parseFloat(inputAmount),
                minOutputAmount: quote.minReceived
            });

            setTxSignature(tx);
            setInputAmount('');
            alert(`Market Sell executed! Sold ${inputToken}`);
        } catch (err: any) {
            console.error('Market sell failed:', err);
        }
    };

    return (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="swap">Swap</TabsTrigger>
                    <TabsTrigger value="limit">Limit</TabsTrigger>
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>

                {/* Swap Tab */}
                <TabsContent value="swap" className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-white/60">You pay</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0.0"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <select
                                value={inputToken}
                                onChange={(e) => setInputToken(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 text-white"
                            >
                                {TOKENS.map((symbol) => (
                                    <option key={symbol} value={symbol}>{symbol}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleSwap}
                        className="w-full flex justify-center py-2 hover:bg-white/5 rounded-lg transition"
                    >
                        <ArrowDownUp className="w-5 h-5 text-white/40" />
                    </button>

                    <div className="space-y-2">
                        <label className="text-sm text-white/60">You receive</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0.0"
                                value={quote.outputAmount > 0 ? quote.outputAmount.toFixed(6) : ''}
                                readOnly
                                className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <select
                                value={outputToken}
                                onChange={(e) => setOutputToken(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 text-white"
                            >
                                {TOKENS.map((symbol) => (
                                    <option key={symbol} value={symbol}>{symbol}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {quote.outputAmount > 0 && (
                        <div className="text-sm text-white/40 space-y-1">
                            <div className="flex justify-between">
                                <span>Rate:</span>
                                <span>1 {inputToken} = {quote.exchangeRate.toFixed(6)} {outputToken}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fee (0.3%):</span>
                                <span>{quote.fee.toFixed(6)} {inputToken}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Min received:</span>
                                <span>{quote.minReceived.toFixed(6)} {outputToken}</span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleExecuteSwap}
                        disabled={!connected || !inputAmount || loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : !connected ? (
                            'Connect Wallet'
                        ) : (
                            'Swap'
                        )}
                    </Button>
                </TabsContent>

                {/* Limit Order Tab */}
                <TabsContent value="limit" className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-white/60">Amount to sell</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0.0"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                                {inputToken}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-white/60">Target price</label>
                        <Input
                            type="number"
                            placeholder="0.0"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-white/60">Expiry (days)</label>
                        <Input
                            type="number"
                            value={expiryDays}
                            onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <Button
                        onClick={handleLimitOrder}
                        disabled={!connected || !inputAmount || !limitPrice}
                        className="w-full"
                    >
                        Create Limit Order
                    </Button>
                </TabsContent>

                {/* Market Buy Tab */}
                <TabsContent value="buy" className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                        <p className="text-sm text-green-400">Buy {inputToken} at current market price</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-white/60">Amount to buy</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0.0"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                                {inputToken}
                            </span>
                        </div>
                    </div>

                    {quote.outputAmount > 0 && (
                        <div className="text-sm text-white/40 space-y-1">
                            <div className="flex justify-between">
                                <span>You will spend:</span>
                                <span>~{(parseFloat(inputAmount) / quote.exchangeRate).toFixed(6)} {outputToken}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Current price:</span>
                                <span>{quote.exchangeRate.toFixed(6)} {outputToken}/{inputToken}</span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleMarketBuy}
                        disabled={!connected || !inputAmount || loading}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {loading ? 'Buying...' : `Market Buy ${inputToken}`}
                    </Button>
                </TabsContent>

                {/* Market Sell Tab */}
                <TabsContent value="sell" className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                        <p className="text-sm text-red-400">Sell {inputToken} at current market price</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-white/60">Amount to sell</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0.0"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                                {inputToken}
                            </span>
                        </div>
                    </div>

                    {quote.outputAmount > 0 && (
                        <div className="text-sm text-white/40 space-y-1">
                            <div className="flex justify-between">
                                <span>You will receive:</span>
                                <span>~{quote.outputAmount.toFixed(6)} {outputToken}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Current price:</span>
                                <span>{quote.exchangeRate.toFixed(6)} {outputToken}/{inputToken}</span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleMarketSell}
                        disabled={!connected || !inputAmount || loading}
                        className="w-full bg-red-600 hover:bg-red-700"
                    >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        {loading ? 'Selling...' : `Market Sell ${inputToken}`}
                    </Button>
                </TabsContent>
            </Tabs>

            {/* Transaction Success */}
            {txSignature && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">Transaction successful!</p>
                    <p className="text-xs text-green-400/60 font-mono break-all">{txSignature}</p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
        </Card>
    );
}
