# Module 3: Trading Functionality Documentation

## Overview

Module 3 implements all trading functionalities for the SolRush DEX. This module provides:
- **3.1 Swap Function**: Core AMM-based instant trade mechanism
- **3.2 Market Buy**: User-friendly wrapper for buying SOL with USDC
- **3.3 Market Sell**: User-friendly wrapper for selling SOL for USDC

All trading operations use the constant product formula (Automated Market Maker model) with a 0.3% fee structure.

---

## 3.1 Swap Function (Core Trading)

### Purpose
Execute instant swaps using the Automated Market Maker (AMM) model. This is the core trading engine that both market_buy and market_sell wrap around.

### Function Signature
```rust
pub fn swap(
    ctx: Context<Swap>,
    amount_in: u64,
    minimum_amount_out: u64,
    is_a_to_b: bool,
) -> Result<()>
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `amount_in` | u64 | Amount of input token to swap |
| `minimum_amount_out` | u64 | Minimum output amount (slippage protection) |
| `is_a_to_b` | bool | Direction: true = Token A→B (SOL→USDC), false = Token B→A (USDC→SOL) |

### Formula
The swap uses the constant product formula with 0.3% fee deduction:

$$\text{fee\_multiplier} = 997 \text{ (0.3\% fee: } 1000 - 3 \text{)}$$

$$\text{amount\_in\_with\_fee} = \text{amount\_in} \times \frac{997}{1000}$$

$$\text{numerator} = \text{amount\_in\_with\_fee} \times \text{output\_reserve}$$

$$\text{denominator} = (\text{input\_reserve} \times 1000) + \text{amount\_in\_with\_fee}$$

$$\text{amount\_out} = \frac{\text{numerator}}{\text{denominator}}$$

### Implementation Steps

1. **Validate input amount** > 0
2. **Get current pool state** (reserves, fee parameters)
3. **Determine input/output reserves** based on swap direction (is_a_to_b)
4. **Verify pool liquidity** (both reserves > 0)
5. **Verify user balance** (has sufficient input tokens)
6. **Calculate output amount** using constant product formula with fee
7. **Validate slippage** (amount_out ≥ minimum_amount_out)
8. **Verify pool vault liquidity** (sufficient output tokens available)
9. **Transfer input tokens** from user to pool vault
10. **Update pool reserves**:
    - If A→B: reserve_a += amount_in, reserve_b -= amount_out
    - If B→A: reserve_b += amount_in, reserve_a -= amount_out
11. **Transfer output tokens** from pool vault to user
12. **Emit SwapExecuted event** with swap details and new reserves
13. **Log transaction** with direction, amounts, and fees

### Context Structure
```rust
#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)] pub pool: Account<'info, LiquidityPool>,
    #[account(mut)] pub user_token_in: Account<'info, TokenAccount>,
    #[account(mut)] pub user_token_out: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault_in: Account<'info, TokenAccount>,
    #[account(mut)] pub pool_vault_out: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

### Validations & Error Handling

| Validation | Error | Condition |
|-----------|-------|-----------|
| Input amount validation | `InvalidAmount` | amount_in must be > 0 |
| Pool liquidity check | `InsufficientLiquidity` | Both reserves must be > 0 |
| User balance check | `InsufficientBalance` | User must have ≥ amount_in |
| Slippage protection | `SlippageTooHigh` | amount_out must be ≥ minimum_amount_out |
| Pool vault liquidity | `InsufficientPoolReserves` | Pool vault must have ≥ amount_out |
| Arithmetic overflow | `CalculationOverflow` | All checked_* operations for overflow |

### Events
```rust
emit!(SwapExecuted {
    user: Pubkey,                    // User executing swap
    pool: Pubkey,                    // Pool address
    amount_in: u64,                  // Input amount
    amount_out: u64,                 // Output amount
    fee_amount: u64,                 // Fee deducted (0.3%)
    is_a_to_b: bool,                 // Direction
    new_reserve_a: u64,              // Updated SOL reserve
    new_reserve_b: u64,              // Updated USDC reserve
});
```

### Example: SOL→USDC Swap

**Scenario**: User swaps 1 SOL for USDC
- Pool state: reserve_a=100 SOL, reserve_b=1000 USDC
- User input: amount_in=1 SOL, minimum_amount_out=5 USDC (acceptable slippage)

**Calculation**:
```
fee_amount = 1 * 3 / 1000 = 0.003 SOL
amount_in_with_fee = 1 * 997 / 1000 = 0.997 SOL
numerator = 0.997 * 1000 = 997
denominator = (100 * 1000) + 0.997 = 100000.997
amount_out = 997 / 100000.997 ≈ 9.97 USDC

New reserves:
reserve_a = 100 + 1 = 101 SOL
reserve_b = 1000 - 9.97 = 990.03 USDC
```

---

## 3.2 Market Buy Function (Wrapper)

### Purpose
Simplified interface for buying SOL with USDC. This wraps the swap() function with user-friendly naming and fixed direction (USDC→SOL). Conceptually: "I want to buy X SOL" instead of "swap USDC for SOL".

### Function Signature
```rust
pub fn market_buy(
    ctx: Context<MarketBuy>,
    usdc_amount: u64,          // How much USDC to spend
    min_sol_received: u64,     // Minimum SOL expected
) -> Result<()>
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `usdc_amount` | u64 | Amount of USDC to spend |
| `min_sol_received` | u64 | Minimum SOL expected (slippage protection) |

### Implementation
Market_buy is a direct wrapper around swap() with fixed parameters:
```
Calls: swap(
    amount_in = usdc_amount,
    minimum_amount_out = min_sol_received,
    is_a_to_b = false  // USDC→SOL (Token B → Token A)
)
```

### Context Structure
```rust
#[derive(Accounts)]
pub struct MarketBuy<'info> {
    #[account(mut)] pub pool: Account<'info, LiquidityPool>,
    #[account(mut)] pub user_token_in: Account<'info, TokenAccount>,   // User's USDC
    #[account(mut)] pub user_token_out: Account<'info, TokenAccount>,  // User's SOL
    #[account(mut)] pub pool_vault_in: Account<'info, TokenAccount>,   // Pool's USDC vault
    #[account(mut)] pub pool_vault_out: Account<'info, TokenAccount>,  // Pool's SOL vault
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

### Key Features
- ✅ Fixed direction: always USDC→SOL (no confusion)
- ✅ Slippage protection with min_sol_received
- ✅ Reuses all validation logic from swap()
- ✅ Fee calculation included (0.3%)
- ✅ Event emission with is_a_to_b=false
- ✅ User-friendly logging: "Market buy executed"

### Example: Market Buy 100 USDC
```
User calls: market_buy(usdc_amount=100, min_sol_received=8)
Expected: Spend 100 USDC, receive at least 8 SOL
If market rate gives 8.5 SOL, transaction succeeds
If market rate gives 7.9 SOL, transaction fails (slippage exceeded)
```

---

## 3.3 Market Sell Function (Wrapper)

### Purpose
Simplified interface for selling SOL for USDC. This wraps the swap() function with fixed direction (SOL→USDC). Conceptually: "I want to sell X SOL" instead of "swap SOL for USDC".

### Function Signature
```rust
pub fn market_sell(
    ctx: Context<MarketSell>,
    sol_amount: u64,           // How much SOL to sell
    min_usdc_received: u64,    // Minimum USDC expected
) -> Result<()>
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `sol_amount` | u64 | Amount of SOL to sell |
| `min_usdc_received` | u64 | Minimum USDC expected (slippage protection) |

### Implementation
Market_sell is a direct wrapper around swap() with fixed parameters:
```
Calls: swap(
    amount_in = sol_amount,
    minimum_amount_out = min_usdc_received,
    is_a_to_b = true  // SOL→USDC (Token A → Token B)
)
```

### Context Structure
```rust
#[derive(Accounts)]
pub struct MarketSell<'info> {
    #[account(mut)] pub pool: Account<'info, LiquidityPool>,
    #[account(mut)] pub user_token_in: Account<'info, TokenAccount>,   // User's SOL
    #[account(mut)] pub user_token_out: Account<'info, TokenAccount>,  // User's USDC
    #[account(mut)] pub pool_vault_in: Account<'info, TokenAccount>,   // Pool's SOL vault
    #[account(mut)] pub pool_vault_out: Account<'info, TokenAccount>,  // Pool's USDC vault
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

### Key Features
- ✅ Fixed direction: always SOL→USDC (no confusion)
- ✅ Slippage protection with min_usdc_received
- ✅ Reuses all validation logic from swap()
- ✅ Fee calculation included (0.3%)
- ✅ Event emission with is_a_to_b=true
- ✅ User-friendly logging: "Market sell executed"

### Example: Market Sell 10 SOL
```
User calls: market_sell(sol_amount=10, min_usdc_received=85)
Expected: Sell 10 SOL, receive at least 85 USDC
If market rate gives 90 USDC, transaction succeeds
If market rate gives 84 USDC, transaction fails (slippage exceeded)
```

---

## Fee Structure

All trading functions (swap, market_buy, market_sell) use **0.3% fee**:

| Component | Value |
|-----------|-------|
| Fee numerator | 3 |
| Fee denominator | 1000 |
| Fee percentage | 0.3% |

**Fee Calculation**:
```
fee_amount = input_amount × (fee_numerator / fee_denominator)
fee_amount = input_amount × (3 / 1000) = 0.3%
```

**Example**:
- Swap 100 SOL: fee = 100 × 3 / 1000 = 0.3 SOL
- Swap 1000 USDC: fee = 1000 × 3 / 1000 = 3 USDC

The fee is automatically deducted from the input amount before executing the swap.

---

## Flow Diagram

### Swap Flow (Core)
```
swap(amount_in, minimum_amount_out, is_a_to_b)
    ├─ Validate: amount_in > 0
    ├─ Get pool reserves based on is_a_to_b
    ├─ Validate: reserves > 0 AND user_balance >= amount_in
    ├─ Calculate: output_amount (with 0.3% fee deduction)
    ├─ Validate: output_amount >= minimum_amount_out (slippage)
    ├─ Validate: pool_vault >= output_amount
    ├─ Transfer: amount_in from user → pool_vault_in
    ├─ Update: pool reserves
    ├─ Transfer: amount_out from pool_vault_out → user
    ├─ Emit: SwapExecuted event
    └─ Return: Success or Error
```

### Market Buy Flow
```
market_buy(usdc_amount, min_sol_received)
    └─ swap(usdc_amount, min_sol_received, false)  // USDC→SOL
```

### Market Sell Flow
```
market_sell(sol_amount, min_usdc_received)
    └─ swap(sol_amount, min_usdc_received, true)   // SOL→USDC
```

---

## Comparison Table

| Feature | Swap | Market Buy | Market Sell |
|---------|------|-----------|------------|
| Flexibility | High (any direction) | Fixed (B→A) | Fixed (A→B) |
| Complexity | Medium | Low | Low |
| Use Case | Advanced traders | Buy SOL | Sell SOL |
| Direction control | User-specified | Automatic | Automatic |
| Slippage protection | ✅ Yes | ✅ Yes | ✅ Yes |
| Fee handling | Automatic | Automatic | Automatic |

---

## Testing Scenarios

### 3.1 Swap Tests
1. **Basic A→B swap**: SOL→USDC with valid amounts
2. **Basic B→A swap**: USDC→SOL with valid amounts
3. **Slippage protection**: Amount too low triggers failure
4. **Insufficient pool liquidity**: Exceeds available output
5. **Insufficient user balance**: User has no tokens to swap
6. **Invalid amount**: Zero or negative input
7. **Fee calculation**: Verify 0.3% deducted correctly
8. **Reserve updates**: Verify bidirectional updates
9. **Event emission**: Verify SwapExecuted event data

### 3.2 Market Buy Tests
1. **Basic market buy**: 100 USDC → ~8 SOL
2. **Slippage protection**: Reject if SOL below min threshold
3. **Fee deduction**: Verify 0.3% included in calculation
4. **Reserve balance**: USDC increases, SOL decreases
5. **Event tracking**: Verify is_a_to_b=false in event
6. **Insufficient USDC**: User doesn't have enough to buy

### 3.3 Market Sell Tests
1. **Basic market sell**: 10 SOL → ~90 USDC
2. **Slippage protection**: Reject if USDC below min threshold
3. **Fee deduction**: Verify 0.3% included in calculation
4. **Reserve balance**: SOL increases, USDC decreases
5. **Event tracking**: Verify is_a_to_b=true in event
6. **Insufficient SOL**: User doesn't have enough to sell

---

## Error Reference

| Error Code | Message | Occurs When |
|------------|---------|------------|
| `InvalidAmount` | Invalid amount: must be > 0 | amount_in = 0 or negative |
| `InsufficientLiquidity` | Insufficient liquidity in pool | Reserves = 0 or negative |
| `InsufficientBalance` | Insufficient user token balance | User has < amount_in |
| `SlippageTooHigh` | Slippage tolerance exceeded | amount_out < minimum_amount_out |
| `InsufficientPoolReserves` | Insufficient pool reserves | Pool vault < amount_out |
| `CalculationOverflow` | Overflow detected in calculation | Math operations exceed u128 limits |

---

## State Changes

### Pool Account Changes
```
Before swap:
  reserve_a = X
  reserve_b = Y
  total_lp_supply = L

After A→B swap(amount_in):
  reserve_a = X + amount_in
  reserve_b = Y - amount_out
  total_lp_supply = L (unchanged)
```

### User Token Accounts
```
Before swap:
  user_token_in = A
  user_token_out = B

After swap:
  user_token_in = A - amount_in
  user_token_out = B + amount_out
```

---

## Security Considerations

1. **Slippage Protection**: minimum_amount_out prevents unfavorable trades
2. **Overflow Prevention**: All math uses checked_* operations
3. **Vault Authority**: Only pool can authorize withdrawals from vaults
4. **PDA Seeds**: Pool identity verified via PDA signature
5. **Token Program**: All transfers go through official token program
6. **Account Validation**: All accounts verified through Anchor constraints

---

## Implementation Status

| Module | Status | Tests | Deployment |
|--------|--------|-------|------------|
| 3.1 Swap | ✅ Complete | Pending | Pending |
| 3.2 Market Buy | ✅ Complete | Pending | Pending |
| 3.3 Market Sell | ✅ Complete | Pending | Pending |

---

## Next Steps

1. ✅ Implement swap() function - **DONE**
2. ✅ Implement market_buy() function - **DONE**
3. ✅ Implement market_sell() function - **DONE**
4. ⏳ Write comprehensive tests (swap.ts)
5. ⏳ Integration testing with real pools
6. ⏳ Performance benchmarking
7. ⏳ Security audit
8. ⏳ Mainnet deployment

---

## File Structure

```
programs/solrush-dex/src/
├── lib.rs                    # Main program with all instructions
│   ├── State structures
│   ├── Events (SwapExecuted added)
│   ├── Utility functions
│   ├── Instructions:
│   │   ├── initialize_pool (Module 2.2)
│   │   ├── add_liquidity (Module 2.3)
│   │   ├── remove_liquidity (Module 2.4)
│   │   ├── swap (Module 3.1)          ✅ NEW
│   │   ├── market_buy (Module 3.2)    ✅ NEW
│   │   └── market_sell (Module 3.3)   ✅ NEW
│   └── Contexts
├── state/mod.rs              # State structures (modular)
├── errors/mod.rs             # Error codes (modular)
└── utils.rs                  # Helper functions
```

---

## Version Information

- **Module**: 3 (Trading)
- **Submodules**: 3.1, 3.2, 3.3
- **Framework**: Anchor 0.31.1
- **Solana Program Library**: spl-token
- **Status**: Complete & Compiling

---

## Contact & Support

For questions or issues regarding Module 3 trading functionality:
- Review this documentation
- Check test files for usage examples
- Refer to error codes section for debugging
