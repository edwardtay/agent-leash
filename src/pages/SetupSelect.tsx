import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// 4 ERC-7715 Permission Types mapped to use cases
const PERMISSION_TYPES = [
  {
    id: "dca",
    name: "DCA Bot",
    icon: "📈",
    desc: "Auto-buy tokens on schedule",
    permType: "native-token-periodic",
    tag: "Periodic",
  },
  {
    id: "sniper",
    name: "Sniper",
    icon: "🎯",
    desc: "Execute on price triggers",
    permType: "erc20-token-periodic",
    tag: "Periodic",
  },
  {
    id: "payment",
    name: "Payments",
    icon: "💸",
    desc: "Streaming subscriptions",
    permType: "native-token-stream",
    tag: "Stream",
  },
  {
    id: "yield",
    name: "Yield",
    icon: "🌾",
    desc: "Auto-compound rewards",
    permType: "erc20-token-stream",
    tag: "Stream",
  },
];

export function SetupSelect() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <span className="text-5xl mb-3 block">🤖</span>
        <h1 className="text-2xl font-semibold mb-2">Setup Agent</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to start</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-1">Choose Agent Type</h1>
        <p className="text-[var(--text-muted)] text-sm">Each uses a different ERC-7715 permission</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PERMISSION_TYPES.map((p) => (
          <Link
            key={p.id}
            to={`/setup/${p.id}`}
            className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <h3 className="font-medium text-sm group-hover:text-[var(--primary)]">{p.name}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.tag === "Stream" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                  {p.tag}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{p.desc}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 font-mono opacity-60">{p.permType}</p>
          </Link>
        ))}
      </div>

      {/* ERC-7715 Info */}
      <div className="mt-6 p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)]">
          <span className="text-[var(--primary)]">ERC-7715</span> defines 4 permission types: native-token-periodic, native-token-stream, erc20-token-periodic, erc20-token-stream
        </p>
      </div>
    </div>
  );
}
