import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSessionAccount } from "../providers/SessionAccountProvider";
import { usePermissions, type PermissionConfig, type TokenKey } from "../hooks/usePermissions";

interface AgentSetup {
  agentType: string;
  agentName: string;
  agentWallet: string;
  token: string;
  permissionType: "periodic" | "stream";
  permType: string;
  spendLimit: string;
  frequency: "hourly" | "daily" | "weekly";
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

    const isStream = setup.permissionType === "stream";
    const tokenKey = (setup.token === "ETH" || setup.token === "WETH") ? "ETH" : "USDC";
    const config: PermissionConfig = {
      token: tokenKey as TokenKey,
      amountPerPeriod: setup.spendLimit,
      periodDuration: FREQ_SECONDS[setup.frequency],
      durationDays: duration,
      permissionType: setup.permissionType,
      agentWallet: sessionAccount.address,
      ...(isStream && { amountPerSecond: setup.spendLimit }),
    };

    await requestPermission(config, sessionAccount.address);
  };

  if (!setup) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🔐</span>
        <p className="mb-4">Setup agent first</p>
        <button onClick={() => navigate("/setup")} className="text-[var(--primary)]">← Setup</button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🔐</span>
        <h1 className="text-2xl font-semibold mb-2">Grant Permission</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to approve</p>
        <ConnectButton />
      </div>
    );
  }

  if (grantedPermissions) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">✅</span>
        <h1 className="text-2xl font-semibold mb-2">Permission Granted!</h1>
        <p className="text-[var(--text-muted)] mb-2">{setup.agentName}</p>
        <p className="text-xl font-semibold text-[var(--primary)] mb-2">
          {setup.spendLimit} {setup.token} / {setup.permissionType === "stream" ? "sec" : setup.frequency.replace("ly", "")}
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Permission type: <span className="font-mono">{setup.permType}</span>
        </p>
        <button onClick={() => navigate("/monitor")} className="px-8 py-3 bg-[var(--primary)] text-white font-medium rounded-xl">
          Go to Monitor →
        </button>
      </div>
    );
  }

  const isStream = setup.permissionType === "stream";
  const maxSpend = isStream 
    ? parseFloat(setup.spendLimit) * duration * 86400 
    : parseFloat(setup.spendLimit) * (duration * 86400 / FREQ_SECONDS[setup.frequency]);

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-5xl mb-3 block">🔐</span>
          <h1 className="text-2xl font-semibold">Grant Permission</h1>
          <p className="text-[var(--text-muted)] text-sm">Review and approve spending access</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Permission Details */}
          <div className="space-y-4">
            {/* Permission Type */}
            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">ERC-7715 Permission Type</label>
              <div className={`px-4 py-3 rounded-lg font-mono text-sm ${
                isStream ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
              }`}>
                {setup.permType}
              </div>
            </div>

            {/* Agent Info */}
            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] space-y-4">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Agent</span>
                <span className="font-medium">{setup.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Spending Limit</span>
                <span className="font-medium text-[var(--primary)]">
                  {setup.spendLimit} {setup.token} / {isStream ? "sec" : setup.frequency.replace("ly", "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Agent Wallet</span>
                <span className="font-mono text-xs">{setup.agentWallet.slice(0, 8)}...{setup.agentWallet.slice(-6)}</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <div className="flex justify-between mb-3">
                <span className="text-[var(--text-muted)]">Permission Duration</span>
                <span className="font-medium">{duration} days</span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                <span>1 day</span>
                <span>1 year</span>
              </div>
            </div>
          </div>

          {/* Right - Warnings & Action */}
          <div className="space-y-4">
            {/* Max Spend Warning */}
            <div className="p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <h4 className="font-medium text-yellow-400 mb-2">⚠️ Maximum Possible Spend</h4>
              <p className="text-2xl font-bold text-yellow-400 mb-2">{maxSpend.toFixed(4)} {setup.token}</p>
              <p className="text-xs text-yellow-400/70">
                Over {duration} days at {setup.spendLimit} {setup.token}/{isStream ? "sec" : setup.frequency.replace("ly", "")}
              </p>
            </div>

            {/* MetaMask Notice */}
            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <h4 className="font-medium mb-2">🦊 MetaMask Flask Required</h4>
              <p className="text-sm text-[var(--text-muted)]">
                ERC-7715 permissions require MetaMask Flask v13.5+ with experimental features enabled.
              </p>
            </div>

            {/* What happens next */}
            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <h4 className="font-medium mb-3">What happens next?</h4>
              <ul className="text-sm text-[var(--text-muted)] space-y-2">
                <li>• MetaMask will open to approve the permission</li>
                <li>• Permission is stored on-chain (delegation framework)</li>
                <li>• Agent can execute within limits via Pimlico bundler</li>
                <li>• You can revoke anytime from Monitor page</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/setup")}
                className="px-5 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]"
                disabled={isLoading}
              >
                ← Back
              </button>
              <button
                onClick={handleGrant}
                disabled={isLoading}
                className="flex-1 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Requesting..." : "🔐 Approve Permission"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
