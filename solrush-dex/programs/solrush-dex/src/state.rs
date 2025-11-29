use anchor_lang::prelude::*;

/// LiquidityPool Account Structure
/// Represents a single trading pair pool (SOL/USDC or SOL/USDT)
///
/// Space: 8 (discriminator) + 32*6 + 8*5 + 1 = 249 bytes
#[account]
pub struct LiquidityPool {
    // Authority and Token Configuration (192 bytes)
    pub authority: Pubkey,           // Pool creator/admin (32 bytes)
    pub token_a_mint: Pubkey,        // SOL mint address (32 bytes)
    pub token_b_mint: Pubkey,        // USDC or USDT mint address (32 bytes)
    pub token_a_vault: Pubkey,       // Vault holding SOL tokens (32 bytes)
    pub token_b_vault: Pubkey,       // Vault holding USDC/USDT tokens (32 bytes)
    pub lp_token_mint: Pubkey,       // LP token mint address (32 bytes)
    
    // Pool State (24 bytes)
    pub reserve_a: u64,              // Current SOL reserve in pool (8 bytes)
    pub reserve_b: u64,              // Current USDC/USDT reserve in pool (8 bytes)
    pub total_lp_supply: u64,        // Total LP tokens in circulation (8 bytes)
    
    // Fee Configuration (16 bytes)
    pub fee_numerator: u64,          // Fee numerator = 3 for 0.3% (8 bytes)
    pub fee_denominator: u64,        // Fee denominator = 1000 (8 bytes)
    
    // PDA Verification (1 byte)
    pub bump: u8,                    // PDA bump seed (1 byte)
}

impl LiquidityPool {
    pub const SIZE: usize = 8 + 32*6 + 8*5 + 1;
}

/// UserLiquidityPosition Account Structure
/// Tracks individual user's LP token position and rewards
///
/// Space: 8 (discriminator) + 32*2 + 8*4 + 1 = 113 bytes
#[account]
pub struct UserLiquidityPosition {
    pub owner: Pubkey,               // User wallet address (32 bytes)
    pub pool: Pubkey,                // Associated pool account (32 bytes)
    pub lp_tokens: u64,              // LP tokens owned by user (8 bytes)
    pub deposit_timestamp: i64,      // When the LP position was created (8 bytes)
    pub last_claim_timestamp: i64,   // Last RUSH reward claim timestamp (8 bytes)
    pub total_rush_claimed: u64,     // Total RUSH tokens claimed (8 bytes)
    pub bump: u8,                    // PDA bump seed (1 byte)
}

impl UserLiquidityPosition {
    pub const SIZE: usize = 8 + 32*2 + 8*4 + 1;
}
