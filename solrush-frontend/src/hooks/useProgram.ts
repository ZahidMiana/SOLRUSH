import { useMemo } from "react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "../lib/config/program";
import type { SolrushDex } from "../lib/types/solrush_dex";
import IDL from "../lib/idl/solrush_dex.json";

/**
 * Hook to get the Anchor program instance
 * @returns Anchor program instance or null if wallet not connected
 */
export function useProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const program = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }

        const provider = new AnchorProvider(
            connection,
            wallet as any,
            { commitment: "confirmed" }
        );

        return new Program<SolrushDex>(
            IDL as any,
            PROGRAM_ID,
            provider
        );
    }, [connection, wallet]);

    return program;
}
