'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Trash2 } from 'lucide-react';
import { usePool } from '@/lib/hooks/usePool';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface UserPosition {
  id: string;
  lpTokenAmount: number;
  amountA: number;
  amountB: number;
  liquidityUSD: number;
  feesEarned: number;
}

/**
 * RemoveLiquidity Component - Module 6.4
 * Allows users to remove liquidity from pools
 * Features LP token percentage selector, withdraw previews, and position management
 */
export function RemoveLiquidity({ poolAddress }: { poolAddress: string }) {
  const { publicKey } = useWallet();
  const { toast } = useToast();

  const [lpTokenAmount, setLpTokenAmount] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [slippage, setSlippage] = useState(1.0);
  const [showDetails, setShowDetails] = useState(false);

  const { pool, loading, removeLiquidity, calculatePoolShare } =
    usePool(poolAddress);

  // Mock user position
  const userPosition: UserPosition = {
    id: '1',
    lpTokenAmount: 100,
    amountA: 10,
    amountB: 10050,
    liquidityUSD: 20100,
    feesEarned: 250,
  };

  // Update LP token amount when percentage changes
  useEffect(() => {
    const amount = (userPosition.lpTokenAmount * percentage) / 100;
    setLpTokenAmount(amount.toFixed(6));
  }, [percentage, userPosition.lpTokenAmount]);

  // Calculate amounts to receive
  const withdrawPercentage = parseFloat(lpTokenAmount) / userPosition.lpTokenAmount || 0;
  const receivedAmountA = userPosition.amountA * withdrawPercentage;
  const receivedAmountB = userPosition.amountB * withdrawPercentage;
  const receivedUSD = userPosition.liquidityUSD * withdrawPercentage;

  const handleRemoveLiquidity = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to continue.',
      });
      return;
    }

    if (!lpTokenAmount || parseFloat(lpTokenAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid LP token amount.',
      });
      return;
    }

    try {
      const minAmountA = receivedAmountA * (1 - slippage / 100);
      const minAmountB = receivedAmountB * (1 - slippage / 100);

      const signature = await removeLiquidity({
        lpTokenAmount: parseFloat(lpTokenAmount),
        minAmountA,
        minAmountB,
      });

      toast({
        title: 'Liquidity Removed Successfully!',
        description: `Received ${receivedAmountA.toFixed(4)} SOL and ${receivedAmountB.toFixed(2)} USDC. TX: ${signature.slice(0, 8)}...`,
      });

      setLpTokenAmount('');
      setPercentage(0);
    } catch (error: any) {
      toast({
        title: 'Failed to Remove Liquidity',
        description: error.message || 'Transaction failed.',
      });
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Remove Liquidity</CardTitle>
        <CardDescription>
          Withdraw your tokens and close your liquidity position
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Your Position Summary */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">
            Your Position
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-white/50">LP Tokens</span>
              <div className="text-white font-medium">
                {userPosition.lpTokenAmount.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-white/50">Liquidity Value</span>
              <div className="text-white font-medium">
                ${userPosition.liquidityUSD.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-white/50">Fees Earned</span>
              <div className="text-green-400 font-medium">
                +${userPosition.feesEarned.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-white/50">Pool Share</span>
              <div className="text-white font-medium">0.50%</div>
            </div>
          </div>
        </div>

        {/* Percentage Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            Percentage to Withdraw
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((value) => (
              <button
                key={value}
                onClick={() => setPercentage(value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  percentage === value
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                )}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* LP Token Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            LP Tokens to Burn
          </label>
          <Input
            type="number"
            placeholder="0.0"
            value={lpTokenAmount}
            onChange={(e) => {
              setLpTokenAmount(e.target.value);
              const perc = (parseFloat(e.target.value) / userPosition.lpTokenAmount) * 100 || 0;
              setPercentage(Math.min(perc, 100));
            }}
          />
        </div>

        {/* Slippage Tolerance */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            Slippage Tolerance
          </label>
          <div className="flex gap-2">
            {[0.5, 1.0, 2.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={cn(
                  'flex-1 px-2 py-1 rounded text-xs font-medium transition-all',
                  slippage === value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                )}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawal Preview */}
        {lpTokenAmount && parseFloat(lpTokenAmount) > 0 && (
          <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-white">You Receive</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-white/50 hover:text-white/70"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">SOL</span>
                <span className="text-white font-medium">
                  {receivedAmountA.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">USDC</span>
                <span className="text-white font-medium">
                  {receivedAmountB.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white/50">Total Value</span>
                <span className="text-white font-medium">
                  ${receivedUSD.toLocaleString()}
                </span>
              </div>
            </div>

            {showDetails && (
              <div className="pt-2 border-t border-white/10 text-xs text-white/50 space-y-1">
                <div className="flex justify-between">
                  <span>Min. Received (SOL):</span>
                  <span className="text-white">
                    {(receivedAmountA * (1 - slippage / 100)).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min. Received (USDC):</span>
                  <span className="text-white">
                    {(receivedAmountB * (1 - slippage / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-xs text-yellow-200">
          <strong>Note:</strong> Removing liquidity will close your position and
          permanently claim your earned fees.
        </div>

        {/* Remove Button */}
        <Button
          onClick={handleRemoveLiquidity}
          disabled={!publicKey || loading || !lpTokenAmount}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          size="lg"
        >
          {!publicKey
            ? 'Connect Wallet'
            : loading
              ? 'Removing Liquidity...'
              : 'Remove Liquidity'}
        </Button>
      </CardContent>
    </Card>
  );
}
