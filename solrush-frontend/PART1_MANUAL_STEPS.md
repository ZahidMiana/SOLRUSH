# Part 1: Manual Steps Required

## Issue
Solana CLI installation requires system dependencies that need sudo access.

## Required Actions

### Step 1: Install System Dependencies
Run this command in your terminal and enter your password when prompted:

```bash
sudo apt-get update && sudo apt-get install -y libudev-dev pkg-config libssl-dev
```

### Step 2: Retry Solana CLI Installation
After installing dependencies, run:

```bash
cargo install solana-cli --version 1.18.26
```

This will take 10-15 minutes to compile.

### Step 3: Add to PATH
After installation completes, add Solana to your PATH:

```bash
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Step 4: Verify Installation
```bash
solana --version
# Should output: solana-cli 1.18.26
```

### Step 5: Configure for Devnet
```bash
solana config set --url https://api.devnet.solana.com
```

### Step 6: Create Wallet
```bash
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json
```

### Step 7: Fund Wallet
```bash
solana airdrop 2
solana airdrop 2
solana airdrop 2
solana balance
# Should show: 6 SOL
```

## Quick All-in-One Script

After installing dependencies, you can run this:

```bash
# Install Solana CLI
cargo install solana-cli --version 1.18.26

# Add to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Configure
solana config set --url https://api.devnet.solana.com

# Create wallet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Fund wallet
solana airdrop 2 && solana airdrop 2 && solana airdrop 2

# Verify
solana balance
```

## Status Checklist

- [ ] System dependencies installed (libudev-dev, pkg-config, libssl-dev)
- [ ] Solana CLI installed via cargo
- [ ] PATH updated
- [ ] Configured for Devnet
- [ ] Wallet created
- [ ] Wallet funded with 6+ SOL
- [ ] Ready for Part 2!
