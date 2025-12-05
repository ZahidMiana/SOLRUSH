# SOLRUSH DEX - Devnet Deployment Guide

## 🎯 Overview
This guide will take you through deploying SOLRUSH DEX to Solana Devnet with full blockchain integration. We'll go step-by-step, part-by-part.

---

## 📦 Part 1: Prerequisites & Environment Setup

### Step 1.1: Install Solana CLI

**What it does**: Solana CLI lets you interact with the Solana blockchain, deploy programs, and manage wallets.

**Installation:**
```bash
# Download and install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add this to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc

# Verify installation
solana --version
# Expected output: solana-cli 1.18.x
```

**Configure for Devnet:**
```bash
# Set Solana to use Devnet
solana config set --url https://api.devnet.solana.com

# Verify configuration
solana config get
# Expected output:
# Config File: /home/user/.config/solana/cli/config.yml
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/
```

---

### Step 1.2: Install Rust & Anchor Framework

**What it does**: Anchor is the framework for building Solana programs (smart contracts).

**Install Rust:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts, choose default installation

# Reload shell
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

**Install Anchor:**
```bash
# Install Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install latest Anchor version
avm install latest
avm use latest

# Verify installation
anchor --version
# Expected output: anchor-cli 0.29.x
```

---

### Step 1.3: Create Devnet Wallet

**What it does**: Creates a wallet for deploying contracts and paying transaction fees on Devnet.

**Create wallet:**
```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# You'll be asked to set a passphrase (optional, press Enter to skip)
# IMPORTANT: Save the seed phrase shown! (though this is just Devnet)

# Set as default wallet
solana config set --keypair ~/.config/solana/devnet-wallet.json

# Check your wallet address
solana address
# Copy this address - you'll need it!
```

**Fund your wallet:**
```bash
# Airdrop 2 SOL (Devnet SOL is free)
solana airdrop 2

# Check balance
solana balance
# Expected output: 2 SOL

# Airdrop more if needed (max 2 SOL per request)
solana airdrop 2
solana balance
# Should show: 4 SOL
```

**💡 Tip**: You need at least 5 SOL for deployment. Run `solana airdrop 2` multiple times until you have 5+ SOL.

---

### Step 1.4: Verify All Installations

**Run these commands to verify everything is installed:**
```bash
# Check Solana
solana --version
solana config get
solana balance

# Check Rust
rustc --version
cargo --version

# Check Anchor
anchor --version

# All should show version numbers without errors
```

**✅ Checklist - Part 1 Complete:**
- [ ] Solana CLI installed and configured for Devnet
- [ ] Rust and Cargo installed
- [ ] Anchor CLI installed
- [ ] Devnet wallet created
- [ ] Wallet funded with 5+ SOL

---

## 🚀 Part 2: Smart Contract Setup & Deployment

### Step 2.1: Locate Smart Contract
We found the smart contract code in `../solrush-dex`.

### Step 2.2: Build the Program
Run these commands to build the smart contract:

```bash
cd ../solrush-dex
anchor build
```

This will compile the Rust code into a BPF program (`.so` file) and generate the IDL (`.json` file).

### Step 2.3: Deploy to Devnet
Once built, deploy it to Devnet:

```bash
# Ensure you are in ../solrush-dex
anchor deploy --provider.cluster devnet --provider.wallet ~/.config/solana/devnet-wallet.json
```

**Important**: After deployment, you will see a **Program ID**. Copy it!

### Step 2.4: Update Frontend Configuration
1. Open `solrush-frontend/.env.local`
2. Update `NEXT_PUBLIC_PROGRAM_ID` with your new Program ID.

### Step 2.5: Copy IDL to Frontend
```bash
# From solrush-dex directory
cp target/idl/solrush_dex.json ../solrush-frontend/anchor.json
```

**✅ Checklist - Part 2 Complete:**
- [ ] Program built successfully
- [ ] Program deployed to Devnet
- [ ] Program ID updated in frontend .env.local
- [ ] IDL copied to frontend anchor.json

---

## 💧 Part 3: Pool Initialization (Coming Next)


---

## 📝 Progress Tracker

| Part | Status | Time Estimate |
|------|--------|---------------|
| Part 1: Prerequisites | 🔄 In Progress | 15-30 min |
| Part 2: Smart Contract | ⏳ Pending | 30-60 min |
| Part 3: Pool Initialization | ⏳ Pending | 30 min |
| Part 4: Frontend Integration | ⏳ Pending | 2-3 hours |
| Part 5: Testing | ⏳ Pending | 1-2 hours |

---

## 🆘 Troubleshooting

### Issue: "command not found: solana"
**Solution**: PATH not set correctly. Add to ~/.bashrc:
```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```
Then run: `source ~/.bashrc`

### Issue: "Airdrop failed"
**Solution**: Devnet rate limits. Wait 30 seconds and try again, or use:
```bash
# Alternative faucet
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["YOUR_ADDRESS","2000000000"]}' https://api.devnet.solana.com
```

### Issue: "cargo: command not found"
**Solution**: Rust not in PATH. Run:
```bash
source $HOME/.cargo/env
```

---

## 📞 Next Steps

Once you complete Part 1, let me know and we'll proceed to:
- **Part 2**: Building and deploying the smart contract
- Checking if you have existing Solana program code
- Creating the program if needed
