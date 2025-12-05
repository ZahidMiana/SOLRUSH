# Environment Configuration

This document explains how to configure the SOLRUSH DEX frontend for different networks.

## Network Configuration

The application supports three networks:
- **Localnet** - Local Solana validator (default: `http://127.0.0.1:8899`)
- **Devnet** - Solana Devnet (default: `https://api.devnet.solana.com`)
- **Mainnet** - Solana Mainnet Beta (default: `https://api.mainnet-beta.solana.com`)

### Setup Instructions

1. Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

2. Configure your environment variables:

```env
# Network: localnet, devnet, or mainnet
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Optional: Custom RPC endpoint (overrides network preset)
# NEXT_PUBLIC_RPC_ENDPOINT=https://your-custom-rpc.com

# Optional: Custom Program ID
# NEXT_PUBLIC_PROGRAM_ID=YourProgramIDHere
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Network preset (localnet/devnet/mainnet) | `devnet` |
| `NEXT_PUBLIC_RPC_ENDPOINT` | Custom RPC endpoint URL | Network preset URL |
| `NEXT_PUBLIC_PROGRAM_ID` | Your deployed program ID | `3jRmy5gMAQLFxb2mD3Gi4p9N9VuwLXp9toaqEhi1QSRT` |

### Examples

**Using Devnet:**
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

**Using Custom RPC:**
```env
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
```

**Using Mainnet with Custom RPC:**
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet
NEXT_PUBLIC_RPC_ENDPOINT=https://solana-api.projectserum.com
NEXT_PUBLIC_PROGRAM_ID=YourMainnetProgramID
```

## Token List

The application fetches token metadata from Jupiter's strict token list API:
- **API**: `https://token.jup.ag/strict`
- **Caching**: 24 hours in localStorage
- **Fallback**: Default tokens (SOL, USDC, USDT) if API fails

### Features
- ✅ Automatic token list fetching
- ✅ 24-hour caching
- ✅ Search functionality
- ✅ Token logos and metadata
- ✅ Fallback to cached/default tokens

## Development

After updating `.env.local`, restart the development server:

```bash
npm run dev
```

## Production

For production deployment, set environment variables in your hosting platform (Vercel, Netlify, etc.):

1. Go to your project settings
2. Add environment variables
3. Redeploy the application

## Troubleshooting

**Issue**: Application not connecting to network
- **Solution**: Check `NEXT_PUBLIC_RPC_ENDPOINT` is correct and accessible

**Issue**: Token list not loading
- **Solution**: Check internet connection and Jupiter API status

**Issue**: Program not found
- **Solution**: Verify `NEXT_PUBLIC_PROGRAM_ID` matches your deployed program
