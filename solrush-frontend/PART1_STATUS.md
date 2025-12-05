# Part 1 Installation Status

## ✅ Already Installed
- **Anchor CLI**: v0.31.1 ✓

## ❌ Installation Blocked
- **Solana CLI**: TLS/SSL error preventing automatic installation

## Alternative Installation Methods

### Method 1: Build from Source (Recommended)
Since you have Rust and Cargo installed, this is the most reliable method:

```bash
# This will take 10-15 minutes
cargo install solana-cli --version 1.18.26

# After installation, add to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Verify
solana --version
```

### Method 2: Manual Download
1. Visit: https://github.com/solana-labs/solana/releases/tag/v1.18.26
2. Download: `solana-release-x86_64-unknown-linux-gnu.tar.bz2`
3. Extract: `tar jxf solana-release-x86_64-unknown-linux-gnu.tar.bz2`
4. Move to PATH: `sudo mv solana-release /usr/local/solana`
5. Add to PATH: `export PATH="/usr/local/solana/bin:$PATH"`

### Method 3: Package Manager (Ubuntu/Debian)
```bash
# Add Solana repository
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/solana-archive-keyring.gpg] https://release.solana.com/stable/ solana main" > /etc/apt/sources.list.d/solana.list'

# Install
sudo apt-get update
sudo apt-get install solana-cli
```

## Next Steps After Installation

Once Solana CLI is installed, run these commands:

```bash
# Configure for Devnet
solana config set --url https://api.devnet.solana.com

# Create wallet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Fund wallet
solana airdrop 2
solana airdrop 2
solana airdrop 2

# Verify
solana balance
```

## TLS Error Details
```
curl: (35) TLS connect error: error:0A000126:SSL routines::unexpected eof while reading
```

This indicates a network/firewall issue preventing HTTPS connections to release.solana.com.
