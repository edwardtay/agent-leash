# 🤖 AgentLeash

**Your AI agents are spending your money. Shouldn't you have a leash on them?**

AgentLeash solves the "runaway agent" problem — AI agents with unlimited wallet access can drain funds in seconds. We give you granular, time-limited spending controls using MetaMask's ERC-7715 permissions, so your agents can only spend what you allow, when you allow it.

## 🎯 Hackathon Submission

**MetaMask Advanced Permissions Dev Cook-Off**

### Requirements Met:
- ✅ **ERC-7715 Advanced Permissions** - Grant fine-grained spending limits
- ✅ **Smart Accounts Kit** - Full integration for permission requests
- ✅ **Working Demo** - Real transactions on Sepolia & Base Sepolia
- ✅ **Envio HyperIndex** - Multi-chain indexing (Sepolia + Base Sepolia)

## 🤖 Agent Types

| Agent | What it does | Permission Type | Can Demo |
|-------|-------------|-----------------|----------|
| **DCA Bot** | Auto-buy tokens on schedule | `native-token-periodic` | ✅ Yes |
| **Auto-Transfer** | Send tokens to address periodically | `native-token-periodic` | ✅ Yes |
| **Gas Refiller** | Top up wallet when ETH low | `native-token-periodic` | ✅ Yes |
| **Savings Vault** | Auto-deposit to vault contract | `native-token-periodic` | ✅ Yes |

All agents work on Sepolia testnet with real transactions.

## 🔄 How It Works

```
1. Setup    → Choose agent type, configure limits
2. Grant    → Approve ERC-7715 permission via MetaMask Flask
3. Execute  → Agent sends real transactions within limits
4. Monitor  → Track spending, indexed by Envio, revoke anytime
```

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Create `.env.local`:
```env
VITE_PIMLICO_API_KEY=your_key
VITE_WALLET_CONNECT_PROJECT_ID=your_id
VITE_ENVIO_ENDPOINT=http://localhost:8080/v1/graphql
```

## 📊 Envio Integration

Multi-chain indexing on Sepolia and Base Sepolia:

```yaml
# indexer/config.yaml
networks:
  - id: 11155111  # Sepolia
  - id: 84532     # Base Sepolia
```

Indexed events:
- ERC20 Transfers (agent executions)
- Vault Deposits/Withdrawals
- Daily aggregated stats

## 🏗 Architecture

```
User Wallet (EOA)
    │
    ├── Grants ERC-7715 Permission
    │
    ▼
Agent Wallet (EOA)
    │
    ├── Executes within limits
    │
    ▼
Sepolia / Base Sepolia
    │
    ├── Transactions indexed by Envio
    │
    ▼
Dashboard (real-time analytics)
```

## 📁 Project Structure

```
agent-leash/
├── src/
│   ├── pages/          # Setup, Grant, Monitor flows
│   ├── lib/
│   │   ├── agent.ts    # Agent execution logic
│   │   ├── envio.ts    # Envio GraphQL client
│   │   └── permissions.ts
│   └── hooks/
│       └── usePermissions.ts  # ERC-7715 integration
├── contracts/
│   └── SimpleVault.sol # Demo vault contract
└── indexer/
    ├── config.yaml     # Envio config
    └── schema.graphql  # GraphQL schema
```

## 🔧 Tech Stack

- **Frontend**: Vite + React 19 + Tailwind v4
- **Wallet**: RainbowKit + Wagmi v2
- **Permissions**: MetaMask Smart Accounts Kit (ERC-7715)
- **Indexer**: Envio HyperIndex
- **Networks**: Sepolia, Base Sepolia

## ⚠️ Requirements

- MetaMask Flask v13.5+ (ERC-7715 support)
- Sepolia ETH for testing (fund agent wallet)

## 🎬 Demo Flow

1. Connect MetaMask Flask
2. Choose "DCA Bot" agent
3. Configure: 0.001 ETH per day
4. Grant permission (MetaMask popup)
5. Click "Test Execute" to send real transaction
6. View on Etherscan
7. See execution in Envio-indexed dashboard

---

**LEASH** — Limiting Expenditure for Autonomous Spending Hierarchies
