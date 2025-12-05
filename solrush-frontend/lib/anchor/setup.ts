import { Program, Idl, AnchorProvider, setProvider } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../anchor.json";

/**
 * Network Configuration
 * 
 * To configure the network, create a .env.local file with:
 * NEXT_PUBLIC_SOLANA_NETWORK=devnet (or localnet, mainnet)
 * NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com (optional custom endpoint)
 * NEXT_PUBLIC_PROGRAM_ID=YourProgramID (optional custom program ID)
 */

// Network presets
const NETWORK_ENDPOINTS = {
    localnet: "http://127.0.0.1:8899",
    devnet: "https://api.devnet.solana.com",
    mainnet: "https://api.mainnet-beta.solana.com",
} as const;

// Get network from environment or default to devnet
const getNetworkEndpoint = (): string => {
    // First check for custom RPC endpoint
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RPC_ENDPOINT) {
        return process.env.NEXT_PUBLIC_RPC_ENDPOINT;
    }

    // Then check for network preset
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK as keyof typeof NETWORK_ENDPOINTS;
    if (network && NETWORK_ENDPOINTS[network]) {
        return NETWORK_ENDPOINTS[network];
    }

    // Default to devnet
    return NETWORK_ENDPOINTS.devnet;
};

// Export the configured network endpoint
export const NETWORK = getNetworkEndpoint();

// Define the program ID from environment or use default
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT"
);

/**
 * Get the Anchor program instance
 * @param connection - Solana connection
 * @param wallet - Wallet adapter
 * @returns Anchor program instance
 */
export const getProgram = (connection: Connection, wallet: any) => {
    const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
    );
    setProvider(provider);
    return new Program(idl as unknown as Idl, PROGRAM_ID, provider);
};

/**
 * Create a connection to the configured network
 * @returns Solana connection instance
 */
export const createConnection = (): Connection => {
    return new Connection(NETWORK, 'confirmed');
};
