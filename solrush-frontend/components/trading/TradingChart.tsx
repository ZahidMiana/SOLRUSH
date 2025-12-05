'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TradingChartProps {
    tokenPair: string;
    inputToken?: string;
    outputToken?: string;
    className?: string;
}

/**
 * TradingChart Component - Simplified placeholder
 * Shows current price without complex charting library
 */
export function TradingChart({ tokenPair, inputToken, outputToken, className }: TradingChartProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(100.00);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Simulate price updates
        const interval = setInterval(() => {
            setCurrentPrice(prev => {
                const change = (Math.random() - 0.5) * 2; // Random change between -1 and +1
                return Math.max(95, Math.min(105, prev + change));
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [isMounted]);

    if (!isMounted) {
        return (
            <div className={cn("w-full h-[550px] bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl flex items-center justify-center", className)}>
                <div className="text-white/30 text-sm">Loading chart...</div>
            </div>
        );
    }

    const priceChange = ((currentPrice - 100) / 100) * 100;
    const isPositive = priceChange >= 0;

    return (
        <div className={cn("w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl", className)}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">{tokenPair}</h3>
                    <p className="text-sm text-white/50">Live Price</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</span>
                    <span className={cn("text-sm font-medium", isPositive ? "text-green-400" : "text-red-400")}>
                        {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Placeholder Chart Area */}
            <div className="w-full h-[450px] rounded-xl overflow-hidden bg-black/20 border border-white/5 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl font-bold text-white/10">
                    ${currentPrice.toFixed(2)}
                </div>
                <div className="text-white/30 text-sm">
                    Real-time price chart coming soon
                </div>
                <div className="flex gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150"></div>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                {['1H', '4H', '1D', '1W', '1M'].map((timeframe) => (
                    <button
                        key={timeframe}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-purple-500/20 text-white/70 hover:text-white transition-all"
                    >
                        {timeframe}
                    </button>
                ))}
            </div>
        </div>
    );
}
