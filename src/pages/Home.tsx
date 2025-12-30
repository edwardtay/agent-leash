import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-2xl mx-auto text-center py-8 px-4">
      <span className="text-5xl mb-4 block">🤖</span>
      
      <h1 className="text-3xl font-bold mb-2">
        <span className="text-[var(--primary)]">Agent</span>Leash
      </h1>
      
      <p className="text-[var(--text-muted)] mb-6 text-sm">
        Control AI agent spending with ERC-7715 permissions
      </p>

      {!isConnected ? (
        <div className="mb-8"><ConnectButton /></div>
      ) : (
        <Link
          to="/setup"
          className="inline-block px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:opacity-90 mb-8"
        >
          Get Started →
        </Link>
      )}

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Step n={1} icon="🤖" title="Setup" desc="Choose agent type" />
        <Step n={2} icon="🔐" title="Grant" desc="Approve permission" />
        <Step n={3} icon="📊" title="Monitor" desc="Track & revoke" />
      </div>

      {/* ERC-7715 Permission Types */}
      <div className="p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] text-left">
        <p className="text-xs text-[var(--text-muted)] mb-3">ERC-7715 Permission Types</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[var(--bg-dark)] rounded">
            <span className="text-green-400">native-token-periodic</span>
            <p className="text-[var(--text-muted)] text-[10px]">ETH with period limits</p>
          </div>
          <div className="p-2 bg-[var(--bg-dark)] rounded">
            <span className="text-blue-400">native-token-stream</span>
            <p className="text-[var(--text-muted)] text-[10px]">ETH streaming</p>
          </div>
          <div className="p-2 bg-[var(--bg-dark)] rounded">
            <span className="text-green-400">erc20-token-periodic</span>
            <p className="text-[var(--text-muted)] text-[10px]">ERC20 with period limits</p>
          </div>
          <div className="p-2 bg-[var(--bg-dark)] rounded">
            <span className="text-blue-400">erc20-token-stream</span>
            <p className="text-[var(--text-muted)] text-[10px]">ERC20 streaming</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        <Feature icon="⏰" title="Time-Limited" />
        <Feature icon="💰" title="Spend Caps" />
        <Feature icon="🚫" title="Instant Revoke" />
        <Feature icon="👁️" title="Full Visibility" />
      </div>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: string; title: string; desc: string }) {
  return (
    <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
      <div className="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">{n}</div>
      <span className="text-xl">{icon}</span>
      <p className="text-sm font-medium mt-1">{title}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{desc}</p>
    </div>
  );
}

function Feature({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">{title}</p>
    </div>
  );
}
