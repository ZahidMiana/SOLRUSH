'use client';

import { Navbar } from '@/components/layout/Navbar';
import { SwapInterface } from '@/components/trading/SwapInterface';

/**
 * Swap Page - Module 6.1
 * Complete trading interface with swap, limit, buy, and sell functionality
 */
export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-[#0a0a2e]">
      <Navbar />

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-400 via-purple-300 to-green-400 bg-clip-text text-transparent mb-2">
              Trade
            </h1>
            <p className="text-white/50">
              Swap, limit orders, buy, or sell tokens with the best prices
            </p>
          </div>
          <SwapInterface />
        </div>
      </main>
    </div>
  );
}
