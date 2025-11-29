import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolrushDex } from "../target/types/solrush_dex";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createMint, createAccount, mintTo } from "@solana/spl-token";

describe("solrush-dex", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.solrushDex as Program<SolrushDex>;
  const provider = anchor.getProvider();

  let tokenAMint: PublicKey;
  let tokenBMint: PublicKey;
  let pool: Keypair;
  let userTokenA: PublicKey;
  let userTokenB: PublicKey;

  before(async () => {
    // Create token mints
    tokenAMint = await createMint(
      provider.connection,
      provider.wallet as any,
      provider.publicKey,
      null,
      6
    );

    tokenBMint = await createMint(
      provider.connection,
      provider.wallet as any,
      provider.publicKey,
      null,
      6
    );

    // Create user token accounts
    userTokenA = await createAccount(
      provider.connection,
      provider.wallet as any,
      tokenAMint,
      provider.publicKey
    );

    userTokenB = await createAccount(
      provider.connection,
      provider.wallet as any,
      tokenBMint,
      provider.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      provider.wallet as any,
      tokenAMint,
      userTokenA,
      provider.publicKey,
      1000000000
    );

    await mintTo(
      provider.connection,
      provider.wallet as any,
      tokenBMint,
      userTokenB,
      provider.publicKey,
      1000000000
    );

    pool = Keypair.generate();
  });

  it("Initializes a liquidity pool", async () => {
    const tx = await program.methods
      .initializePool("SOL/USDC")
      .accounts({
        authority: provider.publicKey,
        pool: pool.publicKey,
        tokenAMint,
        tokenBMint,
      } as any)
      .signers([pool])
      .rpc();

    console.log("Pool initialized tx:", tx);

    const poolAccount = await program.account.liquidityPool.fetch(
      pool.publicKey
    );
    console.log("Pool name:", poolAccount.name);
  });

  it("Adds liquidity to pool", async () => {
    const tx = await program.methods
      .addLiquidity(new anchor.BN(1000000), new anchor.BN(1000000))
      .accounts({
        user: provider.publicKey,
        pool: pool.publicKey,
        userTokenA,
        userTokenB,
      } as any)
      .rpc();

    console.log("Liquidity added tx:", tx);
  });

  it("Removes liquidity from pool", async () => {
    const tx = await program.methods
      .removeLiquidity(new anchor.BN(500000), new anchor.BN(500000))
      .accounts({
        user: provider.publicKey,
        pool: pool.publicKey,
      } as any)
      .rpc();

    console.log("Liquidity removed tx:", tx);
  });
});

