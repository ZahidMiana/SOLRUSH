'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TokenSelect } from '@/components/ui/token-select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useLimitOrders } from '@/lib/hooks/useLimitOrders';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function LimitTab() {
    const { publicKey } = useWallet();
    const { toast } = useToast();
    const { orders, loading, createOrder, cancelOrder, refreshOrders } = useLimitOrders();

    const [limitTargetPrice, setLimitTargetPrice] = useState('');
    const [limitInputAmount, setLimitInputAmount] = useState('');
    const [limitInputToken, setLimitInputToken] = useState('SOL');
    const [limitOutputToken, setLimitOutputToken] = useState('USDC');
    const [limitExpiry, setLimitExpiry] = useState('1');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateLimitOrder = async () => {
        if (!publicKey) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Please connect your wallet to continue.',
            });
            return;
        }

        if (
            !limitInputAmount ||
            !limitTargetPrice ||
            parseFloat(limitInputAmount) <= 0 ||
            parseFloat(limitTargetPrice) <= 0
        ) {
            toast({
                title: 'Invalid Input',
                description: 'Please enter valid amount and price.',
            });
            return;
        }

        setIsCreating(true);
        try {
            const inputAmount = parseFloat(limitInputAmount);
            const targetPrice = parseFloat(limitTargetPrice);
            const minimumReceive = inputAmount * targetPrice * 0.99; // 1% slippage tolerance

            const order = await createOrder({
                inputToken: limitInputToken,
                outputToken: limitOutputToken,
                inputAmount,
                targetPrice,
                minimumReceive,
                expiryDays: parseInt(limitExpiry),
            });

            toast({
                title: order.isOnChain ? 'On-Chain Limit Order Created' : 'Limit Order Created',
                description: order.isOnChain 
                    ? `Order to sell ${limitInputAmount} ${limitInputToken} at ${limitTargetPrice} submitted to blockchain.`
                    : `Order created locally. Note: On-chain execution requires program deployment.`,
            });

            setLimitInputAmount('');
            setLimitTargetPrice('');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create order.';
            toast({
                title: 'Order Creation Failed',
                description: errorMessage,
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancelLimitOrder = async (orderId: string) => {
        try {
            await cancelOrder(orderId);
            toast({
                title: 'Order Cancelled',
                description: 'Limit order has been cancelled.',
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order.';
            toast({
                title: 'Cancellation Failed',
                description: errorMessage,
            });
        }
    };

    // Filter to show pending orders first
    const sortedOrders = [...orders].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return (
        <div className="space-y-4">
            {/* Info Banner for local orders */}
            {orders.some(o => !o.isOnChain) && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-200/80">
                        Some orders are stored locally. On-chain limit orders require the program to be deployed on the selected network.
                    </p>
                </div>
            )}

            {/* Limit Order Form */}
            <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-sm font-semibold text-white">Create Order</h3>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">Sell Token</label>
                    <TokenSelect
                        value={limitInputToken}
                        onChange={(token) => {
                            const symbol = typeof token === 'string' ? token : token.symbol;
                            setLimitInputToken(symbol);
                        }}
                        exclude={[limitOutputToken]}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">Amount</label>
                    <Input
                        type="number"
                        placeholder="0.0"
                        value={limitInputAmount}
                        onChange={(e) => setLimitInputAmount(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">Buy Token</label>
                    <TokenSelect
                        value={limitOutputToken}
                        onChange={(token) => {
                            const symbol = typeof token === 'string' ? token : token.symbol;
                            setLimitOutputToken(symbol);
                        }}
                        exclude={[limitInputToken]}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">
                        Target Price ({limitOutputToken} per {limitInputToken})
                    </label>
                    <Input
                        type="number"
                        placeholder="0.0"
                        value={limitTargetPrice}
                        onChange={(e) => setLimitTargetPrice(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70">Expiry</label>
                    <div className="flex gap-2">
                        {['1', '7', '30'].map((day) => (
                            <button
                                key={day}
                                onClick={() => setLimitExpiry(day)}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded text-xs font-medium transition-all',
                                    limitExpiry === day
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                )}
                            >
                                {day}d
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={handleCreateLimitOrder}
                    disabled={!publicKey || !limitInputAmount || !limitTargetPrice || isCreating || loading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                    {isCreating ? 'Creating...' : 'Create Limit Order'}
                </Button>
            </div>

            {/* Active Orders List */}
            {sortedOrders.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Your Orders</h3>
                        <button
                            onClick={refreshOrders}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            title="Refresh orders"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                    </div>
                    {sortedOrders.map((order) => (
                        <div
                            key={order.id}
                            className={cn(
                                "p-3 bg-white/5 rounded-lg border text-sm",
                                order.isOnChain ? "border-white/10" : "border-yellow-500/20"
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="font-medium text-white">
                                        {order.inputAmount.toFixed(4)} {order.inputToken} → {order.outputToken}
                                    </div>
                                    <div className="text-xs text-white/50">
                                        Target: {order.targetPrice.toFixed(2)} {order.outputToken}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={cn(
                                            'text-xs px-2 py-1 rounded-full font-medium',
                                            order.status === 'pending'
                                                ? 'bg-yellow-900 text-yellow-200'
                                                : order.status === 'executed'
                                                    ? 'bg-green-900 text-green-200'
                                                    : 'bg-red-900 text-red-200'
                                        )}
                                    >
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                    {!order.isOnChain && (
                                        <span className="text-xs text-yellow-400/70">Local</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-white/50 mb-2">
                                Expires: {order.expiresAt.toLocaleDateString()} at{' '}
                                {order.expiresAt.toLocaleTimeString()}
                            </div>
                            {order.status === 'pending' && (
                                <Button
                                    onClick={() => handleCancelLimitOrder(order.id)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    disabled={loading}
                                >
                                    Cancel Order
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
