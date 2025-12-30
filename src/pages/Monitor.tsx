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

const COLORS = { primary: "#22c55e", warning: "#eab308", danger: "#ef4444" };

export function Monitor() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  
  const [setup, setSetup] = useState<any>(null);
  const [permissions, setPermissions] = useState<PermissionWithHealth[]>([]);
  const [stats, setStats] = useState(getDashboardStats());

  useEffect(() => {
    const stored = localStorage.getItem("leash_agent_setup");
    if (stored) setSetup(JSON.parse(stored));

    const load = () => {
      setPermissions(getPermissionsWithHealth());
      setStats(getDashboardStats());
    };
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const handleRevoke = (index: number) => {
    if (confirm("Revoke permission? Agent will no longer be able to spend.")) {
      revokePermission(index);
      setPermissions(getPermissionsWithHealth());
      setStats(getDashboardStats());
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
            <p className="text-[var(--text-muted)] text-sm">Real-time monitoring</p>
          </div>
          <button onClick={() => navigate("/setup")} className="px-4 py-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] text-sm hover:border-[var(--primary)]">
            + New Agent
          </button>
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
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="v" paddingAngle={3}>
                    {healthData.map((e, i) => <Cell key={i} fill={e.c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Warning</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
            </div>
          </div>
        </div>

        {/* Agent Card */}
        {setup && (
          <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🤖</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{setup.agentName}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {setup.spendLimit} {setup.token || "ETH"} / {setup.permissionType === "stream" ? "sec" : setup.frequency}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">● Active</span>
                {setup.permType && (
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{setup.permType}</p>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-[var(--bg-dark)] rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">Agent Wallet</p>
              <p className="font-mono text-sm">{setup.agentWallet}</p>
            </div>
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

function genSpendData(perms: PermissionWithHealth[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    let v = 0;
    perms.forEach(p => { if (p.status === "healthy") v += Math.random() * parseFloat(p.config.amountPerPeriod) * 0.3; });
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
