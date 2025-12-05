'use client';

import { Card } from '@/components/ui/card';

interface TradingChartProps {
    tokenPair: string;
    inputToken: string;
    outputToken: string;
}

export function TradingChart({ tokenPair, inputToken, outputToken }: TradingChartProps) {
    return (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 h-[550px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{tokenPair}</h2>
                    <p className="text-sm text-white/40">Live Price Chart</p>
                </div>
            </div>

            {/* Simple Placeholder Chart */}
            <div className="h-[400px] flex items-center justify-center text-white/30">
                <div className="text-center">
                    <p className="text-lg mb-2">Chart Coming Soon</p>
                    <p className="text-sm">Real-time price data will be displayed here</p>
                </div>
            </div>

            {/* Pool Stats Placeholder */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                    <p className="text-xs text-white/40">TVL</p>
                    <p className="text-lg font-semibold text-white">$0.00</p>
                </div>
                <div>
                    <p className="text-xs text-white/40">24h Volume</p>
                    <p className="text-lg font-semibold text-white">$0.00</p>
                </div>
                <div>
                    <p className="text-xs text-white/40">Price</p>
                    <p className="text-lg font-semibold text-white">-</p>
                </div>
            </div>
        </Card>
    );
}
