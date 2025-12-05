'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Droplet, TrendingUp, Gift } from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();
    const { connected } = useWallet();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering wallet button on client
    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { href: '/swap', label: 'Trade', icon: TrendingUp },
        { href: '/pools', label: 'Pools', icon: Droplet },
        { href: '/rewards', label: 'Rewards', icon: Gift },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-black text-white">
                        SOLRUSH
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-6">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Wallet Button - Only render on client */}
                    <div className="min-w-[150px]">
                        {mounted ? (
                            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-10" />
                        ) : (
                            <div className="h-10 w-[150px] bg-purple-600/20 rounded-lg animate-pulse" />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
