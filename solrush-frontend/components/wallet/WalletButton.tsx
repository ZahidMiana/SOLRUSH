"use client";

import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateAddress } from "@/lib/utils/formatters";

export const WalletButton = () => {
  const { publicKey, connected } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">
          {truncateAddress(publicKey.toString())}
        </span>
        <WalletDisconnectButton />
      </div>
    );
  }

  return <WalletMultiButton />;
};
