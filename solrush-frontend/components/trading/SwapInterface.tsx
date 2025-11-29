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
import { TokenSelect } from '@/components/ui/token-select';
import { ArrowUpDown, Settings, AlertCircle, ChevronDown } from 'lucide-react';
import { useSwap } from '@/lib/hooks/useSwap';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface LimitOrder {
  id: string;
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  targetPrice: number;
  status: 'pending' | 'executed' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
}

/**
 * SwapInterface Component - Module 6.1, 6.2, 6.3
 * Complete trading interface with Swap, Limit, Buy, and Sell tabs
 * Features real-time quotes, slippage tolerance, and order management
 */
export function SwapInterface() {
  const { publicKey } = useWallet();
  const { toast } = useToast();

  // Swap state
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [inputToken, setInputToken] = useState('SOL');
  const [outputToken, setOutputToken] = useState('USDC');
  const [slippageTolerance, setSlippageTolerance] = useState(1.0);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  // Limit order state
  const [limitTargetPrice, setLimitTargetPrice] = useState('');
  const [limitInputAmount, setLimitInputAmount] = useState('');
  const [limitInputToken, setLimitInputToken] = useState('SOL');
  const [limitOutputToken, setLimitOutputToken] = useState('USDC');
  const [limitExpiry, setLimitExpiry] = useState('1');
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([
    {
      id: '1',
      inputToken: 'SOL',
      outputToken: 'USDC',
      inputAmount: 5,
      targetPrice: 95,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  ]);

  // Buy state
  const [buyAmount, setBuyAmount] = useState('');
  const [buyTokenSpend, setBuyTokenSpend] = useState('USDC');
  const [buyEstimatedAmount, setBuyEstimatedAmount] = useState('');

  // Sell state
  const [sellAmount, setSellAmount] = useState('');
  const [sellToken, setSellToken] = useState('SOL');
  const [sellEstimatedAmount, setSellEstimatedAmount] = useState('');

  const { calculateQuote, executeSwap, loading } = useSwap();

  // Real-time quote calculation for Swap tab
  useEffect(() => {
    if (inputAmount && parseFloat(inputAmount) > 0) {
      try {
        const quote = calculateQuote(
          parseFloat(inputAmount),
          inputToken,
          outputToken,
          slippageTolerance
        );
        setOutputAmount(quote.outputAmount.toFixed(6));
      } catch (error) {
        console.error('Quote calculation error:', error);
      }
    } else {
      setOutputAmount('');
    }
  }, [inputAmount, inputToken, outputToken, slippageTolerance, calculateQuote]);

  // Real-time quote calculation for Buy tab
  useEffect(() => {
    if (buyAmount && parseFloat(buyAmount) > 0) {
      try {
        const quote = calculateQuote(
          parseFloat(buyAmount),
          buyTokenSpend,
          'SOL',
          slippageTolerance
        );
        setBuyEstimatedAmount(quote.outputAmount.toFixed(6));
      } catch (error) {
        console.error('Buy quote error:', error);
      }
    } else {
      setBuyEstimatedAmount('');
    }
  }, [buyAmount, buyTokenSpend, slippageTolerance, calculateQuote]);

  // Real-time quote calculation for Sell tab
  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0) {
      try {
        const quote = calculateQuote(
          parseFloat(sellAmount),
          sellToken,
          'USDC',
          slippageTolerance
        );
        setSellEstimatedAmount(quote.outputAmount.toFixed(6));
      } catch (error) {
        console.error('Sell quote error:', error);
      }
    } else {
      setSellEstimatedAmount('');
    }
  }, [sellAmount, sellToken, slippageTolerance, calculateQuote]);

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
      const quote = calculateQuote(
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

      // Reset form
      setInputAmount('');
      setOutputAmount('');
    } catch (error: any) {
      toast({
        title: 'Swap Failed',
        description: error.message || 'Transaction failed. Please try again.',
      });
    }
  };

  const handleBuy = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to continue.',
      });
      return;
    }

    try {
      const quote = calculateQuote(
        parseFloat(buyAmount),
        buyTokenSpend,
        'SOL',
        slippageTolerance
      );

      const signature = await executeSwap({
        inputToken: buyTokenSpend,
        outputToken: 'SOL',
        inputAmount: parseFloat(buyAmount),
        minOutputAmount: quote.minReceived,
      });

      toast({
        title: 'Purchase Successful!',
        description: `Bought ${buyEstimatedAmount} SOL for ${buyAmount} ${buyTokenSpend}. TX: ${signature.slice(0, 8)}...`,
      });

      setBuyAmount('');
      setBuyEstimatedAmount('');
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Transaction failed.',
      });
    }
  };

  const handleSell = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to continue.',
      });
      return;
    }

    try {
      const quote = calculateQuote(
        parseFloat(sellAmount),
        sellToken,
        'USDC',
        slippageTolerance
      );

      const signature = await executeSwap({
        inputToken: sellToken,
        outputToken: 'USDC',
        inputAmount: parseFloat(sellAmount),
        minOutputAmount: quote.minReceived,
      });

      toast({
        title: 'Sale Successful!',
        description: `Sold ${sellAmount} ${sellToken} for ${sellEstimatedAmount} USDC. TX: ${signature.slice(0, 8)}...`,
      });

      setSellAmount('');
      setSellEstimatedAmount('');
    } catch (error: any) {
      toast({
        title: 'Sale Failed',
        description: error.message || 'Transaction failed.',
      });
    }
  };

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

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(limitExpiry));

      const newOrder: LimitOrder = {
        id: Date.now().toString(),
        inputToken: limitInputToken,
        outputToken: limitOutputToken,
        inputAmount: parseFloat(limitInputAmount),
        targetPrice: parseFloat(limitTargetPrice),
        status: 'pending',
        expiresAt,
        createdAt: new Date(),
      };

      setLimitOrders([...limitOrders, newOrder]);

      toast({
        title: 'Limit Order Created',
        description: `Order to sell ${limitInputAmount} ${limitInputToken} at ${limitTargetPrice} created.`,
      });

      setLimitInputAmount('');
      setLimitTargetPrice('');
    } catch (error: any) {
      toast({
        title: 'Order Creation Failed',
        description: error.message || 'Failed to create order.',
      });
    }
  };

  const handleCancelLimitOrder = (orderId: string) => {
    setLimitOrders(
      limitOrders.map((order) =>
        order.id === orderId ? { ...order, status: 'cancelled' as const } : order
      )
    );

    toast({
      title: 'Order Cancelled',
      description: 'Limit order has been cancelled.',
    });
  };

  const handleSwitchTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount);
    setOutputAmount('');
  };

  const currentQuote = calculateQuote(
    parseFloat(inputAmount) || 0,
    inputToken,
    outputToken,
    slippageTolerance
  );

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trade</CardTitle>
            <CardDescription>
              Swap, limit orders, buy, or sell tokens
            </CardDescription>
          </div>
          <button
            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Slippage settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Slippage Settings */}
        {showSlippageSettings && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <label className="text-xs font-medium text-white/70 block mb-2">
              Slippage Tolerance
            </label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 3.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippageTolerance(value)}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium transition-all',
                    slippageTolerance === value
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  )}
                >
                  {value}%
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={slippageTolerance}
              onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
              className="w-full mt-2 px-2 py-1 rounded bg-white/10 border border-white/10 text-xs text-white"
              placeholder="Custom %"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="swap" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          {/* SWAP TAB - Module 6.1 */}
          <TabsContent value="swap" className="space-y-4">
            {/* Input Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">
                You Pay
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="flex-1"
                />
                <TokenSelect
                  value={inputToken}
                  onChange={(token) => {
                    const symbol = typeof token === 'string' ? token : token.symbol;
                    setInputToken(symbol);
                  }}
                  exclude={[outputToken]}
                />
              </div>
              <div className="text-xs text-white/50">
                Balance: 10.5 {inputToken}
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwitchTokens}
                className="rounded-full bg-white/10 hover:bg-white/20"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Output Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">
                You Receive
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={outputAmount}
                  readOnly
                  className="flex-1 bg-white/5"
                />
                <TokenSelect
                  value={outputToken}
                  onChange={(token) => {
                    const symbol = typeof token === 'string' ? token : token.symbol;
                    setOutputToken(symbol);
                  }}
                  exclude={[inputToken]}
                />
              </div>
            </div>

            {/* Swap Details */}
            {inputAmount && parseFloat(inputAmount) > 0 && (
              <div className="space-y-1 p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Exchange Rate</span>
                  <span className="text-white">
                    1 {inputToken} = {currentQuote.exchangeRate.toFixed(2)}{' '}
                    {outputToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Fee (0.3%)</span>
                  <span className="text-white">
                    {currentQuote.fee.toFixed(6)} {inputToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Price Impact</span>
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
                  <span className="text-white/50">Minimum Received</span>
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
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              size="lg"
            >
              {!publicKey
                ? 'Connect Wallet'
                : loading
                  ? 'Swapping...'
                  : 'Swap Tokens'}
            </Button>
          </TabsContent>

          {/* LIMIT ORDER TAB - Module 6.2 */}
          <TabsContent value="limit" className="space-y-4">
            {/* Limit Order Form */}
            <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-semibold text-white">Create Order</h3>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">
                  Sell Token
                </label>
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
                <label className="text-xs font-medium text-white/70">
                  Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={limitInputAmount}
                  onChange={(e) => setLimitInputAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">
                  Buy Token
                </label>
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
                <label className="text-xs font-medium text-white/70">
                  Expiry
                </label>
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
                disabled={
                  !publicKey ||
                  !limitInputAmount ||
                  !limitTargetPrice ||
                  loading
                }
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {loading ? 'Creating...' : 'Create Limit Order'}
              </Button>
            </div>

            {/* Active Orders List */}
            {limitOrders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  Active Orders
                </h3>
                {limitOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-white">
                          {order.inputAmount} {order.inputToken} →{' '}
                          {order.outputToken}
                        </div>
                        <div className="text-xs text-white/50">
                          Target: {order.targetPrice} {order.outputToken}
                        </div>
                      </div>
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
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mb-2">
                      Expires:{' '}
                      {order.expiresAt.toLocaleDateString()} at{' '}
                      {order.expiresAt.toLocaleTimeString()}
                    </div>
                    {order.status === 'pending' && (
                      <Button
                        onClick={() => handleCancelLimitOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* BUY TAB - Module 6.3 */}
          <TabsContent value="buy" className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-white/70">
                  Spend
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="flex-1"
                  />
                  <TokenSelect
                    value={buyTokenSpend}
                    onChange={(token) => {
                      const symbol = typeof token === 'string' ? token : token.symbol;
                      setBuyTokenSpend(symbol);
                    }}
                    exclude={['SOL']}
                  />
                </div>
                <div className="text-xs text-white/50">
                  Balance: 250 {buyTokenSpend}
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <div className="text-white/50">↓</div>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-white/70">
                  Receive
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={buyEstimatedAmount}
                    readOnly
                    className="flex-1 bg-white/5"
                  />
                  <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white font-medium min-w-16 flex items-center justify-center">
                    SOL
                  </div>
                </div>
                <div className="text-xs text-white/50">Balance: 2.5 SOL</div>
              </div>

              {buyAmount && buyEstimatedAmount && (
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 mb-4 text-xs text-white/70 space-y-1">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>
                      1 {buyTokenSpend} ={' '}
                      {(
                        parseFloat(buyEstimatedAmount) / parseFloat(buyAmount)
                      ).toFixed(4)}{' '}
                      SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min. Received:</span>
                    <span>
                      {(parseFloat(buyEstimatedAmount) * 0.99).toFixed(6)} SOL
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={!publicKey || loading || !buyAmount}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                {!publicKey
                  ? 'Connect Wallet'
                  : loading
                    ? 'Buying...'
                    : 'Buy SOL'}
              </Button>
            </div>
          </TabsContent>

          {/* SELL TAB - Module 6.3 */}
          <TabsContent value="sell" className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-white/70">
                  Sell
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="flex-1"
                  />
                  <TokenSelect
                    value={sellToken}
                    onChange={(token) => {
                      const symbol = typeof token === 'string' ? token : token.symbol;
                      setSellToken(symbol);
                    }}
                    exclude={['USDC', 'USDT']}
                  />
                </div>
                <div className="text-xs text-white/50">
                  Balance: 10.5 {sellToken}
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <div className="text-white/50">↓</div>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-white/70">
                  Receive
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={sellEstimatedAmount}
                    readOnly
                    className="flex-1 bg-white/5"
                  />
                  <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white font-medium min-w-16 flex items-center justify-center">
                    USDC
                  </div>
                </div>
                <div className="text-xs text-white/50">Balance: 250 USDC</div>
              </div>

              {sellAmount && sellEstimatedAmount && (
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 mb-4 text-xs text-white/70 space-y-1">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>
                      1 {sellToken} ={' '}
                      {(
                        parseFloat(sellEstimatedAmount) / parseFloat(sellAmount)
                      ).toFixed(2)}{' '}
                      USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min. Received:</span>
                    <span>
                      {(parseFloat(sellEstimatedAmount) * 0.99).toFixed(2)} USDC
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSell}
                disabled={!publicKey || loading || !sellAmount}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                size="lg"
              >
                {!publicKey
                  ? 'Connect Wallet'
                  : loading
                    ? 'Selling...'
                    : 'Sell ' + sellToken}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
