import { Program, Idl, AnchorProvider, setProvider, Wallet } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../anchor.json";

// Define the program ID from the IDL or environment
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT"
);

// Network configuration - configurable via environment variables
export type NetworkType = 'localnet' | 'devnet' | 'mainnet-beta';

const NETWORK_ENDPOINTS: Record<NetworkType, string> = {
    'localnet': 'http://127.0.0.1:8899',
    'devnet': 'https://api.devnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};

// Get network type from environment variable, default to devnet
export const NETWORK_TYPE: NetworkType = 
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK as NetworkType) || 'devnet';

// Get RPC URL from environment or use default based on network type
export const NETWORK = 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
    NETWORK_ENDPOINTS[NETWORK_TYPE];

export const getProgram = (connection: Connection, wallet: Wallet) => {
    const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
    );
    setProvider(provider);
    return new Program(idl as unknown as Idl, PROGRAM_ID, provider);
};
