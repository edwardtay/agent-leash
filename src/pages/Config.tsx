import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getPermissionsWithHealth, type PermissionWithHealth } from "../lib/permissions";

interface AgentSetup {
  agentType: string;
  agentName: string;
  agentWallet: string;
  createdAt: number;
}

export function Config() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const [agentSetup, setAgentSetup] = useState<AgentSetup | null>(null);
  const [permissions, setPermissions] = useState<PermissionWithHealth[]>([]);

  const [triggerType, setTriggerType] = useState<"price" | "time" | "custom">("price");
  const [priceThreshold, setPriceThreshold] = useState("2000");
  const [triggerCondition, setTriggerCondition] = useState<"below" | "above">("below");
  const [spendAmount, setSpendAmount] = useState("0.0001");
  const [checkInterval, setCheckInterval] = useState("30");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("leash_agent_setup");
    if (stored) setAgentSetup(JSON.parse(stored));

    const perms = getPermissionsWithHealth().filter((p) => p.status === "healthy" || p.status === "warning");
    setPermissions(perms);

    const configStored = localStorage.getItem("leash_agent_config");
    if (configStored) {
      const cfg = JSON.parse(configStored);
      setTriggerType(cfg.triggerType || "price");
      setPriceThreshold(cfg.priceThreshold || "2000");
      setTriggerCondition(cfg.triggerCondition || "below");
      setSpendAmount(cfg.spendAmount || "0.0001");
      setCheckInterval(cfg.checkInterval || "30");
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem("leash_agent_config", JSON.stringify({
      triggerType, priceThreshold, triggerCondition, spendAmount, checkInterval, savedAt: Date.now(),
    }));
    setIsSaved(true);
  };

  if (!agentSetup) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-4">⚙️ Step 3: Configure</h1>
        <p className="text-[var(--text-muted)] mb-8">Set up an agent first.</p>
        <button onClick={() => navigate("/agent")} className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg">← Agent Setup</button>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-4">⚙️ Step 3: Configure</h1>
        <p className="text-[var(--text-muted)] mb-8">Grant a permission first.</p>
        <button onClick={() => navigate("/grant")} className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg">← Grant Permission</button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-4">⚙️ Step 3: Configure</h1>
        <p className="text-[var(--text-muted)] mb-8">Connect wallet to configure.</p>
        <ConnectButton />
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">Config Saved!</h1>
        <p className="text-[var(--text-muted)] mb-8">{agentSetup.agentName} is ready.</p>
        <button onClick={() => navigate("/dashboard")} className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg">Dashboard →</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">⚙️ Step 3: Configure</h1>
      <p className="text-[var(--text-muted)] mb-6">Set up agent behavior.</p>

      <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] mb-6 flex items-center gap-4">
        <span className="text-2xl">🤖</span>
        <div><p className="font-medium">{agentSetup.agentName}</p><p className="text-sm text-[var(--text-muted)]">{agentSetup.agentType.toUpperCase()}</p></div>
      </div>

      <div className="p-6 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Trigger Type</label>
          <div className="flex gap-2">
            {[{ value: "price", label: "📈 Price" }, { value: "time", label: "⏰ Time" }, { value: "custom", label: "🔧 Custom" }].map((t) => (
              <button key={t.value} onClick={() => setTriggerType(t.value as any)} className={`flex-1 px-4 py-2 rounded-lg ${triggerType === t.value ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-dark)] text-[var(--text-muted)]"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {triggerType === "price" && (
          <div>
            <label className="block text-sm font-medium mb-2">Price Condition</label>
            <div className="flex gap-2">
              <select value={triggerCondition} onChange={(e) => setTriggerCondition(e.target.value as any)} className="px-4 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg">
                <option value="below">ETH below</option>
                <option value="above">ETH above</option>
              </select>
              <input type="text" value={priceThreshold} onChange={(e) => setPriceThreshold(e.target.value)} className="flex-1 px-4 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg" />
              <span className="px-4 py-2 text-[var(--text-muted)]">USD</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Spend per Trigger</label>
          <div className="flex gap-2">
            <input type="text" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} className="flex-1 px-4 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg" />
            <span className="px-4 py-2 text-[var(--text-muted)]">ETH</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Check Interval: {checkInterval}s</label>
          <input type="range" min="10" max="300" value={checkInterval} onChange={(e) => setCheckInterval(e.target.value)} className="w-full accent-[var(--primary)]" />
        </div>
      </div>

      <button onClick={saveConfig} className="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-lg">💾 Save & Continue</button>
    </div>
  );
}
