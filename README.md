# AgentLeash

**Granular spending controls for AI agents using ERC-7715 permissions.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE PROBLEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User ──► Agent Wallet ──► Unlimited Access ──► 💀 Drained in seconds     │
│                                                                             │
│   AI agents need wallet access to execute trades, deposits, transfers.     │
│   Traditional approach: fund a hot wallet the agent controls.              │
│   Risk: agent bug, prompt injection, or malicious update = total loss.     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE SOLUTION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User ──► ERC-7715 Permission ──► Agent signs ──► User wallet pays        │
│                 │                                                           │
│                 ├── Token: ETH or USDC                                      │
│                 ├── Amount: 0.1 ETH per day                                 │
│                 ├── Period: hourly/daily/weekly                             │
│                 └── Expiry: 7 days                                          │
│                                                                             │
│   Agent never holds funds. Permission is time-bound and rate-limited.      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   USER WALLET                                    │
│                          (MetaMask Flask + Smart Account)                        │
│                                                                                  │
│   ┌─────────────────┐    ERC-7715     ┌─────────────────┐                       │
│   │  Funds (ETH)    │◄───Permission───│  Delegation     │                       │
│   │  Funds (USDC)   │    Grant        │  Manager        │                       │
│   └─────────────────┘                 └────────┬────────┘                       │
└───────────────────────────────────────────────┼──────────────────────────────────┘
                                                │
                        permissionsContext + delegationManager
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  AGENT WALLET                                    │
│                              (EOA, no funds needed)                              │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  sendTransactionWithDelegation({                                        │   │
│   │    to: vault,                                                           │   │
│   │    value: 0.01 ETH,                                                     │   │
│   │    data: deposit(),                                                     │   │
│   │    permissionsContext,    ◄── proves agent has permission               │   │
│   │    delegationManager      ◄── routes through user's smart account       │   │
│   │  })                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────┬──────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                TARGET CONTRACTS                                  │
├────────────────────┬─────────────────────┬───────────────────────────────────────┤
│    SimpleVault     │     YieldVault      │           AaveWrapper                 │
│    (demo)          │     (unified)       │     (ETH→WETH→Aave supply)            │
├────────────────────┴─────────────────────┴───────────────────────────────────────┤
│                                                                                  │
│   Sepolia:     0x9acec...d4b    0xcE338...6D4    0xdb1ac...c8E                   │
│   Base Sepolia: 0x93fc9...c8    0x78Efd...9Bb    (no Aave)                       │
│                                                                                  │
│   emit Deposit(user, amount, timestamp)  ──────────────────────┐                │
│   emit Withdrawal(user, amount, timestamp)                     │                │
└────────────────────────────────────────────────────────────────┼─────────────────┘
                                                                 │
                                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              ENVIO HYPERINDEX                                    │
│                         (real-time multi-chain indexing)                         │
│                                                                                  │
│   GraphQL: https://indexer.dev.hyperindex.xyz/.../graphql                        │
│                                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│   │  VaultDeposit   │  │ VaultWithdrawal │  │   DailyStats    │                 │
│   │  - user         │  │  - user         │  │  - totalVolume  │                 │
│   │  - amount       │  │  - amount       │  │  - uniqueUsers  │                 │
│   │  - chainId      │  │  - chainId      │  │  - chainId      │                 │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Permission Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERC-7715 PERMISSION TYPES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PERIODIC (rate-limited)                                                    │
│  ├── native-token-periodic    ETH: 0.1/day for 7 days                      │
│  └── erc20-token-periodic     USDC: 100/week for 30 days                   │
│                                                                             │
│  STREAMING (continuous)                                                     │
│  ├── native-token-stream      ETH: 0.0001/second, max 1 ETH                │
│  └── erc20-token-stream       USDC: 0.01/second, max 1000 USDC             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Permission Request Structure:                                              │
│  {                                                                          │
│    chainId: 11155111,                                                       │
│    expiry: 1735689600,                                                      │
│    signer: { type: "account", data: { address: agentWallet } },            │
│    permission: {                                                            │
│      type: "native-token-periodic",                                         │
│      data: { periodAmount, periodDuration, startTime, justification }       │
│    }                                                                        │
│  }                                                                          │
│                                                                             │
│  Permission Response:                                                       │
│  [{ permissionsContext, signerMeta: { delegationManager } }]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Contracts

```solidity
// AaveWrapper.sol - ETH → WETH → Aave in one call
function deposit() external payable {
    WETH.deposit{value: msg.value}();
    AAVE_POOL.supply(address(WETH), msg.value, msg.sender, 0);
    emit Deposit(msg.sender, msg.value, block.timestamp);
}

// Sepolia Aave V3 addresses:
// Pool:  0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
// WETH:  0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c
// aWETH: 0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830
```

## Stack

| Component | Implementation |
|-----------|----------------|
| Permissions | `@metamask/smart-accounts-kit` → `erc7715ProviderActions`, `erc7710WalletActions` |
| Wallet | RainbowKit + Wagmi + viem |
| Indexer | Envio HyperIndex (Sepolia + Base Sepolia) |
| Contracts | Foundry (SimpleVault, YieldVault, AaveWrapper) |
| Frontend | React 19 + TypeScript + Vite + Tailwind |

## Setup

```bash
# requires MetaMask Flask v13.5+ (ERC-7715 not in mainline MetaMask yet)
npm install
npm run dev

# deploy contracts (optional, already deployed)
forge script script/DeployYieldVault.s.sol --rpc-url $SEPOLIA_RPC --broadcast
forge script script/DeployAaveWrapper.s.sol --rpc-url $SEPOLIA_RPC --broadcast
```

```env
# .env.local
VITE_WALLETCONNECT_PROJECT_ID=xxx
VITE_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/xxx
VITE_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/xxx
VITE_ENVIO_ENDPOINT=https://indexer.dev.hyperindex.xyz/xxx/v1/graphql
```

## Flow

```
1. User connects MetaMask Flask (smart account enabled)
2. User configures agent: token, amount/period, duration
3. User grants ERC-7715 permission → stored locally + on-chain delegation
4. Agent executes: signs tx with permissionsContext → user's wallet pays
5. Envio indexes Deposit/Withdrawal events across chains
6. Monitor dashboard shows real-time permission health + execution history
```

## Key Files

```
src/hooks/usePermissions.ts    # ERC-7715 permission request flow
src/lib/agent.ts               # sendTransactionWithDelegation execution
src/lib/permissions.ts         # permission health scoring + analytics
src/lib/envio.ts               # GraphQL client for indexed data
src/config/chains.ts           # multi-chain contract addresses
contracts/AaveWrapper.sol      # ETH→Aave yield wrapper
indexer/config.yaml            # Envio multi-chain indexer config
```

## Links

- [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715) - Permission request spec
- [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) - Delegation execution spec  
- [MetaMask Smart Accounts Kit](https://github.com/MetaMask/smart-accounts-kit)
- [Envio HyperIndex](https://docs.envio.dev/)
- [Aave V3 Sepolia](https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses)

---

**LEASH** — Limiting Expenditure for Autonomous Spending Hierarchies
