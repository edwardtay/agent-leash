# 🤖 AgentLeash

**Your AI agents are spending your money. Shouldn't you have a leash on them?**

AgentLeash solves the "runaway agent" problem — AI agents with unlimited wallet access can drain funds in seconds. We give you granular, time-limited spending controls using MetaMask's ERC-7715 permissions, so your agents can only spend what you allow, when you allow it.

## The Problem

AI agents need wallet access to execute trades, pay subscriptions, and manage DeFi positions. But current solutions are all-or-nothing: either full access or no access. One bug, one hack, one rogue agent — and your funds are gone.

## The Solution

AgentLeash implements **ERC-7715 Advanced Permissions** to create fine-grained spending controls:

- **Periodic limits**: "Spend max 0.1 ETH per day"
- **Streaming limits**: "Stream max 0.001 ETH per second"
- **Time-bound**: Permissions auto-expire
- **Instant revoke**: Cut off access with one click

## ERC-7715 Permission Types

| Type | Use Case | Example |
|------|----------|---------|
| `native-token-periodic` | DCA bots | Buy $10 ETH daily |
| `native-token-stream` | Subscriptions | Pay 0.001 ETH/sec |
| `erc20-token-periodic` | Trading bots | Spend 100 USDC/week |
| `erc20-token-stream` | Yield farming | Stream rewards |

## How It Works

```
1. Setup    → Choose agent type (DCA, Sniper, Payment, Yield)
2. Configure → Set spending limits and duration
3. Grant    → Approve via MetaMask (ERC-7715)
4. Monitor  → Track spending, revoke anytime
```

## Quick Start

```bash
npm install
npm run dev
```

Create `.env.local`:
```env
VITE_PIMLICO_API_KEY=your_key
VITE_WALLET_CONNECT_PROJECT_ID=your_id
```

## Architecture

```
User Wallet (EOA)
    │
    ├── Grants ERC-7715 Permission
    │
    ▼
Agent Wallet (EOA)
    │
    ├── Can spend within limits
    │
    ▼
Pimlico Bundler → Execute UserOps
```

## Tech Stack

- **Frontend**: Vite + React 19 + Tailwind v4
- **Wallet**: RainbowKit + Wagmi v2
- **Permissions**: MetaMask Smart Accounts Kit (ERC-7715)
- **Bundler**: Pimlico
- **Indexer**: Envio HyperIndex
- **Networks**: Sepolia (testnet), Base (mainnet)

## Requirements

- MetaMask Flask v13.5+ (ERC-7715 support)
- Sepolia ETH for testing

## Security

- Agent wallets are EOAs with private keys stored in localStorage (demo only)
- Production: Use secure key management (HSM, enclave)
- Permissions are on-chain and verifiable
- User can revoke anytime

---

**LEASH** — Limiting Expenditure for Autonomous Spending Hierarchies
