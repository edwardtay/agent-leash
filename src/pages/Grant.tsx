import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePermissions, type PermissionConfig, type TokenKey } from "../hooks/usePermissions";
import { AddressDisplay } from "../components/AddressDisplay";

interface AgentSetup {
  agentType: string;
  agentName: string;
  agentWallet: string;
  agentPrivateKey?: string;
  token: string;
  recipient?: string;
  execution?: {
    frequency: string;
    amount: string;
    duration: number;
    cycles: number;
    totalSpend: number;
    endDate: string;
  };
  permission?: {
    frequency: string;
    amount: string;
    duration: number;
    cycles: number;
    maxSpend: number;
    endDate: string;
    type: string;
  };
  // Legacy
  permType?: string;
  spendLimit?: string;
  frequency?: string;
  duration?: number;
}

const FREQ_SECONDS: Record<string, number> = { hourly: 3600, daily: 86400, weekly: 604800 };

export function Grant() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { requestPermission, isLoading, error, grantedPermissions, setError } = usePermissions();
  const navigate = useNavigate();

  const [setup, setSetup] = useState<AgentSetup | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("leash_agent_setup");
    if (stored) setSetup(JSON.parse(stored));
  }, []);

  const handleGrant = async () => {
    if (!setup) return;

    const perm = setup.permission;
    const tokenKey = (setup.token === "ETH" || setup.token === "WETH") ? "ETH" : "USDC";
    
    // Use the agent wallet from setup, NOT sessionAccount
    const agentWalletAddress = setup.agentWallet as `0x${string}`;
    
    const config: PermissionConfig = {
      token: tokenKey as TokenKey,
      amountPerPeriod: perm?.amount || setup.spendLimit || "0.01",
      periodDuration: FREQ_SECONDS[perm?.frequency || setup.frequency || "daily"],
      durationDays: perm?.duration || setup.duration || 30,
      permissionType: "periodic",
      agentWallet: agentWalletAddress,
    };

    await requestPermission(config, agentWalletAddress);
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

  const exec = setup.execution;
  const perm = setup.permission;

  if (grantedPermissions) {
    // Save to agents list (support multiple agents)
    const agents = JSON.parse(localStorage.getItem("leash_agents") || "[]");
    const existingIdx = agents.findIndex((a: any) => a.agentWallet === setup.agentWallet);
    if (existingIdx >= 0) {
      agents[existingIdx] = setup;
    } else {
      agents.push(setup);
    }
    localStorage.setItem("leash_agents", JSON.stringify(agents));

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">✅</span>
        <h1 className="text-2xl font-semibold mb-2">Permission Granted!</h1>
        <p className="text-[var(--text-muted)] mb-2">{setup.agentName}</p>
        <p className="text-xl font-semibold text-[var(--primary)] mb-2">
          {perm?.amount || setup.spendLimit} {setup.token} / {perm?.frequency || setup.frequency}
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {perm?.cycles} periods • Expires {perm?.endDate ? new Date(perm.endDate).toLocaleDateString() : ""}
        </p>
        <button onClick={() => navigate("/monitor")} className="px-8 py-3 bg-[var(--primary)] text-white font-medium rounded-xl">
          Go to Monitor →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-5xl mb-3 block">🔐</span>
          <h1 className="text-2xl font-semibold">Grant Permission</h1>
          <p className="text-[var(--text-muted)] text-sm">Review execution schedule and permission grant</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
          </div>
        )}

        {/* Agent Info */}
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] mb-6 flex items-center gap-4">
          <span className="text-3xl">🤖</span>
          <div className="flex-1">
            <h3 className="font-semibold">{setup.agentName}</h3>
            <p className="text-sm text-[var(--text-muted)]">Token: {setup.token}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-1">Agent Wallet</p>
            <AddressDisplay address={setup.agentWallet} chainId={chainId} />
          </div>
        </div>

        {/* Chain Indicator */}
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          chainId === 11155111 
            ? "bg-blue-500/10 border-blue-500/30" 
            : "bg-purple-500/10 border-purple-500/30"
        }`}>
          <img 
            src={chainId === 11155111 
              ? "https://cryptologos.cc/logos/ethereum-eth-logo.svg"
              : "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg"
            } 
            alt="chain" 
            className="w-6 h-6" 
          />
          <div>
            <p className={`text-sm font-medium ${chainId === 11155111 ? "text-blue-400" : "text-purple-400"}`}>
              Permission will be granted on {chainId === 11155111 ? "Ethereum Sepolia" : "Base Sepolia"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Switch network in wallet header if needed before approving
            </p>
          </div>
        </div>

        {/* Two Schedules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Execution Schedule */}
          <div className="p-5 bg-blue-500/5 border border-blue-500/30 rounded-xl">
            <h3 className="font-semibold text-blue-400 mb-4">🤖 Agent Execution</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Frequency</span>
                <span className="font-medium">{exec?.frequency || "daily"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Amount per Exec</span>
                <span className="font-medium">{exec?.amount || "0.001"} {setup.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Executions</span>
                <span className="font-semibold text-blue-400">{exec?.cycles || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Spend</span>
                <span className="font-semibold">{exec?.totalSpend?.toFixed(4) || "—"} {setup.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Runs Until</span>
                <span>{exec?.endDate ? new Date(exec.endDate).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </div>

          {/* Permission Grant */}
          <div className="p-5 bg-green-500/5 border border-green-500/30 rounded-xl">
            <h3 className="font-semibold text-green-400 mb-4">🔐 Permission Grant</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Period</span>
                <span className="font-medium">{perm?.frequency || setup.frequency || "daily"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Max per Period</span>
                <span className="font-medium text-green-400">{perm?.amount || setup.spendLimit} {setup.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Periods</span>
                <span className="font-semibold text-green-400">{perm?.cycles || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Max Possible</span>
                <span className="font-semibold">{perm?.maxSpend?.toFixed(4) || "—"} {setup.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Expires</span>
                <span>{perm?.endDate ? new Date(perm.endDate).toLocaleDateString() : "—"}</span>
              </div>
            </div>
            <div className="mt-3 px-3 py-2 rounded-lg font-mono text-xs bg-green-500/20 text-green-400">
              {perm?.type || setup.permType}
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="space-y-3 mb-6">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400">
              ⚠️ Max possible spend: <strong>{perm?.maxSpend?.toFixed(4) || "—"} {setup.token}</strong> over {perm?.duration || setup.duration} days
            </p>
          </div>
          
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)]">
              🦊 Requires MetaMask Flask v13.5+ with ERC-7715 support
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/setup/" + setup.agentType)}
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
  );
}
