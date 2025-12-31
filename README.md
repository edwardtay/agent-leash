# 🤖 AgentLeash

**Your AI agents are spending your money. Shouldn't you have a leash on them?**

AgentLeash solves the "runaway agent" problem — AI agents with unlimited wallet access can drain funds in seconds. We give you granular, time-limited spending controls using ERC-7715 permissions, so your agents can only spend what you allow, when you allow it.

## 🔑 How It Works

```
Traditional Flow (Dangerous):
User funds Agent Wallet → Agent spends freely → 💸 Unlimited risk

AgentLeash Flow (Safe):
User grants Permission → Agent signs tx → User's wallet pays → 🔐 Controlled spending
```

**The agent never holds your funds.** It only has permission to spend FROM your wallet, within the limits you set.

## 🤖 Agent Types

| Agent | What it does |
|-------|-------------|
| 📈 **DCA Bot** | Swap tokens on schedule (ETH ↔ USDC) |
| 💸 **Auto-Transfer** | Send tokens periodically |
| ⛽ **Gas Refiller** | Top up wallet when ETH below threshold |
| 🏦 **Auto-Deposit** | Deposit to yield vaults automatically |

## 🚀 Getting Started

### Prerequisites
- MetaMask Flask v13.5+ (required for ERC-7715)
- Node.js 18+
- Testnet ETH (Sepolia or Base Sepolia)

### Installation

```bash
npm install
npm run dev
```

### Environment

Create `.env.local`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_SEPOLIA_RPC=https://your-rpc-endpoint
VITE_BASE_SEPOLIA_RPC=https://your-base-rpc-endpoint
```

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Wallet                        │
│                   (Funds stay here)                     │
└─────────────────────┬───────────────────────────────────┘
                      │ ERC-7715 Permission
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Agent Wallet                         │
│              (Signs txs, no funds)                      │
└─────────────────────┬───────────────────────────────────┘
                      │ Execute with delegation
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Target Contract (Vault)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ Events
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Envio HyperSync Indexer                    │
│            (Real-time multi-chain tracking)             │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Wallet | RainbowKit + Wagmi |
| Permissions | ERC-7715 / ERC-7710 |
| Indexer | Envio HyperIndex |
| Networks | Sepolia, Base Sepolia |
| Contracts | Solidity + Foundry |

## 📁 Structure

```
├── src/
│   ├── pages/          # App pages (Setup, Grant, Monitor)
│   ├── lib/            # Core logic (agent, permissions, envio)
│   ├── hooks/          # React hooks
│   └── components/     # UI components
├── contracts/          # Solidity contracts
├── indexer/            # Envio indexer config
└── script/             # Deployment scripts
```

## ⚠️ Notes

- Requires MetaMask Flask (regular MetaMask doesn't support ERC-7715 yet)
- Currently testnet only (Sepolia, Base Sepolia)
- Funds stay in your wallet - agent only has delegated permission

## 🔗 Links

- [ERC-7715 Spec](https://eips.ethereum.org/EIPS/eip-7715)
- [Envio HyperIndex](https://docs.envio.dev/)

---

**LEASH** — Limiting Expenditure for Autonomous Spending Hierarchies
