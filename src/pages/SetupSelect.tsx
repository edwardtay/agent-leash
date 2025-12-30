import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Realistic agents that can actually work on Sepolia
const AGENTS = [
  {
    id: "dca",
    name: "DCA Bot",
    icon: "📈",
    desc: "Auto-buy tokens on a schedule (daily, weekly)",
    permTypes: ["native-token-periodic", "erc20-token-periodic"],
    tokens: ["ETH", "USDC"],
    example: "Swap 0.01 ETH to USDC every day",
    canDemo: true,
  },
  {
    id: "transfer",
    name: "Auto-Transfer",
    icon: "💸",
    desc: "Send tokens to an address on schedule",
    permTypes: ["native-token-periodic", "erc20-token-periodic"],
    tokens: ["ETH", "USDC"],
    example: "Send 0.005 ETH to savings wallet daily",
    canDemo: true,
  },
  {
    id: "gas",
    name: "Gas Refiller",
    icon: "⛽",
    desc: "Top up a wallet when ETH balance is low",
    permTypes: ["native-token-periodic"],
    tokens: ["ETH"],
    example: "Refill bot wallet with 0.01 ETH when < 0.005",
    canDemo: true,
  },
  {
    id: "vault",
    name: "Savings Vault",
    icon: "🏦",
    desc: "Auto-deposit to a vault contract",
    permTypes: ["native-token-periodic", "erc20-token-periodic"],
    tokens: ["ETH", "USDC"],
    example: "Deposit 0.01 ETH to vault weekly",
    canDemo: true,
  },
];

export function SetupSelect() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">🤖</span>
        <h1 className="text-2xl font-semibold mb-2">Setup Your Agent</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to start</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Choose Your Agent</h1>
          <p className="text-[var(--text-muted)] text-sm">Each agent type uses specific ERC-7715 permission types</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent) => (
            <Link
              key={agent.id}
              to={`/setup/${agent.id}`}
              className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{agent.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg group-hover:text-[var(--primary)]">{agent.name}</h3>
                    {agent.canDemo && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Works on Sepolia</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{agent.desc}</p>
                  
                  {/* Permission types */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {agent.permTypes.map((pt) => (
                      <span key={pt} className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        pt.includes("stream") ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                      }`}>
                        {pt}
                      </span>
                    ))}
                  </div>

                  {/* Tokens */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[var(--text-muted)]">Tokens:</span>
                    {agent.tokens.map((t) => (
                      <span key={t} className="text-xs bg-[var(--bg-dark)] px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>

                  <p className="text-xs text-[var(--primary)] mt-3 opacity-70">e.g. {agent.example}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-8 p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold mb-3">How Agents Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">1️⃣</span>
              <div>
                <p className="font-medium">You grant permission</p>
                <p className="text-[var(--text-muted)] text-xs">ERC-7715 limits what agent can spend</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">2️⃣</span>
              <div>
                <p className="font-medium">Agent monitors conditions</p>
                <p className="text-[var(--text-muted)] text-xs">Time-based triggers (schedule)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">3️⃣</span>
              <div>
                <p className="font-medium">Agent executes within limits</p>
                <p className="text-[var(--text-muted)] text-xs">Transactions indexed by Envio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Networks */}
        <div className="mt-4 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">
            <span className="text-[var(--primary)]">Networks:</span> Sepolia (testnet) • Base Sepolia (testnet) — 
            Transactions indexed by Envio HyperIndex across both chains
          </p>
        </div>
      </div>
    </div>
  );
}
