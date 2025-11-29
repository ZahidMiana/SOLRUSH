use anchor_lang::prelude::*;

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

#[error_code]
pub enum CustomError {
    #[msg("Initial deposits must be greater than zero")]
    InvalidInitialDeposit,
    
    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageTooHigh,
    
    #[msg("Invalid fee parameters")]
    InvalidFeeParameters,
    
    #[msg("Overflow detected in calculation")]
    CalculationOverflow,
    
    #[msg("Pool ratio imbalance exceeds tolerance")]
    RatioImbalance,
    
    #[msg("Insufficient user token balance")]
    InsufficientBalance,
    
    #[msg("Insufficient LP token balance")]
    InsufficientLPBalance,
    
    #[msg("Invalid amount: must be greater than zero")]
    InvalidAmount,
    
    #[msg("Insufficient pool reserves")]
    InsufficientPoolReserves,
}
