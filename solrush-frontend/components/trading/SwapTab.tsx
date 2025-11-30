'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TokenSelect } from '@/components/ui/token-select';
import { ArrowUpDown } from 'lucide-react';
import { useSwap, SwapErrorType } from '@/lib/hooks/useSwap';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface SwapTabProps {
    slippageTolerance: number;
    onTokenChange?: (inputToken: string, outputToken: string) => void;
}

export function SwapTab({ slippageTolerance, onTokenChange }: SwapTabProps) {
    const { publicKey } = useWallet();
    const { toast } = useToast();
    const { calculateQuoteSync, calculateQuote, executeSwap, refreshPoolReserves, loading, error } = useSwap();

    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('');
    const [inputToken, setInputToken] = useState('SOL');
    const [outputToken, setOutputToken] = useState('USDC');

    // Use synchronous quote for immediate UI updates
    const currentQuote = calculateQuoteSync(
        parseFloat(inputAmount) || 0,
        inputToken,
        outputToken,
        slippageTolerance
    );

    useEffect(() => {
        onTokenChange?.(inputToken, outputToken);
    }, [inputToken, outputToken, onTokenChange]);

    // Update output amount and fetch real pool data when inputs change
    useEffect(() => {
        if (inputAmount && parseFloat(inputAmount) > 0) {
            // Use sync quote for immediate UI feedback
            const quote = calculateQuoteSync(
                parseFloat(inputAmount),
                inputToken,
                outputToken,
                slippageTolerance
            );
            setOutputAmount(quote.outputAmount.toFixed(6));
            
            // Also fetch real pool data in background (async)
            calculateQuote(
                parseFloat(inputAmount),
                inputToken,
                outputToken,
                slippageTolerance
            ).then((asyncQuote) => {
                // Update if the async quote differs significantly
                if (Math.abs(asyncQuote.outputAmount - quote.outputAmount) > 0.000001) {
                    setOutputAmount(asyncQuote.outputAmount.toFixed(6));
                }
            }).catch(console.error);
        } else {
            setOutputAmount('');
        }
    }, [inputAmount, inputToken, outputToken, slippageTolerance, calculateQuoteSync, calculateQuote]);

    // Refresh pool data when tokens change
    useEffect(() => {
        refreshPoolReserves(inputToken, outputToken).catch(console.error);
    }, [inputToken, outputToken, refreshPoolReserves]);

    const handleSwitchTokens = () => {
        setInputToken(outputToken);
        setOutputToken(inputToken);
        setInputAmount(outputAmount);
        setOutputAmount('');
    };

    const handleSwap = async () => {
        if (!publicKey) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Please connect your wallet to continue.',
            });
            return;
        }

        if (!inputAmount || parseFloat(inputAmount) <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a valid amount.',
            });
            return;
        }

        try {
            // Get fresh quote before executing
            const quote = await calculateQuote(
                parseFloat(inputAmount),
                inputToken,
                outputToken,
                slippageTolerance
            );

            const signature = await executeSwap({
                inputToken,
                outputToken,
                inputAmount: parseFloat(inputAmount),
                minOutputAmount: quote.minReceived,
            });

            toast({
                title: 'Swap Successful!',
                description: `Swapped ${inputAmount} ${inputToken} for ${outputAmount} ${outputToken}. TX: ${signature.slice(0, 8)}...`,
            });

            setInputAmount('');
            setOutputAmount('');
            
            // Refresh pool reserves after swap
            refreshPoolReserves(inputToken, outputToken).catch(console.error);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed. Please try again.';
            toast({
                title: 'Swap Failed',
                description: errorMessage,
            });
        }
    };

    // Show error feedback if there's a swap error
    const getErrorMessage = () => {
        if (!error) return null;
        switch (error.type) {
            case SwapErrorType.INSUFFICIENT_FUNDS:
                return 'Insufficient balance';
            case SwapErrorType.SLIPPAGE_EXCEEDED:
                return 'Slippage exceeded - try increasing tolerance';
            case SwapErrorType.INSUFFICIENT_LIQUIDITY:
                return 'Insufficient pool liquidity';
            default:
                return null;
        }
    };

    const errorMessage = getErrorMessage();

    return (
        <div className="space-y-4">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200">
                    {errorMessage}
                </div>
            )}

            {/* Input Section */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-white/40">
                        You Pay
                    </label>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>Balance: 10.5 {inputToken}</span>
                        <button
                            onClick={() => setInputAmount('10.5')}
                            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                        >
                            Max
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        placeholder="0.0"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        className="bg-transparent border-none text-3xl font-bold h-auto focus:ring-0 px-0 placeholder:text-white/20 w-full text-white"
                    />
                    <div className="min-w-[80px]">
                        <TokenSelect
                            value={inputToken}
                            onChange={(token) => {
                                const symbol = typeof token === 'string' ? token : token.symbol;
                                setInputToken(symbol);
                            }}
                            exclude={[outputToken]}
                            compact={true}
                        />
                    </div>
                </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-3 z-10 relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSwitchTokens}
                    className="rounded-full bg-[#1a1a2e] border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all h-10 w-10 shadow-lg"
                >
                    <ArrowUpDown className="h-5 w-5 text-purple-400" />
                </Button>
            </div>

            {/* Output Section */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-white/40">
                        You Receive
                    </label>
                    <div className="text-xs text-white/40">
                        Balance: 1000 {outputToken}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        placeholder="0.0"
                        value={outputAmount}
                        readOnly
                        className="bg-transparent border-none text-3xl font-bold h-auto focus:ring-0 px-0 placeholder:text-white/20 w-full text-white"
                    />
                    <div className="min-w-[80px]">
                        <TokenSelect
                            value={outputToken}
                            onChange={(token) => {
                                const symbol = typeof token === 'string' ? token : token.symbol;
                                setOutputToken(symbol);
                            }}
                            exclude={[inputToken]}
                            compact={true}
                        />
                    </div>
                </div>
            </div>

            {/* Swap Details */}
            {inputAmount && parseFloat(inputAmount) > 0 && (
                <div className="space-y-1 p-3 bg-white/5 rounded-xl border border-white/10 text-sm">
                    <div className="flex justify-between">
                        <span className="text-white/40">Exchange Rate</span>
                        <span className="text-white">
                            1 {inputToken} = {currentQuote.exchangeRate.toFixed(2)} {outputToken}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">Fee (0.3%)</span>
                        <span className="text-white">
                            {currentQuote.fee.toFixed(6)} {inputToken}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">Price Impact</span>
                        <span
                            className={cn(
                                currentQuote.priceImpact > 2
                                    ? 'text-red-400'
                                    : currentQuote.priceImpact > 1
                                        ? 'text-yellow-400'
                                        : 'text-green-400'
                            )}
                        >
                            {currentQuote.priceImpact.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">Minimum Received</span>
                        <span className="text-white">
                            {currentQuote.minReceived.toFixed(6)} {outputToken}
                        </span>
                    </div>
                </div>
            )}

            {/* Swap Button */}
            <Button
                onClick={handleSwap}
                disabled={!publicKey || loading || !inputAmount}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all"
                size="lg"
            >
                {!publicKey ? 'Connect Wallet' : loading ? 'Swapping...' : 'Swap Tokens'}
            </Button>
        </div>
    );
}
