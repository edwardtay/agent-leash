# 🤖 AgentLeash

**Your AI agents are spending your money. Shouldn't you have a leash on them?**

AgentLeash solves the "runaway agent" problem — AI agents with unlimited wallet access can drain funds in seconds. We give you granular, time-limited spending controls using MetaMask's ERC-7715 permissions, so your agents can only spend what you allow, when you allow it.

## 🎯 Hackathon Submission

**MetaMask Advanced Permissions Dev Cook-Off**

### Requirements Met:
- ✅ **ERC-7715 Advanced Permissions** - Grant fine-grained spending limits to agents
- ✅ **Smart Accounts Kit** - Full integration with `erc7715ProviderActions` and `erc7710WalletActions`
- ✅ **Working Demo** - Real transactions on Sepolia & Base Sepolia
- ✅ **Envio HyperSync** - Multi-chain real-time indexing with live activity feed

## 🔑 Key Innovation: ERC-7715 Flow

```
Traditional Flow (Dangerous):
User funds Agent Wallet → Agent spends freely → 💸 Unlimited risk

AgentLeash Flow (Safe):
User grants Permission → Agent signs tx → User's wallet pays → 🔐 Controlled spending
```

**The agent never holds your funds.** It only has permission to spend FROM your wallet, within the limits you set.

## 🤖 Agent Types

| Agent | Icon | What it does | Use Case |
|-------|------|-------------|----------|
| **DCA Bot** | 📈 | Auto-buy tokens on schedule | Dollar-cost averaging |
| **Auto-Transfer** | 💸 | Send tokens periodically | Recurring payments |
| **Gas Refiller** | ⛽ | Top up a wallet when ETH low | Keep bots funded |
| **Savings Vault** | 🏦 | Auto-deposit to vault contract | Automated savings |

## � How It Works

```
1. Setup    → Choose agent type, set execution schedule & permission limits
2. Grant    → Approve ERC-7715 permission via MetaMask Flask
3. Monitor  → View all agents, their targets, and permissions
4. Execute  → Agent signs, YOUR wallet pays (within limits)
5. Track    → Live activity feed powered by Envio HyperSync
```

## 🚀 Quick Start

### Prerequisites
- **MetaMask Flask v13.5+** (required for ERC-7715)
- Node.js 18+
- Sepolia ETH (get from faucet)

### Installation

```bash
cd agent-leash
npm install
```

### Environment Setup

Create `.env.local`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_SEPOLIA_RPC=https://your-quicknode-sepolia-endpoint
VITE_BASE_SEPOLIA_RPC=https://your-quicknode-base-sepolia-endpoint
VITE_ENVIO_ENDPOINT=http://localhost:8080/v1/graphql
```

### Run the App

```bash
npm run dev
```

### Run Envio Indexer (Optional)

```bash
cd indexer
pnpm install
npx envio dev
```

## 📊 Envio HyperSync Integration

Real-time multi-chain indexing across Sepolia and Base Sepolia:

### Features:
- 🔴 **Live Activity Feed** - Auto-refreshes every 3 seconds
- ⚡ **HyperSync Speed** - 100,000+ blocks/sec backfill
- 🌐 **Multi-Chain** - Unified view of Sepolia + Base Sepolia
- 📈 **Indexed Events** - Vault deposits, withdrawals, daily stats

### Indexed Contracts:
| Network | Contract | Address |
|---------|----------|---------|
| Sepolia | SimpleVault | `0x9acec7011519F89C59d9A595f9829bBb79Ed0d4b` |
| Base Sepolia | SimpleVault | `0x93fc90a3Fb7d8c15bbaF50bFCc612B26CA8E68c8` |

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Wallet (EOA)                  │
│                   (Funds stay here!)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ ERC-7715 Permission Grant
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Agent Wallet (Signer)                │
│              (Signs txs, doesn't hold funds)            │
└─────────────────────┬───────────────────────────────────┘
                      │ sendTransactionWithDelegation()
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Sepolia / Base Sepolia                     │
│                 SimpleVault.deposit()                   │
└─────────────────────┬───────────────────────────────────┘
                      │ Events emitted
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 Envio HyperSync                         │
│            (Real-time multi-chain indexing)             │
└─────────────────────┬───────────────────────────────────┘
                      │ GraphQL API
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 AgentLeash Dashboard                    │
│              (Live activity feed, analytics)            │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
agent-leash/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── SetupSelect.tsx   # Choose agent type
│   │   ├── SetupAgent.tsx    # Configure agent & permissions
│   │   ├── Grant.tsx         # ERC-7715 permission request
│   │   └── Monitor.tsx       # Dashboard with live feed
│   ├── lib/
│   │   ├── agent.ts          # ERC-7710 execution with delegation
│   │   ├── envio.ts          # Envio GraphQL client
│   │   └── permissions.ts    # Permission management
│   ├── hooks/
│   │   └── usePermissions.ts # ERC-7715 permission hook
│   └── components/
│       ├── Header.tsx        # Wallet connect button
│       └── AddressDisplay.tsx
├── contracts/
│   └── SimpleVault.sol       # Demo vault contract
├── indexer/
│   ├── config.yaml           # Envio multi-chain config
│   ├── schema.graphql        # GraphQL schema
│   └── src/EventHandlers.ts  # Event handlers
└── script/
    └── deploy.sh             # Contract deployment script
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Wallet | RainbowKit + Wagmi v2 |
| Permissions | MetaMask Smart Accounts Kit (ERC-7715/7710) |
| Indexer | Envio HyperIndex + HyperSync |
| Networks | Sepolia, Base Sepolia |
| Contracts | Solidity + Foundry |

## 🎬 Demo Flow

1. **Connect** - MetaMask Flask wallet
2. **Setup** - Click "+ New Agent" → Choose "Savings Vault"
3. **Configure** - Set 0.001 ETH/daily, 7 days duration
4. **Grant** - Click "Approve Permission" → MetaMask popup
5. **Monitor** - See agent card with vault address
6. **Execute** - Click "⚡ Execute" → Watch tx confirm
7. **Track** - See deposit appear in Live Activity feed (HyperSync!)
8. **Manage** - Delete agents, revoke permissions anytime

## ⚠️ Important Notes

- **MetaMask Flask Required** - Regular MetaMask doesn't support ERC-7715 yet
- **Testnet Only** - Sepolia and Base Sepolia
- **Funds Stay Safe** - Agent signs, but YOUR wallet pays via delegation

## 🔗 Links

- [MetaMask Smart Accounts Kit](https://docs.metamask.io/wallet/concepts/smart-accounts/)
- [ERC-7715 Spec](https://eips.ethereum.org/EIPS/eip-7715)
- [Envio HyperIndex](https://docs.envio.dev/)

---

**LEASH** — Limiting Expenditure for Autonomous Spending Hierarchies
