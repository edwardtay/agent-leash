import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { encodeFunctionData } from "viem";
import {
  getPermissionsWithHealth,
  revokePermissionLocal,
  getPermissionDelegation,
  formatTimeRemaining,
  getAgentExecutions,
  getPermissionAlerts,
  type PermissionWithHealth,
} from "../lib/permissions";
import { 
  executeVaultDeposit,
  getUserSmartAccountBalance
} from "../lib/agent";
import { checkEnvioHealth, getVaultDeposits, type VaultDeposit } from "../lib/envio";
import { AddressDisplay } from "../components/AddressDisplay";
import { Toast, useToast } from "../components/Toast";
import { getVaultAddress } from "../config/contracts";

// Agent type icons
const AGENT_ICONS: Record<string, string> = {
  dca: "📈",
  transfer: "💸",
  gas: "⛽",
  vault: "🏦",
};

interface AgentSetup {
  agentType: string;
  agentName: string;
  agentWallet: string;
  agentPrivateKey?: string;
  token: string;
  recipient?: string;
  permission?: {
    frequency: string;
    amount: string;
    endDate: string;
    type: string;
  };
}

export function Monitor() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  
  const [agents, setAgents] = useState<AgentSetup[]>([]);
  const [permissions, setPermissions] = useState<PermissionWithHealth[]>([]);
  const [userBalance, setUserBalance] = useState({ eth: "0", usdc: "0" });
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [envioStatus, setEnvioStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showExportKey, setShowExportKey] = useState<string | null>(null);
  const [indexedDeposits, setIndexedDeposits] = useState<VaultDeposit[]>([]);
  const [executionCounts, setExecutionCounts] = useState<Record<string, number>>({});
  const [permissionAlerts, setPermissionAlerts] = useState<{ type: "expiring" | "overused"; permission: PermissionWithHealth }[]>([]);
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState<Record<string, boolean>>({});
  const { address: userAddress } = useAccount();

  // Calculate stats from indexed deposits
  const totalDeposited = indexedDeposits.reduce((sum, d) => sum + Number(d.amount) / 1e18, 0);
  const uniqueChains = new Set(indexedDeposits.map(d => d.chainId)).size;

  // Delete agent handler
  const handleDeleteAgent = (agentWallet: string) => {
    if (!confirm("Delete this agent?")) return;
    const updated = agents.filter(a => a.agentWallet !== agentWallet);
    setAgents(updated);
    localStorage.setItem("leash_agents", JSON.stringify(updated));
    addToast("info", "Agent deleted");
  };

  // Revoke permission handler - calls disableDelegation on DelegationManager
  const handleRevokePermission = async (permissionId: string, originalIndex: number) => {
    if (!walletClient || !userAddress) {
      addToast("error", "Wallet not connected");
      return;
    }

    setIsRevoking(permissionId);
    
    try {
      // Get the delegation data from stored permission
      const delegation = getPermissionDelegation(originalIndex);
      console.log("Delegation data for revoke:", delegation);
      
      if (!delegation || !delegation[0]) {
        revokePermissionLocal(originalIndex);
        setPermissions(getPermissionsWithHealth());
        addToast("info", "Permission marked as revoked (no on-chain data)");
        return;
      }

      const permissionData = delegation[0];
      const signerMeta = permissionData.signerMeta;
      const permissionsContext = permissionData.permissionsContext;
      
      console.log("signerMeta:", signerMeta);
      console.log("permissionsContext:", permissionsContext);

      if (!signerMeta?.delegationManager || !permissionsContext) {
        revokePermissionLocal(originalIndex);
        setPermissions(getPermissionsWithHealth());
        addToast("info", "Permission marked as revoked (no delegation manager)");
        return;
      }

      // Decode the delegation from permissionsContext
      const { decodeDelegations } = await import("@metamask/smart-accounts-kit/utils");
      const { DelegationManager } = await import("@metamask/delegation-abis");
      
      let delegations;
      try {
        delegations = decodeDelegations(permissionsContext as `0x${string}`);
        console.log("Decoded delegations:", delegations);
      } catch (decodeErr) {
        console.error("Failed to decode delegations:", decodeErr);
        revokePermissionLocal(originalIndex);
        setPermissions(getPermissionsWithHealth());
        addToast("info", "Permission marked as revoked (decode failed)");
        return;
      }
      
      if (!delegations || delegations.length === 0) {
        revokePermissionLocal(originalIndex);
        setPermissions(getPermissionsWithHealth());
        addToast("info", "Permission marked as revoked (empty delegation)");
        return;
      }

      // Get the first delegation and convert salt to bigint for ABI compatibility
      const rawDelegation = delegations[0];
      const delegationToDisable = {
        delegate: rawDelegation.delegate,
        delegator: rawDelegation.delegator,
        authority: rawDelegation.authority,
        caveats: rawDelegation.caveats,
        salt: BigInt(rawDelegation.salt),
        signature: rawDelegation.signature,
      };
      
      console.log("Delegation to disable:", delegationToDisable);
      
      // Encode the disableDelegation call
      const disableCalldata = encodeFunctionData({
        abi: DelegationManager.abi,
        functionName: "disableDelegation",
        args: [delegationToDisable],
      });

      // Send transaction to disable the delegation
      addToast("info", "Confirm in wallet to revoke on-chain...");
      
      const hash = await walletClient.sendTransaction({
        to: signerMeta.delegationManager as `0x${string}`,
        data: disableCalldata,
      });

      addToast("success", `Revoked on-chain! Tx: ${hash.slice(0, 10)}...`);
      
      // Mark as revoked locally too
      revokePermissionLocal(originalIndex);
      setPermissions(getPermissionsWithHealth());
      
    } catch (error: any) {
      console.error("Revoke error:", error);
      
      if (error.message?.includes("rejected") || error.message?.includes("denied")) {
        addToast("error", "Transaction rejected");
      } else {
        // Fall back to local revoke
        revokePermissionLocal(originalIndex);
        setPermissions(getPermissionsWithHealth());
        addToast("info", "Permission marked as revoked locally");
      }
    } finally {
      setIsRevoking(null);
    }
  };

  useEffect(() => {
    // Load agents
    const storedAgents = JSON.parse(localStorage.getItem("leash_agents") || "[]");
    const legacyAgent = localStorage.getItem("leash_agent_setup");
    
    if (legacyAgent) {
      const legacy = JSON.parse(legacyAgent);
      const exists = storedAgents.find((a: AgentSetup) => a.agentWallet === legacy.agentWallet);
      if (!exists) {
        storedAgents.push(legacy);
        localStorage.setItem("leash_agents", JSON.stringify(storedAgents));
      }
    }
    
    setAgents(storedAgents);
    
    // Count executions per agent (using agent-specific filter)
    const counts: Record<string, number> = {};
    storedAgents.forEach((agent: AgentSetup) => {
      const agentExecs = getAgentExecutions(agent.agentWallet);
      counts[agent.agentWallet] = agentExecs.length;
    });
    setExecutionCounts(counts);
    
    // Load auto-execute settings
    const autoExec = JSON.parse(localStorage.getItem("leash_auto_execute") || "{}");
    setAutoExecuteEnabled(autoExec);
    
    // Fetch user's wallet balance (where funds come from)
    if (userAddress) {
      getUserSmartAccountBalance(userAddress as `0x${string}`, chainId).then(setUserBalance);
    }

    setPermissions(getPermissionsWithHealth());
    setPermissionAlerts(getPermissionAlerts());
    
    checkEnvioHealth().then(ok => {
      setEnvioStatus(ok ? "online" : "offline");
      if (ok) getVaultDeposits(10).then(setIndexedDeposits);
    });
  }, [userAddress]);

  // Refresh balance when chain changes
  useEffect(() => {
    if (userAddress && chainId) {
      console.log("Fetching balance for chain:", chainId);
      getUserSmartAccountBalance(userAddress as `0x${string}`, chainId).then(balance => {
        console.log("Balance:", balance);
        setUserBalance(balance);
      });
    }
  }, [userAddress, chainId]);

  // Auto-refresh deposits every 3 seconds when Envio is online
  useEffect(() => {
    if (envioStatus !== "online") return;
    
    const interval = setInterval(() => {
      getVaultDeposits(10).then(setIndexedDeposits);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [envioStatus]);

  // Auto-execute scheduler (client-side, runs when app is open)
  useEffect(() => {
    const enabledAgents = agents.filter(a => autoExecuteEnabled[a.agentWallet]);
    if (enabledAgents.length === 0) return;

    const checkAndExecute = async () => {
      for (const agent of enabledAgents) {
        if (isExecuting) continue; // Skip if already executing
        
        // Check if it's time to execute based on frequency
        const freqSeconds: Record<string, number> = { hourly: 3600, daily: 86400, weekly: 604800 };
        const freq = agent.permission?.frequency || "daily";
        const periodSec = freqSeconds[freq] || 86400;
        
        // Get last execution for this agent
        const agentExecs = getAgentExecutions(agent.agentWallet);
        const lastExec = agentExecs.length > 0 
          ? Math.max(...agentExecs.map(e => e.timestamp))
          : 0;
        
        const timeSinceLastExec = (Date.now() - lastExec) / 1000;
        
        // Execute if enough time has passed since last execution
        if (timeSinceLastExec >= periodSec) {
          console.log(`Auto-executing for ${agent.agentName}...`);
          await handleExecute(agent);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkAndExecute, 60000);
    // Also check immediately on mount
    checkAndExecute();
    
    return () => clearInterval(interval);
  }, [agents, autoExecuteEnabled, isExecuting]);

  // Toggle auto-execute for an agent
  const toggleAutoExecute = (agentWallet: string) => {
    const newState = { ...autoExecuteEnabled, [agentWallet]: !autoExecuteEnabled[agentWallet] };
    setAutoExecuteEnabled(newState);
    localStorage.setItem("leash_auto_execute", JSON.stringify(newState));
    addToast("info", newState[agentWallet] ? "Auto-execute enabled" : "Auto-execute disabled");
  };

  // Handle extend permission - navigate to grant with pre-filled data
  const handleExtendPermission = (agent: AgentSetup) => {
    // Store agent setup for grant page
    localStorage.setItem("leash_agent_setup", JSON.stringify(agent));
    navigate("/grant");
  };

  const handleExecute = async (agent: AgentSetup) => {
    const privateKey = agent.agentPrivateKey as `0x${string}`;
    if (!privateKey) {
      addToast("error", "Agent private key not found");
      return;
    }

    setIsExecuting(agent.agentWallet);
    try {
      const vaultAddress = agent.recipient || getVaultAddress(chainId) || "0x000000000000000000000000000000000000dEaD";
      const result = await executeVaultDeposit(privateKey, vaultAddress as `0x${string}`, "0.0001", agent.agentWallet);
      setLastExecution({ ...result, agentWallet: agent.agentWallet });
      
      // Update execution count
      setExecutionCounts(prev => ({
        ...prev,
        [agent.agentWallet]: (prev[agent.agentWallet] || 0) + 1
      }));
      
      if (result.success) {
        addToast("success", `Deposited 0.0001 ETH to vault`);
        // Refresh user balance (funds come from user's account)
        if (userAddress) {
          getUserSmartAccountBalance(userAddress as `0x${string}`, chainId).then(setUserBalance);
        }
        // Refresh permissions to update utilization
        setPermissions(getPermissionsWithHealth());
        setTimeout(() => getVaultDeposits(10).then(setIndexedDeposits), 3000);
      } else {
        addToast("error", result.error || "Execution failed");
      }
    } catch (error: any) {
      addToast("error", error.message || "Execution failed");
      console.error("Execution error:", error);
    } finally {
      setIsExecuting(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">📊</span>
        <h1 className="text-2xl font-semibold mb-2">Monitor</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to view</p>
        <ConnectButton />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">📊</span>
        <h1 className="text-2xl font-semibold mb-2">No Agents</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Setup an agent to get started</p>
        <button onClick={() => navigate("/setup")} className="px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl">
          Setup Agent →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                envioStatus === "online" ? "bg-green-500/20 text-green-400" : "bg-[var(--bg-dark)] text-[var(--text-muted)]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${envioStatus === "online" ? "bg-green-400" : "bg-gray-500"}`} />
              Envio {envioStatus}
            </div>
            <button onClick={() => navigate("/setup")} className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs rounded-lg">
              + New Agent
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {envioStatus === "online" && indexedDeposits.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-[var(--primary)]">{totalDeposited.toFixed(4)}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Total ETH Deposited</p>
            </div>
            <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-purple-400">{indexedDeposits.length}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Transactions Indexed</p>
            </div>
            <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] text-center">
              <p className="text-2xl font-bold text-blue-400">{uniqueChains}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Chains Active</p>
            </div>
          </div>
        )}

        {/* Permission Alerts Banner */}
        {permissionAlerts.length > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium text-orange-400">Attention Required</span>
            </div>
            <div className="space-y-2">
              {permissionAlerts.slice(0, 3).map((alert, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">
                    {alert.type === "expiring" 
                      ? `🕐 Permission expiring: ${formatTimeRemaining(alert.permission.timeRemaining)} left`
                      : `📊 High utilization: ${alert.permission.currentPeriod.percentage.toFixed(0)}% used this period`
                    }
                  </span>
                  <span className="text-xs text-orange-400">
                    {alert.permission.granteeAddress.slice(0, 6)}...
                  </span>
                </div>
              ))}
              {permissionAlerts.length > 3 && (
                <p className="text-xs text-[var(--text-muted)]">+{permissionAlerts.length - 3} more alerts</p>
              )}
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">

        {/* User's Wallet Balance */}
        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <span className="text-sm font-medium">Your Wallet</span>
            <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Funds Source</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-[var(--text-muted)]">ETH Balance</span>
              <p className="text-lg font-semibold">{userBalance.eth} ETH</p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)]">USDC Balance</span>
              <p className="text-lg font-semibold">{userBalance.usdc} USDC</p>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            Agents execute via ERC-7715 permissions. Funds come from your wallet.
          </p>
        </div>

        {/* All Agents */}
        <div className="space-y-4">
          {agents.map((agent) => {
            const isThisExecuting = isExecuting === agent.agentWallet;
            const thisExecution = lastExecution?.agentWallet === agent.agentWallet ? lastExecution : null;
            const execCount = executionCounts[agent.agentWallet] || 0;
            // Calculate permission expiry
            const permEndDate = agent.permission?.endDate ? new Date(agent.permission.endDate) : null;
            const daysLeft = permEndDate ? Math.ceil((permEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            const agentIcon = AGENT_ICONS[agent.agentType] || "🤖";
            
            // Calculate next execution time based on frequency
            const freqSeconds: Record<string, number> = { hourly: 3600, daily: 86400, weekly: 604800 };
            const freq = agent.permission?.frequency || "daily";
            const periodSec = freqSeconds[freq] || 86400;
            // For demo, show countdown from now (in production, track last execution)
            const nextExecIn = periodSec - (Math.floor(Date.now() / 1000) % periodSec);
            const nextExecHours = Math.floor(nextExecIn / 3600);
            const nextExecMins = Math.floor((nextExecIn % 3600) / 60);

            return (
              <div key={agent.agentWallet} className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{agentIcon}</span>
                    <div>
                      <h3 className="font-semibold">{agent.agentName}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Active</span>
                        {execCount > 0 && (
                          <span className="text-[10px] text-[var(--text-muted)]">{execCount} runs</span>
                        )}
                        {daysLeft !== null && daysLeft <= 7 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${daysLeft <= 2 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                          ⏱ {nextExecHours}h {nextExecMins}m
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Auto-execute toggle */}
                    <button
                      onClick={() => toggleAutoExecute(agent.agentWallet)}
                      className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 ${
                        autoExecuteEnabled[agent.agentWallet] 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-[var(--bg-dark)] text-[var(--text-muted)]"
                      }`}
                      title={autoExecuteEnabled[agent.agentWallet] ? "Auto-execute ON" : "Auto-execute OFF"}
                    >
                      {autoExecuteEnabled[agent.agentWallet] ? "🔄 Auto" : "⏸️ Manual"}
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.agentWallet)}
                      className="px-2 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs"
                      title="Delete agent"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => handleExecute(agent)}
                      disabled={isThisExecuting || parseFloat(userBalance.eth) < 0.0001}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-1"
                    >
                      {isThisExecuting ? (
                        <><span className="animate-spin">⏳</span> Running...</>
                      ) : (
                        <>⚡ Execute</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-[var(--bg-dark)] rounded-lg mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)]">Agent Wallet (Signer)</span>
                    <button 
                      onClick={() => setShowExportKey(showExportKey === agent.agentWallet ? null : agent.agentWallet)} 
                      className="text-[10px] text-[var(--primary)]"
                    >
                      {showExportKey === agent.agentWallet ? "Hide" : "Key"}
                    </button>
                  </div>
                  <AddressDisplay address={agent.agentWallet} chainId={chainId} truncate />
                  {showExportKey === agent.agentWallet && agent.agentPrivateKey && (
                    <p className="mt-1 font-mono text-[9px] text-yellow-400 break-all">{agent.agentPrivateKey}</p>
                  )}
                </div>

                {/* Target/Recipient - show for gas refiller, vault, transfer */}
                {agent.recipient && (
                  <div className="p-2 bg-[var(--bg-dark)] rounded-lg mb-3">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {agent.agentType === "gas" ? "Refills →" : agent.agentType === "vault" ? "Vault →" : "Sends to →"}
                    </span>
                    <AddressDisplay address={agent.recipient} chainId={chainId} truncate />
                  </div>
                )}

                {/* Permission */}
                <div className="p-2 bg-green-500/5 border border-green-500/30 rounded-lg text-xs">
                  <span className="text-green-400">🔐 {agent.permission?.amount} {agent.token}/{agent.permission?.frequency}</span>
                  <span className="text-[var(--text-muted)] ml-2">• {agent.permission?.type}</span>
                </div>

                {/* Active Permissions for this agent */}
                {(() => {
                  const agentPerms = permissions.filter(p => 
                    !p.isRevoked && 
                    p.timeRemaining > 0 && 
                    p.granteeAddress.toLowerCase() === agent.agentWallet.toLowerCase()
                  );
                  
                  if (agentPerms.length === 0) {
                    // No active permission - show extend/renew button
                    return (
                      <div className="mt-2 p-2 bg-yellow-500/5 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-yellow-400">⚠️ No active permission</span>
                          <button 
                            onClick={() => handleExtendPermission(agent)}
                            className="px-2 py-0.5 text-[10px] bg-[var(--primary)] text-white rounded"
                          >
                            Grant Permission
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2 p-2 bg-purple-500/5 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-purple-400 font-medium">
                          Active Permissions ({agentPerms.length})
                        </span>
                      </div>
                      {agentPerms.map((p) => {
                        const originalIndex = permissions.findIndex(perm => perm.id === p.id);
                        const isThisRevoking = isRevoking === p.id;
                        const utilizationPct = p.currentPeriod.percentage;
                        const isExpiringSoon = p.expiryWarning !== "none";
                        
                        return (
                          <div key={p.id} className="py-1 border-t border-purple-500/20 first:border-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{p.config.amountPerPeriod} {p.config.token}/{p.config.periodDuration === 86400 ? "day" : "hr"}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">{formatTimeRemaining(p.timeRemaining)} left</span>
                                {isExpiringSoon && (
                                  <span className={`text-[10px] px-1 py-0.5 rounded ${
                                    p.expiryWarning === "critical" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                                  }`}>
                                    {p.expiryWarning === "critical" ? "⚠️ Expiring!" : "🕐 Soon"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isExpiringSoon && (
                                  <button 
                                    onClick={() => handleExtendPermission(agent)}
                                    className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded"
                                  >
                                    Extend
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRevokePermission(p.id, originalIndex)} 
                                  disabled={isThisRevoking}
                                  className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded disabled:opacity-50"
                                >
                                  {isThisRevoking ? "⏳" : "Revoke"}
                                </button>
                              </div>
                            </div>
                            {/* Utilization bar */}
                            <div className="mt-1">
                              <div className="flex items-center justify-between text-[10px] mb-0.5">
                                <span className="text-[var(--text-muted)]">This period</span>
                                <span className={utilizationPct > 90 ? "text-red-400" : utilizationPct > 70 ? "text-yellow-400" : "text-green-400"}>
                                  {p.currentPeriod.used.toFixed(4)} / {p.currentPeriod.allowed} {p.config.token} ({utilizationPct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-1.5 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    utilizationPct > 90 ? "bg-red-500" : utilizationPct > 70 ? "bg-yellow-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${Math.min(100, utilizationPct)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Execution result */}
                {thisExecution && (
                  <div className={`mt-2 p-2 rounded text-xs ${thisExecution.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {thisExecution.success ? (
                      <>✅ Success</>
                    ) : (
                      <>❌ {thisExecution.error || "Failed"}</>
                    )}
                    {thisExecution.txHash && (
                      <a href={`https://sepolia.etherscan.io/tx/${thisExecution.txHash}`} target="_blank" className="ml-2 text-[var(--primary)]">View →</a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unassigned Permissions (legacy - no agentWallet stored) */}
        {(() => {
          const assignedWallets = agents.map(a => a.agentWallet.toLowerCase());
          const unassignedPerms = permissions.filter(p => 
            !p.isRevoked && 
            p.timeRemaining > 0 && 
            !assignedWallets.includes(p.granteeAddress.toLowerCase())
          );
          if (unassignedPerms.length === 0) return null;
          return (
            <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/30 rounded-xl">
              <h3 className="text-sm font-medium text-yellow-400 mb-2">⚠️ Unassigned Permissions ({unassignedPerms.length})</h3>
              <p className="text-[10px] text-[var(--text-muted)] mb-2">These permissions were granted before agent tracking was added</p>
              {unassignedPerms.map((p) => {
                const originalIndex = permissions.findIndex(perm => perm.id === p.id);
                const isThisRevoking = isRevoking === p.id;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-t border-yellow-500/20">
                    <div>
                      <span className="text-xs">{p.config.amountPerPeriod} {p.config.token}/{p.config.periodDuration === 86400 ? "day" : "hr"}</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-2">{formatTimeRemaining(p.timeRemaining)} left</span>
                      <span className="text-[10px] text-yellow-400 ml-2">→ {p.granteeAddress.slice(0, 6)}...{p.granteeAddress.slice(-4)}</span>
                    </div>
                    <button 
                      onClick={() => handleRevokePermission(p.id, originalIndex)} 
                      disabled={isThisRevoking}
                      className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded disabled:opacity-50"
                    >
                      {isThisRevoking ? "⏳" : "Revoke"}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
          </div>

          {/* Right Column - Live Activity */}
          <div className="lg:col-span-1 space-y-4">
            {/* Live Activity Feed - Always show */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] lg:sticky lg:top-6">
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2">
                    {envioStatus === "online" ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                    )}
                  </span>
                  <h3 className="font-medium">Live Activity</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${envioStatus === "online" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}`}>
                    HyperSync
                  </span>
                  {envioStatus === "online" ? (
                    <>
                      <span className="text-[10px] text-[var(--text-muted)]">Auto 3s</span>
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                        {indexedDeposits.length}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-red-400">Connecting...</span>
                  )}
                </div>
              </div>
              {envioStatus !== "online" ? (
                <div className="p-4 text-center">
                  <p className="text-[var(--text-muted)] text-sm">⏳ Connecting to Envio...</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Indexer syncing, please wait</p>
                </div>
              ) : indexedDeposits.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[var(--text-muted)] text-sm">Watching...</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Execute to see HyperSync</p>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  {indexedDeposits.map((d) => {
                    // timestamp from Envio is BigInt unix timestamp in seconds
                    let timestampMs = Date.now();
                    if (d.timestamp) {
                      const ts = typeof d.timestamp === 'string' ? parseInt(d.timestamp) : Number(d.timestamp);
                      if (!isNaN(ts) && ts > 0) {
                        timestampMs = ts * 1000;
                      }
                    }
                    const secondsAgo = Math.floor((Date.now() - timestampMs) / 1000);
                    const timeAgo = isNaN(secondsAgo) || secondsAgo < 0 ? "now" : secondsAgo < 60 ? `${secondsAgo}s` : secondsAgo < 3600 ? `${Math.floor(secondsAgo / 60)}m` : `${Math.floor(secondsAgo / 3600)}h`;
                    
                    // Chain logos
                    const isSepolia = d.chainId === 11155111;
                    const chainLogo = isSepolia 
                      ? "https://cryptologos.cc/logos/ethereum-eth-logo.svg" 
                      : "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg";
                    const chainName = isSepolia ? "Sepolia" : "Base";
                    const chainColor = isSepolia ? "blue" : "purple";
                    
                    return (
                      <div key={d.id} className="p-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-dark)]/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <img src={chainLogo} alt={chainName} className="w-4 h-4" />
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-${chainColor}-500/20 text-${chainColor}-400`}>
                              {chainName}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">{timeAgo}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{(Number(d.amount) / 1e18).toFixed(4)} ETH</span>
                          <a
                            href={`${isSepolia ? "https://sepolia.etherscan.io" : "https://sepolia.basescan.org"}/tx/${d.txHash}`}
                            target="_blank"
                            className="text-[10px] text-[var(--primary)] hover:underline"
                          >
                            Tx →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
