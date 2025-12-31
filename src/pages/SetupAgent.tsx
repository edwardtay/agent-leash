import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getVaultAddress, getAaveWrapperAddress, getYieldVaultAddress, hasAaveSupport, getChain } from "../config/chains";
import { AddressDisplay } from "../components/AddressDisplay";

type AgentType = "dca" | "transfer" | "gas" | "vault";

const TOKENS = {
  ETH: { symbol: "ETH", name: "Ethereum", isNative: true },
  USDC: { symbol: "USDC", name: "USD Coin", isNative: false },
};

const FREQ_OPTIONS = {
  hourly: { label: "Hourly", seconds: 3600 },
  daily: { label: "Daily", seconds: 86400 },
  weekly: { label: "Weekly", seconds: 604800 },
};

const AGENT_CONFIG: Record<AgentType, {
  name: string;
  icon: string;
  desc: string;
  tokens: (keyof typeof TOKENS)[];
  needsRecipient: boolean;
  recipientLabel: string;
  recipientPlaceholder: string;
  isContract?: boolean;
  isSwap?: boolean;
}> = {
  dca: {
    name: "DCA Bot",
    icon: "📈",
    desc: "Dollar-cost average: swap tokens on a schedule",
    tokens: ["ETH", "USDC"],
    needsRecipient: false,
    recipientLabel: "",
    recipientPlaceholder: "",
    isSwap: true,
  },
  transfer: {
    name: "Auto-Transfer",
    icon: "💸",
    desc: "Send tokens to an address on schedule",
    tokens: ["ETH", "USDC"],
    needsRecipient: true,
    recipientLabel: "Recipient Address",
    recipientPlaceholder: "0x... (where to send)",
  },
  gas: {
    name: "Gas Refiller",
    icon: "⛽",
    desc: "Top up a wallet when ETH balance is low",
    tokens: ["ETH"],
    needsRecipient: true,
    recipientLabel: "Wallet to Refill",
    recipientPlaceholder: "0x... (bot wallet to top up)",
  },
  vault: {
    name: "Auto-Deposit",
    icon: "🏦",
    desc: "Auto-deposit to vault (demo or Aave yield)",
    tokens: ["ETH", "USDC"],
    needsRecipient: true,
    recipientLabel: "Vault Address",
    recipientPlaceholder: "0x... (select below or paste custom)",
    isContract: true,
  },
};

export function SetupAgent() {
  const { agentType } = useParams<{ agentType: string }>();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();

  const config = AGENT_CONFIG[agentType as AgentType];

  // Generate unique wallet for this agent
  const [agentWallet, setAgentWallet] = useState<{ address: string; privateKey: string } | null>(null);
  
  const [agentName, setAgentName] = useState("");
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>("ETH");
  const [recipient, setRecipient] = useState("");
  
  // Generate wallet on mount
  useEffect(() => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    setAgentWallet({ address: account.address, privateKey });
  }, []);
  
  // Auto-fill vault address for vault agent
  useEffect(() => {
    if (agentType === "vault" && chainId) {
      // Default to YieldVault (works on all chains)
      const yieldVaultAddr = getYieldVaultAddress(chainId);
      if (yieldVaultAddr) {
        setRecipient(yieldVaultAddr);
      }
    }
  }, [agentType, chainId]);
  // Agent Execution Schedule
  const [execFrequency, setExecFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [execAmount, setExecAmount] = useState("0.001");
  const [execDuration, setExecDuration] = useState(7); // days
  
  // Gas Refiller specific: threshold trigger
  const [triggerThreshold, setTriggerThreshold] = useState("0.005"); // trigger when below this
  const [topUpAmount, setTopUpAmount] = useState("0.01"); // amount to top up
  
  // Permission/Funds Grant (can be different from execution)
  const [permFrequency, setPermFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [permAmount, setPermAmount] = useState("0.01");
  const [permDuration, setPermDuration] = useState(30); // days

  useEffect(() => {
    if (config) {
      setAgentName(config.name);
      setSelectedToken(config.tokens[0]);
    }
  }, [agentType]);

  // Calculate execution cycles
  const execCycles = Math.floor(execDuration * 86400 / FREQ_OPTIONS[execFrequency].seconds);
  const execTotalSpend = parseFloat(agentType === "gas" ? topUpAmount : execAmount) * execCycles;
  const execEndDate = new Date(Date.now() + execDuration * 86400000);

  // Calculate permission cycles
  const permCycles = Math.floor(permDuration * 86400 / FREQ_OPTIONS[permFrequency].seconds);
  const permMaxSpend = parseFloat(permAmount) * permCycles;
  const permEndDate = new Date(Date.now() + permDuration * 86400000);

  // Permission type based on token
  const permType = TOKENS[selectedToken].isNative ? "native-token-periodic" : "erc20-token-periodic";

  // Validation: permission should cover execution needs
  const isPermissionSufficient = permMaxSpend >= execTotalSpend && permDuration >= execDuration;

  if (!config) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">❓</span>
        <p className="mb-4">Agent not found</p>
        <Link to="/setup" className="text-[var(--primary)]">← Back</Link>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">{config.icon}</span>
        <h1 className="text-2xl font-semibold mb-2">{config.name}</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">Connect wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  const handleContinue = () => {
    if (!agentWallet) return;
    if (config.needsRecipient && !recipient) {
      alert("Please enter recipient address");
      return;
    }
    
    // Store agent with its unique private key
    const agentData = {
      agentType,
      agentName,
      agentWallet: agentWallet.address,
      agentPrivateKey: agentWallet.privateKey,
      token: selectedToken,
      recipient: recipient || null,
      // Gas refiller specific
      ...(agentType === "gas" && {
        triggerThreshold,
        topUpAmount,
      }),
      // Execution schedule
      execution: {
        frequency: execFrequency,
        amount: agentType === "gas" ? topUpAmount : execAmount,
        duration: execDuration,
        cycles: execCycles,
        totalSpend: execTotalSpend,
        endDate: execEndDate.toISOString(),
        ...(agentType === "gas" && { triggerThreshold }),
      },
      // Permission grant
      permission: {
        frequency: permFrequency,
        amount: permAmount,
        duration: permDuration,
        cycles: permCycles,
        maxSpend: permMaxSpend,
        endDate: permEndDate.toISOString(),
        type: permType,
      },
      // Legacy fields for compatibility
      permissionType: "periodic",
      permType,
      spendLimit: permAmount,
      frequency: permFrequency,
      duration: permDuration,
      totalCycles: permCycles,
      maxSpend: permMaxSpend,
      startDate: new Date().toISOString(),
      endDate: permEndDate.toISOString(),
      createdAt: Date.now(),
    };
    
    localStorage.setItem("leash_agent_setup", JSON.stringify(agentData));
    navigate("/grant");
  };

  return (
    <div className="min-h-[80vh] px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/setup" className="text-[var(--text-muted)] hover:text-white text-xl">←</Link>
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-xl font-semibold">{config.name}</h1>
            <p className="text-sm text-[var(--text-muted)]">{config.desc}</p>
          </div>
        </div>

        {/* Basic Config */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <label className="block text-xs text-[var(--text-muted)] mb-2">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] outline-none"
            />
          </div>
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <label className="block text-xs text-[var(--text-muted)] mb-2">
              {config.isSwap ? "Spend Token" : "Token"}
            </label>
            <div className="flex gap-2">
              {config.tokens.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedToken(t)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedToken === t ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-dark)] text-[var(--text-muted)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {config.isSwap && (
              <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-2">
                <span className="font-semibold text-white">{selectedToken}</span>
                <span>→</span>
                <span className="font-semibold text-[var(--primary)]">{selectedToken === "ETH" ? "USDC" : "ETH"}</span>
                <span className="text-[10px]">(swap direction)</span>
              </p>
            )}
          </div>
          {config.needsRecipient && (
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <label className="block text-xs text-[var(--text-muted)] mb-2">
                {config.recipientLabel}
                {config.isContract && <span className="ml-1 text-yellow-400">(smart contract)</span>}
              </label>
              {/* Vault quick-select buttons */}
              {agentType === "vault" && (
                <div className="flex gap-2 mb-2">
                  {/* YieldVault - available on all chains */}
                  <button
                    onClick={() => setRecipient(getYieldVaultAddress(chainId) || "")}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${
                      recipient === getYieldVaultAddress(chainId) 
                        ? "bg-green-500 text-white" 
                        : "bg-[var(--bg-dark)] text-[var(--text-muted)] hover:border-green-500 border border-transparent"
                    }`}
                  >
                    🏦 YieldVault
                  </button>
                  {/* AaveWrapper - only on chains with Aave support */}
                  {hasAaveSupport(chainId) && (
                    <button
                      onClick={() => setRecipient(getAaveWrapperAddress(chainId) || "")}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${
                        recipient === getAaveWrapperAddress(chainId) 
                          ? "bg-purple-500 text-white" 
                          : "bg-[var(--bg-dark)] text-[var(--text-muted)] hover:border-purple-500 border border-transparent"
                      }`}
                    >
                      🔮 Aave V3
                    </button>
                  )}
                  {/* SimpleVault - demo */}
                  <button
                    onClick={() => setRecipient(getVaultAddress(chainId) || "")}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${
                      recipient === getVaultAddress(chainId) 
                        ? "bg-blue-500 text-white" 
                        : "bg-[var(--bg-dark)] text-[var(--text-muted)] hover:border-blue-500 border border-transparent"
                    }`}
                  >
                    📦 Demo
                  </button>
                </div>
              )}
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={config.recipientPlaceholder}
                className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono text-xs"
              />
              {config.isContract && recipient && (
                <p className="text-[10px] mt-2">
                  {recipient === getYieldVaultAddress(chainId) ? (
                    <span className="text-green-400">✓ YieldVault: unified interface on {getChain(chainId).name}</span>
                  ) : recipient === getAaveWrapperAddress(chainId) ? (
                    <span className="text-purple-400">✓ AaveWrapper: ETH → WETH → Aave V3 (real yield!)</span>
                  ) : recipient === getVaultAddress(chainId) ? (
                    <span className="text-blue-400">✓ SimpleVault: demo contract</span>
                  ) : (
                    <span className="text-yellow-400">✓ Custom contract address</span>
                  )}
                </p>
              )}
              {config.isContract && !recipient && (
                <p className="text-[10px] text-[var(--text-muted)] mt-2">
                  {hasAaveSupport(chainId) 
                    ? "YieldVault or Aave V3 for yield, Demo for testing"
                    : "YieldVault (same interface) or Demo"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Two Schedules Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Agent Execution Schedule */}
          <div className="p-5 bg-blue-500/5 border border-blue-500/30 rounded-xl">
            <h3 className="font-semibold text-blue-400 mb-4">🤖 Agent Execution Schedule</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {agentType === "gas" 
                ? "When to check balance and how much to top up" 
                : "When and how much the agent executes each time"}
            </p>
            
            <div className="space-y-4">
              {/* Gas Refiller: Threshold trigger */}
              {agentType === "gas" && (
                <>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Trigger When Balance Below</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={triggerThreshold}
                        onChange={(e) => setTriggerThreshold(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono"
                        placeholder="0.005"
                      />
                      <span className="px-3 py-2 bg-[var(--bg-dark)] rounded-lg text-[var(--text-muted)]">ETH</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Agent will top up when target wallet has less than this</p>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2">Top Up Amount</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono"
                        placeholder="0.01"
                      />
                      <span className="px-3 py-2 bg-[var(--bg-dark)] rounded-lg text-[var(--text-muted)]">ETH</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Amount to send when threshold is triggered</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-2">
                  {agentType === "gas" ? "Check Every" : "Execute Every"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FREQ_OPTIONS) as Array<keyof typeof FREQ_OPTIONS>).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExecFrequency(f)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        execFrequency === f ? "bg-blue-500 text-white" : "bg-[var(--bg-dark)] text-[var(--text-muted)]"
                      }`}
                    >
                      {FREQ_OPTIONS[f].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Non-gas agents: Amount per execution */}
              {agentType !== "gas" && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-2">Amount per Execution</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={execAmount}
                      onChange={(e) => setExecAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono"
                    />
                    <span className="px-3 py-2 bg-[var(--bg-dark)] rounded-lg text-[var(--text-muted)]">{selectedToken}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-[var(--text-muted)]">Run For</label>
                  <span className="text-sm">{execDuration} days</span>
                </div>
                <input type="range" min="1" max="90" value={execDuration} onChange={(e) => setExecDuration(parseInt(e.target.value))} className="w-full" />
              </div>

              {/* Execution Summary */}
              <div className="p-3 bg-blue-500/10 rounded-lg text-sm">
                {agentType === "gas" ? (
                  <>
                    <div className="flex justify-between mb-1">
                      <span className="text-[var(--text-muted)]">Trigger Threshold</span>
                      <span className="font-semibold text-yellow-400">&lt; {triggerThreshold} ETH</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[var(--text-muted)]">Top Up Amount</span>
                      <span className="font-semibold text-blue-400">{topUpAmount} ETH</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[var(--text-muted)]">Max Checks</span>
                      <span className="font-semibold">{execCycles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Monitoring Until</span>
                      <span>{execEndDate.toLocaleDateString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between mb-1">
                      <span className="text-[var(--text-muted)]">Total Executions</span>
                      <span className="font-semibold text-blue-400">{execCycles}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[var(--text-muted)]">Total Spend</span>
                      <span className="font-semibold">{execTotalSpend.toFixed(4)} {selectedToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Ends</span>
                      <span>{execEndDate.toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Permission/Funds Grant */}
          <div className="p-5 bg-green-500/5 border border-green-500/30 rounded-xl">
            <h3 className="font-semibold text-green-400 mb-4">🔐 Permission Grant (ERC-7715)</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">How much the agent is allowed to spend per period</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-2">Allowance Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FREQ_OPTIONS) as Array<keyof typeof FREQ_OPTIONS>).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPermFrequency(f)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        permFrequency === f ? "bg-green-500 text-white" : "bg-[var(--bg-dark)] text-[var(--text-muted)]"
                      }`}
                    >
                      {FREQ_OPTIONS[f].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-2">Max per Period</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={permAmount}
                    onChange={(e) => setPermAmount(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg font-mono"
                  />
                  <span className="px-3 py-2 bg-[var(--bg-dark)] rounded-lg text-[var(--text-muted)]">{selectedToken}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-[var(--text-muted)]">Permission Valid For</label>
                  <span className="text-sm">{permDuration} days</span>
                </div>
                <input type="range" min="1" max="365" value={permDuration} onChange={(e) => setPermDuration(parseInt(e.target.value))} className="w-full" />
              </div>

              {/* Permission Summary */}
              <div className="p-3 bg-green-500/10 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--text-muted)]">Total Periods</span>
                  <span className="font-semibold text-green-400">{permCycles}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--text-muted)]">Max Possible Spend</span>
                  <span className="font-semibold">{permMaxSpend.toFixed(4)} {selectedToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Expires</span>
                  <span>{permEndDate.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Permission Type */}
              <div className="px-3 py-2 rounded-lg font-mono text-xs bg-green-500/20 text-green-400">
                {permType}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Warning */}
        {!isPermissionSufficient && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400">
              ⚠️ Permission may not cover all executions. Execution needs {execTotalSpend.toFixed(4)} {selectedToken} over {execDuration} days, 
              but permission only allows {permMaxSpend.toFixed(4)} {selectedToken} over {permDuration} days.
            </p>
          </div>
        )}

        {/* Agent Wallet & Continue */}
        <div className="flex items-center gap-4">
          {agentWallet && (
            <div className="flex-1 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <span className="text-xs text-[var(--text-muted)] mr-2">Agent Wallet (new):</span>
              <AddressDisplay address={agentWallet.address} chainId={chainId} />
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={!agentWallet || !agentName || (config.needsRecipient && !recipient)}
            className="px-8 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
