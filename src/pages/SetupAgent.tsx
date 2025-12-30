import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSessionAccount } from "../providers/SessionAccountProvider";

type AgentType = "dca" | "sniper" | "payment" | "yield";

const AGENT_CONFIG: Record<AgentType, {
  name: string;
  icon: string;
  permType: string;
  isStream: boolean;
  token: "ETH" | "USDC";
}> = {
  dca: { name: "DCA Bot", icon: "📈", permType: "native-token-periodic", isStream: false, token: "ETH" },
  sniper: { name: "Sniper", icon: "🎯", permType: "erc20-token-periodic", isStream: false, token: "USDC" },
  payment: { name: "Payments", icon: "💸", permType: "native-token-stream", isStream: true, token: "ETH" },
  yield: { name: "Yield", icon: "🌾", permType: "erc20-token-stream", isStream: true, token: "USDC" },
};

export function SetupAgent() {
  const { agentType } = useParams<{ agentType: string }>();
  const { isConnected } = useAccount();
  const { sessionAccount, isReady } = useSessionAccount();
  const navigate = useNavigate();

  const [agentName, setAgentName] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [frequency, setFrequency] = useState<"hourly" | "daily" | "weekly">("daily");

  const config = AGENT_CONFIG[agentType as AgentType];

  useEffect(() => {
    if (config) setAgentName(config.name);
  }, [agentType]);

  if (!config) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">❓</span>
        <p className="text-sm mb-4">Agent not found</p>
        <Link to="/setup" className="text-[var(--primary)] text-sm">← Back</Link>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">{config.icon}</span>
        <h1 className="text-xl font-semibold mb-2">{config.name}</h1>
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
      spendLimit: amount,
      frequency,
      permissionType: config.isStream ? "stream" : "periodic",
      token: config.token,
      createdAt: Date.now(),
    }));
    navigate("/grant");
  };

  return (
    <div className="max-w-md mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/setup" className="text-[var(--text-muted)] hover:text-white">←</Link>
        <span className="text-3xl">{config.icon}</span>
        <div>
          <h1 className="text-lg font-semibold">{config.name}</h1>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{config.permType}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <label className="block text-xs text-[var(--text-muted)] mb-1">Agent Name</label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg text-sm focus:border-[var(--primary)] outline-none"
          />
        </div>

        {/* Amount */}
        <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <label className="block text-xs text-[var(--text-muted)] mb-1">
            {config.isStream ? "Amount per second" : "Amount per period"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono text-sm"
            />
            <span className="px-3 py-2 bg-[var(--bg-dark)] rounded-lg text-[var(--text-muted)] text-sm">
              {config.token}
            </span>
          </div>
        </div>

        {/* Frequency (only for periodic) */}
        {!config.isStream && (
          <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
            <label className="block text-xs text-[var(--text-muted)] mb-2">Period</label>
            <div className="grid grid-cols-3 gap-2">
              {(["hourly", "daily", "weekly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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

        {/* Agent Wallet */}
        {isReady && sessionAccount && (
          <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] mb-1">Agent Wallet</p>
            <p className="font-mono text-xs truncate">{sessionAccount.address}</p>
          </div>
        )}

        {/* Summary */}
        <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg">
          <p className="text-xs">
            Agent can spend <span className="font-semibold">{amount} {config.token}</span>
            {config.isStream ? " per second (streaming)" : ` per ${frequency.replace("ly", "")}`}
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={!isReady || !agentName}
          className="w-full py-3 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
