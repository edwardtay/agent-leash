import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSessionAccount } from "../providers/SessionAccountProvider";
import { usePermissions, type PermissionConfig } from "../hooks/usePermissions";

interface AgentSetup {
  agentType: string;
  agentName: string;
  agentWallet: string;
  spendLimit: string;
  frequency: "hourly" | "daily" | "weekly";
  permissionType: "periodic" | "stream";
  token: "ETH" | "USDC";
}

const FREQ_SECONDS = { hourly: 3600, daily: 86400, weekly: 604800 };

export function Grant() {
  const { isConnected } = useAccount();
  const { sessionAccount } = useSessionAccount();
  const { requestPermission, isLoading, error, grantedPermissions, setError } = usePermissions();
  const navigate = useNavigate();

  const [setup, setSetup] = useState<AgentSetup | null>(null);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const stored = localStorage.getItem("leash_agent_setup");
    if (stored) setSetup(JSON.parse(stored));
  }, []);

  const handleGrant = async () => {
    if (!sessionAccount || !setup) return;

    const config: PermissionConfig = {
      token: setup.token,
      amountPerPeriod: setup.spendLimit,
      periodDuration: FREQ_SECONDS[setup.frequency],
      durationDays: duration,
      permissionType: setup.permissionType,
      agentWallet: sessionAccount.address,
      ...(setup.permissionType === "stream" && { amountPerSecond: setup.spendLimit }),
    };

    await requestPermission(config, sessionAccount.address);
  };

  if (!setup) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">🔐</span>
        <p className="text-sm mb-4">Setup agent first</p>
        <button onClick={() => navigate("/setup")} className="text-[var(--primary)] text-sm">← Setup</button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">🔐</span>
        <h1 className="text-xl font-semibold mb-2">Grant Permission</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to approve</p>
        <ConnectButton />
      </div>
    );
  }

  if (grantedPermissions) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">✅</span>
        <h1 className="text-xl font-semibold mb-2">Permission Granted</h1>
        <p className="text-sm text-[var(--text-muted)] mb-1">{setup.agentName}</p>
        <p className="text-lg font-semibold text-[var(--primary)] mb-6">
          {setup.spendLimit} {setup.token} / {setup.permissionType === "stream" ? "sec" : setup.frequency.replace("ly", "")}
        </p>
        <button onClick={() => navigate("/monitor")} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg">
          Monitor →
        </button>
      </div>
    );
  }

  const permType = setup.token === "ETH" 
    ? (setup.permissionType === "stream" ? "native-token-stream" : "native-token-periodic")
    : (setup.permissionType === "stream" ? "erc20-token-stream" : "erc20-token-periodic");

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="text-center mb-6">
        <span className="text-4xl mb-2 block">🔐</span>
        <h1 className="text-xl font-semibold">Grant Permission</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">×</button>
        </div>
      )}

      <div className="space-y-3">
        {/* Permission Type Badge */}
        <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">ERC-7715 Type</span>
          <span className="text-xs font-mono bg-[var(--primary)]/20 text-[var(--primary)] px-2 py-1 rounded">{permType}</span>
        </div>

        {/* Summary */}
        <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Agent</span>
            <span>{setup.agentName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Limit</span>
            <span className="text-[var(--primary)] font-medium">
              {setup.spendLimit} {setup.token} / {setup.permissionType === "stream" ? "sec" : setup.frequency.replace("ly", "")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Wallet</span>
            <span className="font-mono text-xs">{setup.agentWallet.slice(0, 6)}...{setup.agentWallet.slice(-4)}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-muted)]">Duration</span>
            <span>{duration} days</span>
          </div>
          <input
            type="range"
            min="1"
            max="365"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Requires MetaMask Flask with ERC-7715 support
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate("/setup")}
            className="px-4 py-2.5 bg-[var(--bg-card)] text-sm rounded-lg border border-[var(--border)]"
            disabled={isLoading}
          >
            ←
          </button>
          <button
            onClick={handleGrant}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Requesting..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
