/**
 * Agent Execution Service
 * Executes transactions for different agent types on Sepolia
 */

import { createPublicClient, http, parseEther, encodeFunctionData } from "viem";
import { sepolia } from "viem/chains";

// Simple vault ABI for deposits
const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

// ERC20 transfer ABI
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Token addresses on Sepolia
const TOKENS = {
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const,
};

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  timestamp: number;
  amount: string;
  action: string;
}

/**
 * Execute DCA - swap/transfer tokens on schedule
 */
export async function executeDCA(
  agentPrivateKey: `0x${string}`,
  amount: string,
  token: "ETH" | "USDC"
): Promise<ExecutionResult> {
  // For demo: DCA just sends to a "swap" address (simulating DEX)
  const swapAddress = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;
  return executeTransfer(agentPrivateKey, swapAddress, amount, token, "dca");
}

/**
 * Execute Auto-Transfer - send tokens to recipient
 */
export async function executeAutoTransfer(
  agentPrivateKey: `0x${string}`,
  recipient: `0x${string}`,
  amount: string,
  token: "ETH" | "USDC"
): Promise<ExecutionResult> {
  return executeTransfer(agentPrivateKey, recipient, amount, token, "transfer");
}

/**
 * Execute Gas Refill - top up a wallet with ETH
 */
export async function executeGasRefill(
  agentPrivateKey: `0x${string}`,
  walletToRefill: `0x${string}`,
  amount: string
): Promise<ExecutionResult> {
  return executeTransfer(agentPrivateKey, walletToRefill, amount, "ETH", "gas-refill");
}

/**
 * Execute Vault Deposit - deposit to vault contract
 */
export async function executeVaultDeposit(
  agentPrivateKey: `0x${string}`,
  vaultAddress: `0x${string}`,
  amount: string
): Promise<ExecutionResult> {
  const timestamp = Date.now();

  try {
    const { privateKeyToAccount } = await import("viem/accounts");
    const { createWalletClient } = await import("viem");
    
    const account = privateKeyToAccount(agentPrivateKey);
    
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    // Call vault deposit function with ETH value
    const txHash = await walletClient.sendTransaction({
      to: vaultAddress,
      value: parseEther(amount),
      data: encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "deposit",
      }),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Store execution
    storeExecution({
      hash: txHash,
      timestamp,
      amount,
      token: "ETH",
      action: "vault-deposit",
      recipient: vaultAddress,
      status: receipt.status === "success" ? "success" : "failed",
    });

    return {
      success: receipt.status === "success",
      txHash,
      timestamp,
      amount,
      action: "vault-deposit",
    };
  } catch (error: any) {
    console.error("Vault deposit error:", error);
    return {
      success: false,
      error: error.message || "Vault deposit failed",
      timestamp,
      amount,
      action: "vault-deposit",
    };
  }
}

/**
 * Generic transfer execution
 */
async function executeTransfer(
  agentPrivateKey: `0x${string}`,
  recipient: `0x${string}`,
  amount: string,
  token: "ETH" | "USDC",
  action: string
): Promise<ExecutionResult> {
  const timestamp = Date.now();

  try {
    const { privateKeyToAccount } = await import("viem/accounts");
    const { createWalletClient } = await import("viem");
    
    const account = privateKeyToAccount(agentPrivateKey);
    
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    let txHash: `0x${string}`;

    if (token === "ETH") {
      txHash = await walletClient.sendTransaction({
        to: recipient,
        value: parseEther(amount),
      });
    } else {
      const amountInUnits = BigInt(Math.floor(parseFloat(amount) * 1e6));
      txHash = await walletClient.sendTransaction({
        to: TOKENS.USDC,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient, amountInUnits],
        }),
      });
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Store execution
    storeExecution({
      hash: txHash,
      timestamp,
      amount,
      token,
      action,
      recipient,
      status: receipt.status === "success" ? "success" : "failed",
    });

    return {
      success: receipt.status === "success",
      txHash,
      timestamp,
      amount,
      action,
    };
  } catch (error: any) {
    console.error(`${action} execution error:`, error);
    return {
      success: false,
      error: error.message || `${action} failed`,
      timestamp,
      amount,
      action,
    };
  }
}

/**
 * Store execution in localStorage
 */
function storeExecution(execution: {
  hash: string;
  timestamp: number;
  amount: string;
  token: string;
  action: string;
  recipient: string;
  status: string;
}) {
  const executions = JSON.parse(localStorage.getItem("leash_executions") || "[]");
  executions.push(execution);
  localStorage.setItem("leash_executions", JSON.stringify(executions));
}

/**
 * Get agent wallet balance
 */
export async function getAgentBalance(address: `0x${string}`): Promise<{ eth: string; usdc: string }> {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const ethBalance = await publicClient.getBalance({ address });
    
    const usdcBalance = await publicClient.readContract({
      address: TOKENS.USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    }) as bigint;

    return {
      eth: (Number(ethBalance) / 1e18).toFixed(6),
      usdc: (Number(usdcBalance) / 1e6).toFixed(2),
    };
  } catch (error) {
    console.error("Balance fetch error:", error);
    return { eth: "0", usdc: "0" };
  }
}

/**
 * Check if wallet needs gas refill
 */
export async function checkNeedsRefill(
  address: `0x${string}`,
  threshold: string
): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const balance = await publicClient.getBalance({ address });
    const thresholdWei = parseEther(threshold);
    
    return balance < thresholdWei;
  } catch {
    return false;
  }
}
