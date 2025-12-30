import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSessionAccount } from "../providers/SessionAccountProvider";

type AgentType = "dca" | "sniper" | "subscription" | "yield";
type PermType = "native-token-periodic" | "native-token-stream" | "erc20-token-periodic" | "erc20-token-stream";

const TOKENS = {
  ETH: { symbol: "ETH", name: "Ethereum", isNative: true },
  USDC: { symbol: "USDC", name: "USD Coin", isNative: false },
  USDT: { symbol: "USDT", name: "Tether", isNative: false },
  WETH: { symbol: "WETH", name: "Wrapped ETH", isNative: false },
  DAI: { symbol: "DAI", name: "Dai", isNative: false },
};

const AGENT_CONFIG: Record<AgentType, {
  name: string;
  icon: string;
  desc: string;
  tokens: (keyof typeof TOKENS)[];
  permTypes: PermType[];
  defaultPerm: PermType;
  isStream: boolean;
}> = {
  dca: {
    name: "DCA Bot",
    icon: "📈",
    desc: "Automatically buy tokens at regular intervals",
    tokens: ["ETH", "USDC", "WETH"],
    permTypes: ["native-token-periodic", "erc20-token-periodic"],
    defaultPerm: "native-token-periodic",
    isStream: false,
  },
  sniper: {
    name: "Price Sniper",
    icon: "🎯",
    desc: "Execute trades when price conditions are met",
    tokens: ["USDC", "USDT", "DAI"],
    permTypes: ["erc20-token-periodic"],
    defaultPerm: "erc20-token-periodic",
    isStream: false,
  },
  subscription: {
    name: "Subscriptions",
    icon: "💸",
    desc: "Stream payments to services automatically",
    tokens: ["ETH", "USDC"],
    permTypes: ["native-token-stream", "erc20-token-stream"],
    defaultPerm: "native-token-stream",
    isStream: true,
  },
  yield: {
    name: "Yield Optimizer",
    icon: "🌾",
    desc: "Auto-compound and manage DeFi positions",
    tokens: ["USDC", "WETH", "DAI"],
    permTypes: ["erc20-token-periodic", "erc20-token-stream"],
    defaultPerm: "erc20-token-periodic",
    isStream: false,
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
  const [selectedPerm, setSelectedPerm] = useState<PermType>("native-token-periodic");
  const [amount, setAmount] = useState("0.01");
  const [frequency, setFrequency] = useState<"hourly" | "daily" | "weekly">("daily");

  useEffect(() => {
    if (config) {
      setAgentName(config.name);
      setSelectedToken(config.tokens[0]);
      setSelectedPerm(config.defaultPerm);
    }
  }, [agentType]);

  // Update permission type based on token selection
  useEffect(() => {
    if (!config) return;
    const tokenInfo = TOKENS[selectedToken];
    const isStream = config.isStream;
    
    if (tokenInfo.isNative) {
      setSelectedPerm(isStream ? "native-token-stream" : "native-token-periodic");
    } else {
      setSelectedPerm(isStream ? "erc20-token-stream" : "erc20-token-periodic");
    }
  }, [selectedToken, config]);

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
    localStorage.setItem("leash_agent_setup", JSON.stringify({
      agentType,
      agentName,
      agentWallet: sessionAccount.address,
      token: selectedToken,
      permissionType: selectedPerm.includes("stream") ? "stream" : "periodic",
      permType: selectedPerm,
      spendLimit: amount,
      frequency,
      createdAt: Date.now(),
    }));
    navigate("/grant");
  };

  const isStream = selectedPerm.includes("stream");

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
              <label className="block text-xs text-[var(--text-muted)] mb-2">Token to Spend</label>
              <div className="grid grid-cols-3 gap-2">
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
              <label className="block text-xs text-[var(--text-muted)] mb-2">
                {isStream ? "Amount per second" : "Amount per period"}
              </label>
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

            {/* Frequency (only for periodic) */}
            {!isStream && (
              <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                <label className="block text-xs text-[var(--text-muted)] mb-2">Period Duration</label>
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
            )}
          </div>

          {/* Right Column - Summary & Info */}
          <div className="space-y-4">
            {/* Permission Type (auto-determined) */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">ERC-7715 Permission Type</label>
              <div className={`px-4 py-3 rounded-lg font-mono text-sm ${
                isStream ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
              }`}>
                {selectedPerm}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                {isStream 
                  ? "Tokens accrue continuously at the specified rate"
                  : "Allowance resets at the start of each period"
                }
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
                  This wallet will execute transactions on your behalf
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl">
              <h4 className="font-medium mb-2">Permission Summary</h4>
              <p className="text-sm">
                Agent <span className="font-semibold">{agentName}</span> can spend up to{" "}
                <span className="font-semibold text-[var(--primary)]">{amount} {selectedToken}</span>
                {isStream ? " per second (streaming)" : ` per ${frequency.replace("ly", "")}`}
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!isReady || !agentName}
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
