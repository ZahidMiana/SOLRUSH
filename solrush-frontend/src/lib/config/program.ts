import { PublicKey } from "@solana/web3.js";

// Program ID deployed on Devnet
export const PROGRAM_ID = new PublicKey("5AtAVriL32asiRrkSXCLwkYy6E9DefEt6wdtVQVR9CvX");

// Network configuration
export const NETWORK = "devnet";
export const RPC_ENDPOINT = "https://api.devnet.solana.com";

// Commitment level for transactions
export const COMMITMENT = "confirmed";

// Explorer base URL
export const EXPLORER_URL = `https://explorer.solana.com/?cluster=${NETWORK}`;

// Helper function to get transaction URL
export function getTransactionUrl(signature: string): string {
    return `${EXPLORER_URL}&tx=${signature}`;
}

// Helper function to get account URL
export function getAccountUrl(address: string | PublicKey): string {
    const addressStr = typeof address === "string" ? address : address.toBase58();
    return `${EXPLORER_URL}&address=${addressStr}`;
}
