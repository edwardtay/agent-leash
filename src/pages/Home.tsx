import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-[85vh] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="text-6xl mb-4 block">🤖</span>
          <h1 className="text-4xl font-bold mb-3">
            <span className="text-[var(--primary)]">Agent</span>Leash
          </h1>
          <p className="text-xl text-[var(--text-muted)] mb-2">
            Your AI agents are spending your money.
          </p>
          <p className="text-xl mb-6">
            Shouldn't you have a <span className="text-[var(--primary)]">leash</span> on them?
          </p>

          {!isConnected ? (
            <div className="flex justify-center"><ConnectButton /></div>
          ) : (
            <Link
              to="/setup"
              className="inline-block px-8 py-3 bg-[var(--primary)] text-white text-lg font-medium rounded-xl hover:opacity-90"
            >
              Get Started →
            </Link>
          )}
        </div>

        {/* Problem / Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h3 className="font-semibold text-red-400 mb-3">❌ The Problem</h3>
            <p className="text-sm text-[var(--text-muted)]">
              AI agents need wallet access to trade, pay, and manage DeFi. But current solutions are all-or-nothing. 
              One bug, one hack, one rogue agent — and your funds are gone.
            </p>
          </div>
          <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
            <h3 className="font-semibold text-green-400 mb-3">✅ The Solution</h3>
            <p className="text-sm text-[var(--text-muted)]">
              ERC-7715 permissions let you set granular, time-limited spending controls. 
              Agents can only spend what you allow, when you allow it. Revoke anytime.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Step n={1} icon="🤖" title="Setup Agent" desc="Choose agent type (DCA, Sniper, Subscription, Yield) and configure spending limits" />
            <Step n={2} icon="🔐" title="Grant Permission" desc="Approve ERC-7715 permission via MetaMask. Permission type auto-determined by setup." />
            <Step n={3} icon="📊" title="Monitor & Revoke" desc="Track spending in real-time. Revoke access instantly if needed." />
          </div>
        </div>

        {/* ERC-7715 Permission Types */}
        <div className="p-6 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] mb-12">
          <h3 className="font-semibold mb-4">ERC-7715 Permission Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PermType type="native-token-periodic" desc="ETH with period limits" color="green" />
            <PermType type="native-token-stream" desc="ETH streaming" color="blue" />
            <PermType type="erc20-token-periodic" desc="ERC20 with period limits" color="green" />
            <PermType type="erc20-token-stream" desc="ERC20 streaming" color="blue" />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4">
            Permission type is automatically determined based on your agent setup (token + agent type).
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Feature icon="⏰" title="Time-Limited" desc="Auto-expire after set duration" />
          <Feature icon="💰" title="Spend Caps" desc="Per-period or streaming limits" />
          <Feature icon="🚫" title="Instant Revoke" desc="Cut off access with one click" />
          <Feature icon="👁️" title="Full Visibility" desc="Track every transaction" />
        </div>
      </div>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: string; title: string; desc: string }) {
  return (
    <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-sm font-bold">{n}</div>
        <span className="text-2xl">{icon}</span>
      </div>
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-[var(--text-muted)]">{desc}</p>
    </div>
  );
}

function PermType({ type, desc, color }: { type: string; desc: string; color: string }) {
  return (
    <div className="p-3 bg-[var(--bg-dark)] rounded-lg">
      <p className={`font-mono text-xs ${color === "blue" ? "text-blue-400" : "text-green-400"}`}>{type}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
      <span className="text-2xl">{icon}</span>
      <h4 className="font-medium mt-2">{title}</h4>
      <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
    </div>
  );
}
