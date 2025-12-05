import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
    console.log("Creating USDC and USDT tokens on Devnet...\n");

    // Setup provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const wallet = provider.wallet as anchor.Wallet;
    const connection = provider.connection;

    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Network:", connection.rpcEndpoint);

    // Check balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`Wallet Balance: ${balance / 1e9} SOL\n`);

    // Create USDC mint
    console.log("Creating USDC token mint...");
    const usdcMint = await createMint(
        connection,
        wallet.payer,
        wallet.publicKey, // mint authority
        wallet.publicKey, // freeze authority
        6, // decimals (standard for USDC)
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );
    console.log("✅ USDC Mint:", usdcMint.toString());

    // Create USDT mint
    console.log("\nCreating USDT token mint...");
    const usdtMint = await createMint(
        connection,
        wallet.payer,
        wallet.publicKey, // mint authority
        wallet.publicKey, // freeze authority
        6, // decimals (standard for USDT)
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );
    console.log("✅ USDT Mint:", usdtMint.toString());

    // Create token accounts for wallet
    console.log("\nCreating token accounts for wallet...");
    const walletUsdcAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        usdcMint,
        wallet.publicKey
    );
    console.log("Wallet USDC Account:", walletUsdcAccount.address.toString());

    const walletUsdtAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        usdtMint,
        wallet.publicKey
    );
    console.log("Wallet USDT Account:", walletUsdtAccount.address.toString());

    // Mint initial supply
    const INITIAL_SUPPLY = 1_000_000; // 1 million tokens

    console.log(`\nMinting ${INITIAL_SUPPLY.toLocaleString()} USDC to wallet...`);
    await mintTo(
        connection,
        wallet.payer,
        usdcMint,
        walletUsdcAccount.address,
        wallet.publicKey,
        INITIAL_SUPPLY * 1e6 // 1M USDC (6 decimals)
    );
    console.log("✅ USDC minted");

    console.log(`\nMinting ${INITIAL_SUPPLY.toLocaleString()} USDT to wallet...`);
    await mintTo(
        connection,
        wallet.payer,
        usdtMint,
        walletUsdtAccount.address,
        wallet.publicKey,
        INITIAL_SUPPLY * 1e6 // 1M USDT (6 decimals)
    );
    console.log("✅ USDT minted");

    // Save token configuration
    const tokenConfig = {
        network: "devnet",
        tokens: {
            USDC: {
                mint: usdcMint.toString(),
                decimals: 6,
                symbol: "USDC",
                name: "USD Coin",
                initialSupply: INITIAL_SUPPLY
            },
            USDT: {
                mint: usdtMint.toString(),
                decimals: 6,
                symbol: "USDT",
                name: "Tether USD",
                initialSupply: INITIAL_SUPPLY
            },
            SOL: {
                mint: "So11111111111111111111111111111111111111112",
                decimals: 9,
                symbol: "SOL",
                name: "Solana"
            },
            RUSH: {
                mint: "GqXCfSZk8kuuzhHpinY5sn19sMYfTkMw5svRfTcYDJ6k",
                decimals: 6,
                symbol: "RUSH",
                name: "RUSH Token"
            }
        },
        walletAccounts: {
            usdc: walletUsdcAccount.address.toString(),
            usdt: walletUsdtAccount.address.toString()
        },
        createdAt: new Date().toISOString()
    };

    fs.writeFileSync(
        "tokens_config.json",
        JSON.stringify(tokenConfig, null, 2)
    );

    console.log("\n✅ Token configuration saved to tokens_config.json");
    console.log("\n=== Summary ===");
    console.log("USDC Mint:", usdcMint.toString());
    console.log("USDT Mint:", usdtMint.toString());
    console.log("Initial Supply: 1,000,000 tokens each");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
