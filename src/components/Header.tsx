import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { useEffect, useState } from "react";
import { getUserSmartAccountBalance } from "../lib/agent";

export function Header() {
  const { pathname } = useLocation();
  const { address } = useAccount();
  const chainId = useChainId();
  const [balance, setBalance] = useState({ eth: "0", usdc: "0" });

  // Fetch balance when address or chain changes
  useEffect(() => {
    if (address && chainId) {
      getUserSmartAccountBalance(address as `0x${string}`, chainId).then(setBalance);
    }
  }, [address, chainId]);

  const steps = [
    { path: "/setup", label: "Setup", icon: "🤖" },
    { path: "/grant", label: "Grant", icon: "🔐" },
    { path: "/monitor", label: "Monitor", icon: "📊" },
  ];

  const currentIdx = steps.findIndex((s) => pathname.startsWith(s.path));

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="AgentLeash" className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold text-[var(--primary)] hidden sm:inline">AgentLeash</span>
          </Link>

          {/* Steps */}
          <nav className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.path} className="flex items-center">
                <Link
                  to={step.path}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs transition-all ${
                    pathname.startsWith(step.path)
                      ? "bg-[var(--primary)] text-white"
                      : currentIdx > i
                      ? "bg-green-500/20 text-green-400"
                      : "bg-[var(--bg-dark)] text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  <span>{step.icon}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </Link>
                {i < steps.length - 1 && (
                  <div className={`w-3 sm:w-4 h-0.5 mx-0.5 ${currentIdx > i ? "bg-green-500" : "bg-[var(--border)]"}`} />
                )}
              </div>
            ))}
          </nav>

          <div className="scale-90 origin-right">
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                const connected = mounted && account && chain;
                return (
                  <div>
                    {!connected ? (
                      <button
                        onClick={openConnectModal}
                        className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg"
                      >
                        Connect
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--bg-dark)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <img src={chain.iconUrl} alt={chain.name || ""} className="w-4 h-4 rounded-full" />
                          )}
                          <span className="text-[10px] font-medium hidden sm:inline">
                            {chain.name}
                          </span>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-[var(--text-muted)]">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-dark)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                        >
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-[var(--primary)] font-medium">{balance.eth} ETH</p>
                          </div>
                          <span className="text-xs font-medium">{account.displayName}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  );
}
