import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSessionAccount } from "../providers/SessionAccountProvider";

type AgentType = "dca" | "transfer" | "gas" | "vault";

const TOKENS = {
  ETH: { symbol: "ETH", name: "Ethereum", isNative: true },
  USDC: { symbol: "USDC", name: "USD Coin", isNative: false },
};

const AGENT_CONFIG: Record<AgentType, {
  name: string;
  icon: string;
  desc: string;
  tokens: (keyof typeof TOKENS)[];
  needsRecipient: boolean;
  recipientLabel: string;
  recipientPlaceholder: string;
}> = {
  dca: {
    name: "DCA Bot",
    icon: "📈",
    desc: "Dollar-cost average into tokens on a schedule",
    tokens: ["ETH", "USDC"],
    needsRecipient: false,
    recipientLabel: "",
    recipientPlaceholder: "",
  },
  transfer: {
    name: "Auto-Transfer",
    icon: "💸",
    desc: "Send tokens to an address on schedule",
    tokens: ["ETH", "USDC"],
    needsRecipient: true,
    recipientLabel: "Recipient Address",
    recipientPlaceholder: "0x... (where to send)",
  },
  gas: {
    name: "Gas Refiller",
    icon: "⛽",
    desc: "Top up a wallet when ETH balance is low",
    tokens: ["ETH"],
    needsRecipient: true,
    recipientLabel: "Wallet to Refill",
    recipientPlaceholder: "0x... (bot wallet to top up)",
  },
  vault: {
    name: "Savings Vault",
    icon: "🏦",
    desc: "Auto-deposit to a vault contract",
    tokens: ["ETH", "USDC"],
    needsRecipient: true,
    recipientLabel: "Vault Contract",
    recipientPlaceholder: "0x... (vault address)",
  },
};

export function SetupAgent() {
  const { agentType } = useParams<{ agentType: string }>();
  const { isConnected } = useAccount();
  const { sessionAccount, isReady } = useSessionAccount();
  const navigate = useNavigate();

  const config = AGENT_CONFIG[agentType as AgentType];

  const [agentName, setAgentName] = useState("");
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>("ETH");
  const [amount, setAmount] = useState("0.001");
  const [frequency, setFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    if (config) {
      setAgentName(config.name);
      setSelectedToken(config.tokens[0]);
    }
  }, [agentType]);

  // Determine permission type based on token
  const permType = TOKENS[selectedToken].isNative ? "native-token-periodic" : "erc20-token-periodic";

  if (!config) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">❓</span>
        <p className="mb-4">Agent not found</p>
        <Link to="/setup" className="text-[var(--primary)]">← Back</Link>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">{config.icon}</span>
        <h1 className="text-2xl font-semibold mb-2">{config.name}</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  const handleContinue = () => {
    if (!sessionAccount) return;
    if (config.needsRecipient && !recipient) {
      alert("Please enter recipient address");
      return;
    }
    
    localStorage.setItem("leash_agent_setup", JSON.stringify({
      agentType,
      agentName,
      agentWallet: sessionAccount.address,
      token: selectedToken,
      permissionType: "periodic",
      permType,
      spendLimit: amount,
      frequency,
      recipient: recipient || null,
      createdAt: Date.now(),
    }));
    navigate("/grant");
  };

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/setup" className="text-[var(--text-muted)] hover:text-white text-xl">←</Link>
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-xl font-semibold">{config.name}</h1>
            <p className="text-sm text-[var(--text-muted)]">{config.desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-4">
            {/* Agent Name */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">Agent Name</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] outline-none"
              />
            </div>

            {/* Token Selection */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">Token</label>
              <div className="grid grid-cols-2 gap-2">
                {config.tokens.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedToken(t)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedToken === t
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-dark)] text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">Amount per period</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono"
                />
                <span className="px-4 py-2.5 bg-[var(--bg-dark)] rounded-lg text-[var(--text-muted)]">
                  {selectedToken}
                </span>
              </div>
            </div>

            {/* Frequency */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {(["hourly", "daily", "weekly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      frequency === f
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-dark)] text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient (if needed) */}
            {config.needsRecipient && (
              <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                <label className="block text-xs text-[var(--text-muted)] mb-2">{config.recipientLabel}</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={config.recipientPlaceholder}
                  className="w-full px-3 py-2.5 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono text-sm focus:border-[var(--primary)] outline-none"
                />
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-4">
            {/* Permission Type */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">ERC-7715 Permission Type</label>
              <div className="px-4 py-3 rounded-lg font-mono text-sm bg-green-500/20 text-green-400">
                {permType}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Allowance resets at the start of each period
              </p>
            </div>

            {/* Agent Wallet */}
            {isReady && sessionAccount && (
              <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                <label className="block text-xs text-[var(--text-muted)] mb-2">Agent Wallet (EOA)</label>
                <p className="font-mono text-sm break-all bg-[var(--bg-dark)] p-3 rounded-lg">
                  {sessionAccount.address}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Fund this wallet with Sepolia ETH to execute transactions
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl">
              <h4 className="font-medium mb-2">Permission Summary</h4>
              <p className="text-sm">
                Agent <span className="font-semibold">{agentName}</span> can spend up to{" "}
                <span className="font-semibold text-[var(--primary)]">{amount} {selectedToken}</span>
                {" "}per {frequency.replace("ly", "")}
              </p>
              {config.needsRecipient && recipient && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Sending to: {recipient.slice(0, 10)}...{recipient.slice(-8)}
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!isReady || !agentName || (config.needsRecipient && !recipient)}
              className="w-full py-3.5 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              Continue to Grant Permission →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
