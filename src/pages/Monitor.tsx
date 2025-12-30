import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
  getPermissionsWithHealth,
  getDashboardStats,
  revokePermission,
  formatTimeRemaining,
  type PermissionWithHealth,
} from "../lib/permissions";
import { 
  executeDCA, 
  executeAutoTransfer, 
  executeGasRefill, 
  executeVaultDeposit,
  getAgentBalance 
} from "../lib/agent";
import { checkEnvioHealth } from "../lib/envio";
import { useSessionAccount } from "../providers/SessionAccountProvider";

const COLORS = { primary: "#22c55e", warning: "#eab308", danger: "#ef4444" };

export function Monitor() {
  const { isConnected } = useAccount();
  const { exportPrivateKey } = useSessionAccount();
  const navigate = useNavigate();
  
  const [setup, setSetup] = useState<any>(null);
  const [permissions, setPermissions] = useState<PermissionWithHealth[]>([]);
  const [stats, setStats] = useState(getDashboardStats());
  const [agentBalance, setAgentBalance] = useState({ eth: "0", usdc: "0" });
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [envioStatus, setEnvioStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showExportKey, setShowExportKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("leash_agent_setup");
    if (stored) {
      const s = JSON.parse(stored);
      setSetup(s);
      // Fetch agent balance
      if (s.agentWallet) {
        getAgentBalance(s.agentWallet as `0x${string}`).then(setAgentBalance);
      }
    }

    const load = () => {
      setPermissions(getPermissionsWithHealth());
      setStats(getDashboardStats());
    };
    load();
    const i = setInterval(load, 5000);

    // Check Envio status
    checkEnvioHealth().then(ok => setEnvioStatus(ok ? "online" : "offline"));

    return () => clearInterval(i);
  }, []);

  const handleRevoke = (index: number) => {
    if (confirm("Revoke permission? Agent will no longer be able to spend.")) {
      revokePermission(index);
      setPermissions(getPermissionsWithHealth());
      setStats(getDashboardStats());
    }
  };

  // Execute a real transaction using the agent
  const handleExecute = async () => {
    if (!setup) return;
    
    const privateKey = localStorage.getItem("session_private_key") as `0x${string}`;
    if (!privateKey) {
      alert("Agent wallet not found");
      return;
    }

    setIsExecuting(true);
    try {
      const amount = "0.0001"; // Small amount for demo
      const token = setup.token === "ETH" ? "ETH" : "USDC";
      let result;

      switch (setup.agentType) {
        case "dca":
          result = await executeDCA(privateKey, amount, token as "ETH" | "USDC");
          break;
        case "transfer":
          const recipient = setup.recipient || "0x000000000000000000000000000000000000dEaD";
          result = await executeAutoTransfer(privateKey, recipient as `0x${string}`, amount, token as "ETH" | "USDC");
          break;
        case "gas":
          const walletToRefill = setup.recipient || "0x000000000000000000000000000000000000dEaD";
          result = await executeGasRefill(privateKey, walletToRefill as `0x${string}`, amount);
          break;
        case "vault":
          const vaultAddress = setup.recipient || "0x000000000000000000000000000000000000dEaD";
          result = await executeVaultDeposit(privateKey, vaultAddress as `0x${string}`, amount);
          break;
        default:
          result = await executeDCA(privateKey, amount, token as "ETH" | "USDC");
      }

      setLastExecution(result);
      
      if (result.success) {
        getAgentBalance(setup.agentWallet as `0x${string}`).then(setAgentBalance);
        setStats(getDashboardStats());
      }
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setIsExecuting(false);
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

  if (permissions.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">📊</span>
        <h1 className="text-2xl font-semibold mb-2">No Active Permissions</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Setup an agent to get started</p>
        <button onClick={() => navigate("/setup")} className="px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl">
          Setup Agent →
        </button>
      </div>
    );
  }

  const spendData = genSpendData(permissions);
  const healthData = genHealthData(permissions);

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
            <p className="text-[var(--text-muted)] text-sm">Real-time monitoring & execution</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Envio Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
              envioStatus === "online" ? "bg-green-500/20 text-green-400" :
              envioStatus === "offline" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                envioStatus === "online" ? "bg-green-400" :
                envioStatus === "offline" ? "bg-red-400" : "bg-yellow-400"
              }`}></span>
              Envio {envioStatus}
            </div>
            <button onClick={() => navigate("/setup")} className="px-4 py-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] text-sm hover:border-[var(--primary)]">
              + New Agent
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat icon="🤖" value={stats.activePermissions} label="Active Agents" />
          <Stat icon="⚡" value={stats.totalExecutions} label="Transactions" />
          <Stat icon="💰" value={`${stats.totalVolume.toFixed(4)}`} label="Total Spent (ETH)" />
          <Stat icon="💚" value={`${Math.round((stats.healthyCount / Math.max(stats.activePermissions, 1)) * 100)}%`} label="System Health" color={stats.criticalCount > 0 ? "danger" : "primary"} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Spending Chart */}
          <div className="lg:col-span-2 p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <h3 className="font-medium mb-4">Spending Activity (7 days)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendData}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke={COLORS.primary} fill="url(#g)" name="ETH" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Pie */}
          <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <h3 className="font-medium mb-4">Permission Health</h3>
            <div className="h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="v" paddingAngle={3}>
                    {healthData.map((e, i) => <Cell key={i} fill={e.c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 text-xs mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Warning</span>
            </div>
          </div>
        </div>

        {/* Agent Card with Execute Button */}
        {setup && (
          <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] mb-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">🤖</span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{setup.agentName}</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">● Active</span>
                </div>
                
                {/* Agent Wallet & Balance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-dark)] rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[var(--text-muted)]">Agent Wallet (EOA)</p>
                      <button
                        onClick={() => setShowExportKey(!showExportKey)}
                        className="text-[10px] text-[var(--primary)] hover:underline"
                      >
                        {showExportKey ? "Hide" : "Export"} Key
                      </button>
                    </div>
                    <p className="font-mono text-xs truncate">{setup.agentWallet}</p>
                    {showExportKey && (
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <p className="text-[10px] text-yellow-400 mb-1">⚠️ Keep this secret!</p>
                        <p className="font-mono text-[10px] break-all select-all">{exportPrivateKey()}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[var(--bg-dark)] rounded-lg">
                    <p className="text-[10px] text-[var(--text-muted)]">Agent Balance</p>
                    <p className="text-sm font-medium">{agentBalance.eth} ETH • {agentBalance.usdc} USDC</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Fund this wallet to enable agent</p>
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <div className="text-right">
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || parseFloat(agentBalance.eth) < 0.0001}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isExecuting ? "Executing..." : "⚡ Test Execute"}
                </button>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Sends 0.0001 ETH to test
                </p>
              </div>
            </div>

            {/* Two Schedules Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Execution Schedule */}
              {setup.execution && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">🤖 Execution Schedule</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Frequency</span>
                      <span>{setup.execution.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Per Execution</span>
                      <span>{setup.execution.amount} {setup.token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Total Cycles</span>
                      <span className="text-blue-400 font-semibold">{setup.execution.cycles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Total Spend</span>
                      <span>{setup.execution.totalSpend?.toFixed(4)} {setup.token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Ends</span>
                      <span>{new Date(setup.execution.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Permission Grant */}
              {setup.permission && (
                <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-400 mb-3">🔐 Permission Grant</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Period</span>
                      <span>{setup.permission.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Max per Period</span>
                      <span className="text-green-400">{setup.permission.amount} {setup.token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Total Periods</span>
                      <span className="text-green-400 font-semibold">{setup.permission.cycles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Max Possible</span>
                      <span>{setup.permission.maxSpend?.toFixed(4)} {setup.token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Expires</span>
                      <span>{new Date(setup.permission.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-2 px-2 py-1 rounded font-mono text-[10px] bg-green-500/20 text-green-400 inline-block">
                    {setup.permission.type}
                  </div>
                </div>
              )}
            </div>

            {/* Last Execution Result */}
            {lastExecution && (
              <div className={`p-3 rounded-lg ${lastExecution.success ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                <p className={`text-sm ${lastExecution.success ? "text-green-400" : "text-red-400"}`}>
                  {lastExecution.success ? "✅ Transaction successful!" : "❌ Transaction failed"}
                </p>
                {lastExecution.txHash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${lastExecution.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    View on Etherscan →
                  </a>
                )}
                {lastExecution.error && (
                  <p className="text-xs text-red-400 mt-1">{lastExecution.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Permissions Table */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-medium">Active Permissions</h3>
            <span className="text-sm text-[var(--text-muted)]">{permissions.length} total</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {permissions.map((p, i) => (
              <PermRow key={p.id} p={p} i={i} onRevoke={handleRevoke} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label, color }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-xl font-bold ${color === "danger" ? "text-red-400" : ""}`}>{value}</p>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function PermRow({ p, i, onRevoke }: { p: PermissionWithHealth; i: number; onRevoke: (i: number) => void }) {
  const period = p.config.periodDuration === 3600 ? "hr" : p.config.periodDuration === 86400 ? "day" : "wk";
  const pct = Math.min((p.totalExecuted / parseFloat(p.config.amountPerPeriod)) * 100, 100);
  
  return (
    <div className="p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
        p.healthScore >= 70 ? "bg-green-500/20 text-green-400" :
        p.healthScore >= 40 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
      }`}>
        {p.healthScore}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{p.config.amountPerPeriod} {p.config.token}/{period}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-1.5 bg-[var(--bg-dark)] rounded-full overflow-hidden max-w-[200px]">
            <div className={`h-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-[var(--text-muted)]">{p.executionCount} txns • {p.totalExecuted.toFixed(4)} spent</span>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-xs px-2 py-1 rounded ${
          p.status === "healthy" ? "bg-green-500/20 text-green-400" :
          p.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
        }`}>{p.status}</span>
        <p className="text-xs text-[var(--text-muted)] mt-1">{formatTimeRemaining(p.timeRemaining)} left</p>
      </div>
      {p.status !== "revoked" && p.status !== "expired" && (
        <button onClick={() => onRevoke(i)} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
          Revoke
        </button>
      )}
    </div>
  );
}

function genSpendData(_perms: PermissionWithHealth[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Use real execution data from localStorage
  const executions = JSON.parse(localStorage.getItem("leash_executions") || "[]");
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = dayStart + 86400000;
    
    // Sum executions for this day
    const dayExecs = executions.filter((e: any) => e.timestamp >= dayStart && e.timestamp < dayEnd);
    const v = dayExecs.reduce((sum: number, e: any) => sum + parseFloat(e.amount || "0"), 0);
    
    return { d: days[d.getDay()], v: parseFloat(v.toFixed(4)) };
  });
}

function genHealthData(perms: PermissionWithHealth[]) {
  const h = perms.filter(p => p.status === "healthy").length || 1;
  const w = perms.filter(p => p.status === "warning").length;
  const c = perms.filter(p => p.status === "critical").length;
  return [
    { name: "Healthy", v: h, c: COLORS.primary },
    { name: "Warning", v: w, c: COLORS.warning },
    { name: "Critical", v: c, c: COLORS.danger },
  ].filter(d => d.v > 0);
}
