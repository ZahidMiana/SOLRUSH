'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function WalletButton() {
  const { publicKey, disconnect } = useWallet();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast({
        title: 'Address copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const handleViewExplorer = () => {
    if (publicKey) {
      window.open(
        `https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`,
        '_blank'
      );
    }
  };

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Wallet className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!publicKey) {
    return (
      <WalletMultiButton className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700" />
    );
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          {shortenAddress(publicKey.toBase58())}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnect} className="text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
