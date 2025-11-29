use anchor_lang::prelude::*;
use crate::errors::CustomError;

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

/// Module 2.5: Calculate output amount for swaps with fee
/// 
/// Formula:
/// amount_with_fee = input_amount * (fee_denominator - fee_numerator) / fee_denominator
/// numerator = amount_with_fee * output_reserve
/// denominator = input_reserve * fee_denominator + amount_with_fee * fee_denominator
/// output = numerator / denominator
///
/// This implements the constant product formula: (x + amount_in) * (y - amount_out) = x * y
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

/// Module 2.5: Get pool price (reserve_b / reserve_a)
/// Returns price as f64 for off-chain calculations
/// 
/// Price = reserve_b / reserve_a
/// Represents how many units of token_b equal 1 unit of token_a
pub fn get_pool_price(reserve_a: u64, reserve_b: u64) -> Result<f64> {
    require!(reserve_a > 0, CustomError::InsufficientLiquidity);
    
    let price = (reserve_b as f64) / (reserve_a as f64);
    Ok(price)
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


