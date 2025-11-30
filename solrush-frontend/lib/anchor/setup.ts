import { Program, Idl, AnchorProvider, setProvider } from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from "../../anchor.json";

// Define the program ID from the IDL or environment
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT"
);

// Network configuration - supports environment variables for Localnet/Devnet/Mainnet
export type NetworkType = 'localnet' | 'devnet' | 'mainnet-beta';

const getNetworkUrl = (): string => {
    const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as NetworkType;
    
    // Allow custom RPC URL override
    const customRpc = process.env.NEXT_PUBLIC_RPC_URL;
    if (customRpc) {
        return customRpc;
    }
    
    switch (network) {
        case 'localnet':
            return 'http://127.0.0.1:8899';
        case 'mainnet-beta':
            return clusterApiUrl('mainnet-beta');
        case 'devnet':
        default:
            return clusterApiUrl('devnet');
    }
};

export const NETWORK = getNetworkUrl();

export const getProgram = (connection: Connection, wallet: { publicKey: PublicKey; signTransaction?: unknown; signAllTransactions?: unknown }) => {
    const provider = new AnchorProvider(
        connection,
        wallet as Parameters<typeof AnchorProvider>[1],
        AnchorProvider.defaultOptions()
    );
    setProvider(provider);
    return new Program(idl as unknown as Idl, PROGRAM_ID, provider);
};
