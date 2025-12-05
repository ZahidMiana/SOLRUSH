import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolrushDex } from "../target/types/solrush_dex";
import {
    getOrCreateAssociatedTokenAccount,
    getAssociatedTokenAddress,
    createSyncNativeInstruction,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
    console.log("Initializing 3 additional pools on Devnet...\n");

    // Setup
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SolrushDex as Program<SolrushDex>;
    const wallet = provider.wallet as anchor.Wallet;

    console.log("Program ID:", program.programId.toString());
    console.log("Wallet:", wallet.publicKey.toString());

    // Load token configuration
    const tokensConfig = JSON.parse(fs.readFileSync("tokens_config.json", "utf-8"));
    const usdcMint = new PublicKey(tokensConfig.tokens.USDC.mint);
    const usdtMint = new PublicKey(tokensConfig.tokens.USDT.mint);
    const wsolMint = NATIVE_MINT;

    console.log("\nToken Mints:");
    console.log("USDC:", usdcMint.toString());
    console.log("USDT:", usdtMint.toString());
    console.log("WSOL:", wsolMint.toString());

    const poolsToInit = [
        {
            name: "SOL/USDC",
            tokenA: wsolMint,
            tokenB: usdcMint,
            depositA: 1 * 1e9, // 1 SOL
            depositB: 100 * 1e6, // 100 USDC
        },
        {
            name: "SOL/USDT",
            tokenA: wsolMint,
            tokenB: usdtMint,
            depositA: 1 * 1e9, // 1 SOL
            depositB: 100 * 1e6, // 100 USDT
        },
        {
            name: "USDC/USDT",
            tokenA: usdcMint,
            tokenB: usdtMint,
            depositA: 10000 * 1e6, // 10,000 USDC
            depositB: 10000 * 1e6, // 10,000 USDT
        }
    ];

    const poolsConfig = {
        programId: program.programId.toString(),
        network: "devnet",
        pools: []
    };

    for (const poolConfig of poolsToInit) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Initializing ${poolConfig.name} Pool`);
        console.log(`${"=".repeat(60)}`);

        try {
            // Derive pool PDA
            const [poolPda, poolBump] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("pool"),
                    poolConfig.tokenA.toBuffer(),
                    poolConfig.tokenB.toBuffer()
                ],
                program.programId
            );

            console.log("Pool PDA:", poolPda.toString());

            // Derive LP token mint PDA
            const [lpTokenMint, lpBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("lp_mint"), poolPda.toBuffer()],
                program.programId
            );

            console.log("LP Token Mint:", lpTokenMint.toString());

            // Create token vaults (these will be initialized by the program)
            const tokenAVault = Keypair.generate();
            const tokenBVault = Keypair.generate();

            console.log("Token A Vault:", tokenAVault.publicKey.toString());
            console.log("Token B Vault:", tokenBVault.publicKey.toString());

            // Get or create user token accounts
            let userTokenA, userTokenB;

            if (poolConfig.tokenA.equals(NATIVE_MINT)) {
                // Wrap SOL
                console.log("\nWrapping SOL for Token A...");
                userTokenA = await getOrCreateAssociatedTokenAccount(
                    provider.connection,
                    wallet.payer,
                    NATIVE_MINT,
                    wallet.publicKey
                );

                const wrapTx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: userTokenA.address,
                        lamports: poolConfig.depositA,
                    }),
                    createSyncNativeInstruction(userTokenA.address)
                );

                await provider.sendAndConfirm(wrapTx);
                console.log("✅ SOL wrapped");
            } else {
                userTokenA = await getOrCreateAssociatedTokenAccount(
                    provider.connection,
                    wallet.payer,
                    poolConfig.tokenA,
                    wallet.publicKey
                );
            }

            if (poolConfig.tokenB.equals(NATIVE_MINT)) {
                // Wrap SOL
                console.log("\nWrapping SOL for Token B...");
                userTokenB = await getOrCreateAssociatedTokenAccount(
                    provider.connection,
                    wallet.payer,
                    NATIVE_MINT,
                    wallet.publicKey
                );

                const wrapTx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: userTokenB.address,
                        lamports: poolConfig.depositB,
                    }),
                    createSyncNativeInstruction(userTokenB.address)
                );

                await provider.sendAndConfirm(wrapTx);
                console.log("✅ SOL wrapped");
            } else {
                userTokenB = await getOrCreateAssociatedTokenAccount(
                    provider.connection,
                    wallet.payer,
                    poolConfig.tokenB,
                    wallet.publicKey
                );
            }

            console.log("User Token A Account:", userTokenA.address.toString());
            console.log("User Token B Account:", userTokenB.address.toString());

            // Get user LP token account address (will be created by the program)
            const userLpTokenAccount = await getAssociatedTokenAddress(
                lpTokenMint,
                wallet.publicKey,
                true // allowOwnerOffCurve
            );

            console.log("User LP Token Account:", userLpTokenAccount.toString());

            // Initialize pool
            console.log("\nInitializing pool...");
            const tx = await program.methods
                .initializePool(
                    new anchor.BN(poolConfig.depositA),
                    new anchor.BN(poolConfig.depositB)
                )
                .accounts({
                    pool: poolPda,
                    tokenAMint: poolConfig.tokenA,
                    tokenBMint: poolConfig.tokenB,
                    lpTokenMint: lpTokenMint,
                    tokenAVault: tokenAVault.publicKey,
                    tokenBVault: tokenBVault.publicKey,
                    userTokenA: userTokenA.address,
                    userTokenB: userTokenB.address,
                    lpTokenAccount: userLpTokenAccount,
                    authority: wallet.publicKey,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any)
                .signers([tokenAVault, tokenBVault])
                .rpc();

            console.log("✅ Pool initialized!");
            console.log("Transaction:", tx);

            // Save pool configuration
            poolsConfig.pools.push({
                name: poolConfig.name,
                poolAddress: poolPda.toString(),
                tokenAMint: poolConfig.tokenA.toString(),
                tokenBMint: poolConfig.tokenB.toString(),
                lpTokenMint: lpTokenMint.toString(),
                tokenAVault: tokenAVault.publicKey.toString(),
                tokenBVault: tokenBVault.publicKey.toString(),
                initialDepositA: poolConfig.depositA,
                initialDepositB: poolConfig.depositB,
                transactionSignature: tx
            });

        } catch (error) {
            console.error(`❌ Failed to initialize ${poolConfig.name}:`, error);
            // Continue with next pool
        }
    }

    // Save all pools configuration
    fs.writeFileSync(
        "pools_config.json",
        JSON.stringify(poolsConfig, null, 2)
    );

    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ All pools configuration saved to pools_config.json");
    console.log(`${"=".repeat(60)}`);
    console.log(`\nInitialized ${poolsConfig.pools.length} pools successfully!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
