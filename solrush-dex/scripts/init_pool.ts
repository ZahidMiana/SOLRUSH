import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolrushDex } from "../target/types/solrush_dex";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress
} from "@solana/spl-token";

async function main() {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SolrushDex as Program<SolrushDex>;

    console.log("Initializing pool on Devnet...");
    console.log("Program ID:", program.programId.toString());
    console.log("Wallet:", provider.wallet.publicKey.toString());

    // 1. Create RUSH Token Mint
    const rushMintKeypair = anchor.web3.Keypair.generate();
    console.log("Creating RUSH Token Mint...");

    const rushMint = await createMint(
        provider.connection,
        (provider.wallet as any).payer,
        provider.wallet.publicKey, // Mint authority
        null, // Freeze authority
        6, // Decimals
        rushMintKeypair
    );
    console.log("RUSH Mint Address:", rushMint.toString());

    // 2. Use WSOL Mint (Devnet)
    const wsolMint = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112");
    console.log("WSOL Mint Address:", wsolMint.toString());

    // 3. Derive Pool PDA
    const [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), wsolMint.toBuffer(), rushMint.toBuffer()],
        program.programId
    );
    console.log("Pool PDA:", poolPda.toString());

    // 4. Create Vault Keypairs
    const tokenAVault = anchor.web3.Keypair.generate();
    const tokenBVault = anchor.web3.Keypair.generate();
    console.log("Token A Vault:", tokenAVault.publicKey.toString());
    console.log("Token B Vault:", tokenBVault.publicKey.toString());

    // 5. Derive LP Mint PDA
    const [lpTokenMint] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), poolPda.toBuffer()],
        program.programId
    );
    console.log("LP Token Mint PDA:", lpTokenMint.toString());

    // 6. Setup User Accounts
    // 6a. User RUSH Account
    console.log("Creating User RUSH Account...");
    const userRushAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        (provider.wallet as any).payer,
        rushMint,
        provider.wallet.publicKey
    );

    // Mint some RUSH to user
    console.log("Minting RUSH to user...");
    await mintTo(
        provider.connection,
        (provider.wallet as any).payer,
        rushMint,
        userRushAccount.address,
        provider.wallet.publicKey,
        1000000000 // 1000 RUSH
    );

    // 6b. User WSOL Account
    console.log("Creating User WSOL Account...");
    const userWsolAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        (provider.wallet as any).payer,
        wsolMint,
        provider.wallet.publicKey
    );

    // Transfer SOL to WSOL account
    console.log("Wrapping SOL...");
    // 6c. User LP Token Account (ATA)
    const userLpTokenAccount = await getAssociatedTokenAddress(
        lpTokenMint,
        provider.wallet.publicKey
    );
    console.log("User LP Token Account:", userLpTokenAccount.toString());

    // 7. Initialize Pool
    const initialDepositA = new anchor.BN(10000000); // 0.01 SOL
    const initialDepositB = new anchor.BN(100000000); // 100 RUSH

    try {
        const ix = await program.methods
            .initializePool(initialDepositA, initialDepositB)
            .accounts({
                pool: poolPda,
                tokenAMint: wsolMint,
                tokenBMint: rushMint,
                lpTokenMint: lpTokenMint,
                tokenAVault: tokenAVault.publicKey,
                tokenBVault: tokenBVault.publicKey,
                userTokenA: userWsolAccount.address,
                userTokenB: userRushAccount.address,
                lpTokenAccount: userLpTokenAccount,
                authority: provider.wallet.publicKey,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            } as any)
            .instruction();

        const tx = new anchor.web3.Transaction().add(ix);
        tx.feePayer = provider.wallet.publicKey;
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;

        console.log("Transaction keys:");
        tx.instructions[0].keys.forEach((k, i) => {
            console.log(`Key ${i}: ${k.pubkey.toString()}, Signer: ${k.isSigner}, Writable: ${k.isWritable}`);
        });

        // Sign with generated keypairs (ONLY vaults, pool is PDA)
        tx.partialSign(tokenAVault, tokenBVault);

        // Sign with wallet
        const signedTx = await provider.wallet.signTransaction(tx);

        console.log("Sending transaction...");
        const sig = await provider.connection.sendRawTransaction(signedTx.serialize());
        await provider.connection.confirmTransaction(sig);

        console.log("Pool initialized successfully!");
        console.log("Transaction Signature:", sig);

        // Save details to a file for frontend use
        const fs = require('fs');
        const poolDetails = {
            programId: program.programId.toString(),
            poolAddress: poolPda.toString(),
            rushMint: rushMint.toString(),
            wsolMint: wsolMint.toString(),
            lpTokenMint: lpTokenMint.toString(),
            tokenAVault: tokenAVault.publicKey.toString(),
            tokenBVault: tokenBVault.publicKey.toString(),
        };

        fs.writeFileSync('pool_details.json', JSON.stringify(poolDetails, null, 2));
        console.log("Pool details saved to pool_details.json");

    } catch (err) {
        console.error("Error initializing pool:", err);
    }
}

main().then(
    () => process.exit(),
    (err) => {
        console.error(err);
        process.exit(-1);
    }
);
