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
    if (confirm("Revoke permission?")) {
      revokePermission(index);
      setPermissions(getPermissionsWithHealth());
      setStats(getDashboardStats());
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">📊</span>
        <h1 className="text-xl font-semibold mb-2">Monitor</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet</p>
        <ConnectButton />
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-4xl mb-3 block">📊</span>
        <h1 className="text-xl font-semibold mb-2">No Permissions</h1>
        <button onClick={() => navigate("/setup")} className="text-[var(--primary)] text-sm">Setup Agent →</button>
      </div>
    );
  }

  const spendData = genSpendData(permissions);
  const healthData = genHealthData(permissions);

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Stat icon="🤖" value={stats.activePermissions} label="Active" />
        <Stat icon="⚡" value={stats.totalExecutions} label="Txns" />
        <Stat icon="💰" value={`${stats.totalVolume.toFixed(3)}`} label="Spent" />
        <Stat icon="💚" value={`${Math.round((stats.healthyCount / Math.max(stats.activePermissions, 1)) * 100)}%`} label="Health" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">Spending (7d)</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendData}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', fontSize: 11 }} />
                <Area type="monotone" dataKey="v" stroke={COLORS.primary} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">Health</p>
          <div className="h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="v" paddingAngle={3}>
                  {healthData.map((e, i) => <Cell key={i} fill={e.c} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agent */}
      {setup && (
        <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] mb-4 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{setup.agentName}</p>
            <p className="text-xs text-[var(--text-muted)]">{setup.spendLimit} {setup.token || "ETH"} / {setup.frequency}</p>
          </div>
          <span className="text-xs text-green-400">● Active</span>
        </div>
      )}

      {/* Permissions */}
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] flex justify-between items-center">
          <span className="text-sm font-medium">Permissions</span>
          <span className="text-xs text-[var(--text-muted)]">{permissions.length}</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {permissions.map((p, i) => (
            <PermRow key={p.id} p={p} i={i} onRevoke={handleRevoke} />
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <button onClick={() => navigate("/setup")} className="text-xs text-[var(--text-muted)] hover:text-white">
          + Add Agent
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function PermRow({ p, i, onRevoke }: { p: PermissionWithHealth; i: number; onRevoke: (i: number) => void }) {
  const period = p.config.periodDuration === 3600 ? "hr" : p.config.periodDuration === 86400 ? "day" : "wk";
  const pct = Math.min((p.totalExecuted / parseFloat(p.config.amountPerPeriod)) * 100, 100);
  
  return (
    <div className="p-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        p.healthScore >= 70 ? "bg-green-500/20 text-green-400" :
        p.healthScore >= 40 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
      }`}>
        {p.healthScore}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{p.config.amountPerPeriod} {p.config.token}/{period}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-[var(--bg-dark)] rounded-full overflow-hidden">
            <div className={`h-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{p.executionCount} txns</span>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          p.status === "healthy" ? "bg-green-500/20 text-green-400" :
          p.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
        }`}>{p.status}</span>
        <p className="text-[10px] text-[var(--text-muted)] mt-1">{formatTimeRemaining(p.timeRemaining)}</p>
      </div>
      {p.status !== "revoked" && p.status !== "expired" && (
        <button onClick={() => onRevoke(i)} className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">
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
