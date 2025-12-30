/**
 * Agent Execution Service
 * Executes transactions using ERC-7715 permissions
 * Agent signs, but funds come from USER's Smart Account
 */

import { createPublicClient, createWalletClient, http, parseEther, encodeFunctionData, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";

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

// ERC20 ABI
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

export interface StoredPermission {
  permission: any;
  config: any;
  createdAt: number;
  expiry: number;
}

/**
 * Get the latest valid permission for execution
 */
function getLatestPermission(): StoredPermission | null {
  try {
    const permissions = JSON.parse(localStorage.getItem("leash_permissions") || "[]");
    const now = Math.floor(Date.now() / 1000);
    
    // Find the latest non-expired permission
    const valid = permissions
      .filter((p: any) => !p.isRevoked && p.expiry > now)
      .sort((a: StoredPermission, b: StoredPermission) => b.createdAt - a.createdAt);
    
    return valid[0] || null;
  } catch {
    return null;
  }
}

/**
 * Execute vault deposit using ERC-7715 permission
 * The agent signs, but funds come from user's Smart Account
 */
export async function executeVaultDeposit(
  agentPrivateKey: `0x${string}`,
  vaultAddress: `0x${string}`,
  amount: string
): Promise<ExecutionResult> {
  const timestamp = Date.now();

  try {
    // Get the permission context
    const storedPerm = getLatestPermission();
    if (!storedPerm) {
      return {
        success: false,
        error: "No valid permission found. Please grant permission first.",
        timestamp,
        amount,
        action: "vault-deposit",
      };
    }

    const permissionResponse = storedPerm.permission?.[0];
    console.log("Permission response for execution:", permissionResponse);
    if (!permissionResponse) {
      return {
        success: false,
        error: "Invalid permission format",
        timestamp,
        amount,
        action: "vault-deposit",
      };
    }

    const permissionsContext = permissionResponse.permissionsContext as Hex;
    const delegationManager = permissionResponse.signerMeta?.delegationManager as Hex;
    console.log("permissionsContext:", permissionsContext);
    console.log("delegationManager:", delegationManager);

    if (!permissionsContext || !delegationManager) {
      // Fallback to direct execution if no delegation context
      console.log("No delegation context, falling back to direct execution");
      return executeVaultDepositDirect(agentPrivateKey, vaultAddress, amount);
    }

    // Create agent wallet client
    const account = privateKeyToAccount(agentPrivateKey);
    
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    });

    // Import the ERC-7710 wallet actions
    const { erc7710WalletActions } = await import("@metamask/smart-accounts-kit/actions");
    const extendedClient = walletClient.extend(erc7710WalletActions());

    // Execute with delegation - funds come from user's Smart Account
    const txHash = await extendedClient.sendTransactionWithDelegation({
      account,
      chain: sepolia,
      to: vaultAddress,
      value: parseEther(amount),
      data: encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "deposit",
      }),
      permissionsContext,
      delegationManager,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    storeExecution({
      hash: txHash,
      timestamp,
      amount,
      token: "ETH",
      action: "vault-deposit",
      recipient: vaultAddress,
      status: receipt.status === "success" ? "success" : "failed",
      usedPermission: true,
    });

    return {
      success: receipt.status === "success",
      txHash,
      timestamp,
      amount,
      action: "vault-deposit",
    };
  } catch (error: any) {
    console.error("Vault deposit with permission error:", error);
    
    // If permission execution fails, try direct execution as fallback
    if (error.message?.includes("delegation") || error.message?.includes("permission") || error.message?.includes("revert")) {
      console.log("Permission execution failed, trying direct execution");
      return executeVaultDepositDirect(agentPrivateKey, vaultAddress, amount);
    }
    
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
 * Direct vault deposit (fallback when permission not available)
 * Agent uses its own funds
 */
async function executeVaultDepositDirect(
  agentPrivateKey: `0x${string}`,
  vaultAddress: `0x${string}`,
  amount: string
): Promise<ExecutionResult> {
  const timestamp = Date.now();

  try {
    const account = privateKeyToAccount(agentPrivateKey);
    
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    });

    const txHash = await walletClient.sendTransaction({
      to: vaultAddress,
      value: parseEther(amount),
      data: encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "deposit",
      }),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    storeExecution({
      hash: txHash,
      timestamp,
      amount,
      token: "ETH",
      action: "vault-deposit-direct",
      recipient: vaultAddress,
      status: receipt.status === "success" ? "success" : "failed",
      usedPermission: false,
    });

    return {
      success: receipt.status === "success",
      txHash,
      timestamp,
      amount,
      action: "vault-deposit",
    };
  } catch (error: any) {
    console.error("Direct vault deposit error:", error);
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
 * Execute transfer using ERC-7715 permission
 */
export async function executeTransferWithPermission(
  agentPrivateKey: `0x${string}`,
  recipient: `0x${string}`,
  amount: string,
  token: "ETH" | "USDC"
): Promise<ExecutionResult> {
  const timestamp = Date.now();

  try {
    const storedPerm = getLatestPermission();
    if (!storedPerm) {
      return {
        success: false,
        error: "No valid permission found",
        timestamp,
        amount,
        action: "transfer",
      };
    }

    const permissionResponse = storedPerm.permission?.[0];
    const permissionsContext = permissionResponse?.context as Hex;
    const delegationManager = permissionResponse?.signerMeta?.delegationManager as Hex;

    const account = privateKeyToAccount(agentPrivateKey);
    
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    });

    let txHash: `0x${string}`;

    if (permissionsContext && delegationManager) {
      const { erc7710WalletActions } = await import("@metamask/smart-accounts-kit/actions");
      const extendedClient = walletClient.extend(erc7710WalletActions());

      if (token === "ETH") {
        txHash = await extendedClient.sendTransactionWithDelegation({
          account,
          chain: sepolia,
          to: recipient,
          value: parseEther(amount),
          permissionsContext,
          delegationManager,
        });
      } else {
        const amountInUnits = BigInt(Math.floor(parseFloat(amount) * 1e6));
        txHash = await extendedClient.sendTransactionWithDelegation({
          account,
          chain: sepolia,
          to: TOKENS.USDC,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [recipient, amountInUnits],
          }),
          permissionsContext,
          delegationManager,
        });
      }
    } else {
      // Direct execution fallback
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
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    storeExecution({
      hash: txHash,
      timestamp,
      amount,
      token,
      action: "transfer",
      recipient,
      status: receipt.status === "success" ? "success" : "failed",
      usedPermission: !!permissionsContext,
    });

    return {
      success: receipt.status === "success",
      txHash,
      timestamp,
      amount,
      action: "transfer",
    };
  } catch (error: any) {
    console.error("Transfer error:", error);
    return {
      success: false,
      error: error.message || "Transfer failed",
      timestamp,
      amount,
      action: "transfer",
    };
  }
}

// Legacy exports for compatibility
export const executeDCA = executeTransferWithPermission;
export const executeAutoTransfer = executeTransferWithPermission;
export const executeGasRefill = (pk: `0x${string}`, to: `0x${string}`, amt: string) => 
  executeTransferWithPermission(pk, to, amt, "ETH");

function storeExecution(execution: {
  hash: string;
  timestamp: number;
  amount: string;
  token: string;
  action: string;
  recipient: string;
  status: string;
  usedPermission?: boolean;
}) {
  const executions = JSON.parse(localStorage.getItem("leash_executions") || "[]");
  executions.push(execution);
  localStorage.setItem("leash_executions", JSON.stringify(executions));
}

export async function getAgentBalance(address: `0x${string}`): Promise<{ eth: string; usdc: string }> {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
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
 * Get user's Smart Account balance (the account that granted permission)
 */
export async function getUserSmartAccountBalance(userAddress: `0x${string}`): Promise<{ eth: string; usdc: string }> {
  return getAgentBalance(userAddress);
}
