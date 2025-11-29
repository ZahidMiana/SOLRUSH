use anchor_lang::prelude::*;
use crate::errors::CustomError;

// ============================================================================
// UTILITY FUNCTIONS (Module 2.1, 2.3, 2.4, 2.5, 3.1 Helpers)
// ============================================================================

/// Calculate LP tokens using geometric mean formula
/// LP tokens = sqrt(amount_a * amount_b)
/// Used in initialize_pool (Module 2.2)
pub fn calculate_lp_tokens(amount_a: u64, amount_b: u64) -> Result<u64> {
    let product = (amount_a as u128)
        .checked_mul(amount_b as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?;
    Ok((isqrt(product)) as u64)
}

/// Calculate LP tokens to mint when adding liquidity (Module 2.3)
/// Formula: min(lp_from_a, lp_from_b)
/// where: lp_from_x = (amount_x / reserve_x) * total_lp_supply
pub fn calculate_lp_tokens_for_add_liquidity(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    total_lp_supply: u64,
) -> Result<u64> {
    require!(amount_a > 0 && amount_b > 0, CustomError::InvalidAmount);
    require!(reserve_a > 0 && reserve_b > 0, CustomError::InsufficientLiquidity);

    let lp_from_a = (amount_a as u128)
        .checked_mul(total_lp_supply as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(reserve_a as u128)
        .ok_or(error!(CustomError::CalculationOverflow))? as u64;

    let lp_from_b = (amount_b as u128)
        .checked_mul(total_lp_supply as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(reserve_b as u128)
        .ok_or(error!(CustomError::CalculationOverflow))? as u64;

    Ok(if lp_from_a < lp_from_b { lp_from_a } else { lp_from_b })
}

/// Calculate return amounts when removing liquidity (Module 2.4)
/// Formulas:
/// amount_a = (lp_tokens_to_burn / total_lp_supply) * reserve_a
/// amount_b = (lp_tokens_to_burn / total_lp_supply) * reserve_b
pub fn calculate_remove_liquidity_amounts(
    lp_tokens_to_burn: u64,
    total_lp_supply: u64,
    reserve_a: u64,
    reserve_b: u64,
) -> Result<(u64, u64)> {
    require!(lp_tokens_to_burn > 0, CustomError::InvalidAmount);
    require!(total_lp_supply > 0, CustomError::InsufficientLiquidity);

    let amount_a = (lp_tokens_to_burn as u128)
        .checked_mul(reserve_a as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(total_lp_supply as u128)
        .ok_or(error!(CustomError::CalculationOverflow))? as u64;

    let amount_b = (lp_tokens_to_burn as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(total_lp_supply as u128)
        .ok_or(error!(CustomError::CalculationOverflow))? as u64;

    Ok((amount_a, amount_b))
}

/// Validate that amounts maintain pool ratio within 1% tolerance (Module 2.3)
pub fn validate_ratio_imbalance(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
) -> Result<()> {
    let expected_ratio = (reserve_b as u128)
        .checked_mul(10000)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(reserve_a as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    let provided_ratio = (amount_b as u128)
        .checked_mul(10000)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(amount_a as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    let tolerance = 100u128;
    let diff = if expected_ratio > provided_ratio {
        expected_ratio - provided_ratio
    } else {
        provided_ratio - expected_ratio
    };

    require!(diff <= tolerance, CustomError::RatioImbalance);
    Ok(())
}

/// Module 2.5 & 3.1: Calculate output amount for swaps with fee
/// 
/// Implements constant product formula: (x + amount_in) * (y - amount_out) = x * y
/// With fee deduction applied before swap calculation
/// 
/// Parameters:
/// - input_amount: Amount of input token to swap
/// - input_reserve: Current reserve of input token in pool
/// - output_reserve: Current reserve of output token in pool
/// - fee_numerator: Fee numerator (e.g., 3 for 0.3% fee)
/// - fee_denominator: Fee denominator (e.g., 1000 for 0.3% fee)
/// 
/// Returns: Amount of output tokens received
pub fn calculate_output_amount(
    input_amount: u64,
    input_reserve: u64,
    output_reserve: u64,
    fee_numerator: u64,
    fee_denominator: u64,
) -> Result<u64> {
    require!(input_amount > 0, CustomError::InvalidAmount);
    require!(
        input_reserve > 0 && output_reserve > 0,
        CustomError::InsufficientLiquidity
    );

    // Calculate amount after fee deduction
    // amount_with_fee = input_amount * (fee_denominator - fee_numerator) / fee_denominator
    let fee_amount = (input_amount as u128)
        .checked_mul(fee_numerator as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(fee_denominator as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    let amount_with_fee = (input_amount as u128)
        .checked_sub(fee_amount)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    // Apply constant product formula
    // k = input_reserve * output_reserve
    // output = output_reserve - (k / (input_reserve + amount_with_fee))
    let k = (input_reserve as u128)
        .checked_mul(output_reserve as u128)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    let new_input_reserve = (input_reserve as u128)
        .checked_add(amount_with_fee)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    let new_output_reserve = k
        .checked_div(new_input_reserve)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    let output_amount = (output_reserve as u128)
        .checked_sub(new_output_reserve)
        .ok_or(error!(CustomError::CalculationOverflow))?;

    require!(output_amount > 0, CustomError::InsufficientLiquidity);

    Ok(output_amount as u64)
}

/// Integer square root using Newton's method
pub fn isqrt(n: u128) -> u128 {
    if n < 2 {
        return n;
    }
    
    let mut x = n;
    let mut y = (x + 1) / 2;
    
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    
    x
}

// ============================================================================
// PYTH ORACLE PRICE FUNCTIONS (Module 3.5)
// ============================================================================

/// Get price from Pyth Oracle with 6 decimal precision
/// 
/// Note: This is a placeholder for Pyth integration.
/// Currently returns 0 - will be fully implemented with Pyth SDK in future updates.
/// 
/// For now, use calculate_pool_price() for local AMM price calculations.
/// 
/// Parameters:
/// - price_account: Pyth price account info
/// 
/// Returns: Price with 6 decimal precision
#[allow(unused)]
pub fn get_pyth_price(price_account: &AccountInfo) -> Result<u64> {
    // TODO: Implement Pyth Oracle integration
    // For now, return 0 as placeholder
    // This will be replaced with actual Pyth price fetching in future updates
    Ok(0)
}

/// Calculate local pool price with 6 decimal precision
/// 
/// Formula: price = (reserve_b * 1_000_000) / reserve_a
/// Returns price of token_a in terms of token_b
pub fn calculate_pool_price(reserve_a: u64, reserve_b: u64) -> Result<u64> {
    require!(reserve_a > 0, CustomError::InsufficientLiquidity);
    
    let price = (reserve_b as u128)
        .checked_mul(1_000_000)
        .ok_or(error!(CustomError::CalculationOverflow))?
        .checked_div(reserve_a as u128)
        .ok_or(error!(CustomError::CalculationOverflow))? as u64;
    
    Ok(price)
}

/// Compare pool price against target price for limit order execution
/// 
/// For sell orders (selling token_a for token_b):
/// - Condition: pool_price >= target_price (want more token_b per token_a)
/// 
/// Parameters:
/// - pool_price: Current pool price (reserve_b / reserve_a) with 6 decimals
/// - target_price: Target price with 6 decimals
/// - is_sell: true if selling token_a, false if selling token_b
/// 
/// Returns: true if price condition is met
pub fn check_price_condition(
    pool_price: u64,
    target_price: u64,
    is_sell: bool,
) -> bool {
    if is_sell {
        // For sell: we want pool_price >= target_price
        // (want to receive more per unit)
        pool_price >= target_price
    } else {
        // For buy: we want pool_price <= target_price
        // (want to pay less per unit)
        pool_price <= target_price
    }
}

