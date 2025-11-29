use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount, Transfer, transfer, Mint},
};

declare_id!("3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT");

#[program]
pub mod solrush_dex {
    use super::*;

    /// Initialize a new liquidity pool
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_name: String,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_a_vault = ctx.accounts.token_a_vault.key();
        pool.token_b_vault = ctx.accounts.token_b_vault.key();
        pool.pool_mint = ctx.accounts.pool_mint.key();
        pool.token_a_mint = ctx.accounts.token_a_mint.key();
        pool.token_b_mint = ctx.accounts.token_b_mint.key();
        pool.name = pool_name;
        pool.fee_basis_points = 25; // 0.25% fee
        pool.token_a_reserve = 0;
        pool.token_b_reserve = 0;
        pool.bump = ctx.bumps.pool;

        msg!("Pool initialized: {}", pool.name);
        Ok(())
    }

    /// Add liquidity to the pool
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Transfer tokens from user to vault
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_a.to_account_info(),
                    to: ctx.accounts.token_a_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_a,
        )?;

        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_b.to_account_info(),
                    to: ctx.accounts.token_b_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_b,
        )?;

        // Update reserves
        pool.token_a_reserve = pool.token_a_reserve.checked_add(amount_a).unwrap();
        pool.token_b_reserve = pool.token_b_reserve.checked_add(amount_b).unwrap();

        msg!("Liquidity added: {} A tokens, {} B tokens", amount_a, amount_b);
        Ok(())
    }

    /// Remove liquidity from the pool
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(
            pool.token_a_reserve >= amount_a && pool.token_b_reserve >= amount_b,
            CustomError::InsufficientLiquidity
        );

        // Update reserves
        pool.token_a_reserve = pool.token_a_reserve.checked_sub(amount_a).unwrap();
        pool.token_b_reserve = pool.token_b_reserve.checked_sub(amount_b).unwrap();

        msg!("Liquidity removed: {} A tokens, {} B tokens", amount_a, amount_b);
        Ok(())
    }

    /// Swap tokens using AMM formula (x*y=k)
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        swap_direction: SwapDirection,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        let (reserve_in, reserve_out) = match swap_direction {
            SwapDirection::AToB => (pool.token_a_reserve, pool.token_b_reserve),
            SwapDirection::BToA => (pool.token_b_reserve, pool.token_a_reserve),
        };

        // Calculate fee
        let fee = (amount_in as u128)
            .checked_mul(pool.fee_basis_points as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;

        let amount_in_with_fee = amount_in.checked_sub(fee).unwrap();

        // Calculate output amount using x*y=k formula
        let numerator = (amount_in_with_fee as u128)
            .checked_mul(reserve_out as u128)
            .unwrap();
        let denominator = (reserve_in as u128)
            .checked_add(amount_in_with_fee as u128)
            .unwrap();
        let amount_out = numerator.checked_div(denominator).unwrap() as u64;

        require!(amount_out >= min_amount_out, CustomError::SlippageTooHigh);

        // Update reserves
        match swap_direction {
            SwapDirection::AToB => {
                pool.token_a_reserve = pool.token_a_reserve.checked_add(amount_in).unwrap();
                pool.token_b_reserve = pool.token_b_reserve.checked_sub(amount_out).unwrap();
            }
            SwapDirection::BToA => {
                pool.token_b_reserve = pool.token_b_reserve.checked_add(amount_in).unwrap();
                pool.token_a_reserve = pool.token_a_reserve.checked_sub(amount_out).unwrap();
            }
        }

        msg!("Swap executed: {} in -> {} out", amount_in, amount_out);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pool_name: String)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<LiquidityPool>()
    )]
    pub pool: Account<'info, LiquidityPool>,
    
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_a_mint,
        token::authority = pool
    )]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_b_mint,
        token::authority = pool
    )]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 8,
        mint::authority = pool
    )]
    pub pool_mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub user_token_in: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_out: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_vault_in: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_vault_out: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct LiquidityPool {
    pub authority: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub pool_mint: Pubkey,
    pub name: String,
    pub fee_basis_points: u16,
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub bump: u8,
}

#[derive(Clone, Copy)]
pub enum SwapDirection {
    AToB,
    BToA,
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,
    #[msg("Slippage tolerance exceeded")]
    SlippageTooHigh,
}
