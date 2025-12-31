/**
 * Agent Execution Service
 * Executes transactions using ERC-7715 permissions
 */

import { createPublicClient, createWalletClient, http, parseEther, encodeFunctionData, type Hex } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

// Chain configs
const CHAIN_CONFIG: Record<number, { chain: typeof sepolia | typeof baseSepolia; rpc: string; usdc: `0x${string}` }> = {
  [sepolia.id]: {
    chain: sepolia,
    rpc: SEPOLIA_RPC,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  [baseSepolia.id]: {
    chain: baseSepolia,
    rpc: BASE_SEPOLIA_RPC,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
};

const VAULT_ABI = [
  { name: "deposit", type: "function", inputs: [], outputs: [], stateMutability: "payable" },
] as const;

const ERC20_ABI = [
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  timestamp: number;
  amount: string;
  action: string;
}

interface StoredPermission {
  permission: any;
  config: any;
  createdAt: number;
  expiry: number;
  isRevoked?: boolean;
}

function getLatestPermission(): StoredPermission | null {
  try {
    const permissions = JSON.parse(localStorage.getItem("leash_permissions") || "[]");
    const now = Math.floor(Date.now() / 1000);
    const valid = permissions
      .filter((p: StoredPermission) => !p.isRevoked && p.expiry > now)
      .sort((a: StoredPermission, b: StoredPermission) => b.createdAt - a.createdAt);
    return valid[0] || null;
  } catch {
    return null;
  }
}

function storeExecution(execution: Record<string, any>) {
  const executions = JSON.parse(localStorage.getItem("leash_executions") || "[]");
  executions.push(execution);
  localStorage.setItem("leash_executions", JSON.stringify(executions));
}

/**
 * Execute vault deposit using ERC-7715 permission
 */
export async function executeVaultDeposit(
  agentPrivateKey: `0x${string}`,
  vaultAddress: `0x${string}`,
  amount: string,
  agentWallet?: string,
  chainId: number = sepolia.id
): Promise<ExecutionResult> {
  const timestamp = Date.now();
  const account = privateKeyToAccount(agentPrivateKey);
  const agentAddr = agentWallet || account.address;

  // Get chain config - default to sepolia if unknown chain
  const config = CHAIN_CONFIG[chainId] || CHAIN_CONFIG[sepolia.id];
  console.log(`Executing on chain ${chainId} (${config.chain.name})`);

  try {
    const storedPerm = getLatestPermission();
    if (!storedPerm) {
      return { success: false, error: "No valid permission. Grant permission first.", timestamp, amount, action: "vault-deposit" };
    }

    const permissionResponse = storedPerm.permission?.[0];
    if (!permissionResponse) {
      return { success: false, error: "Invalid permission format", timestamp, amount, action: "vault-deposit" };
    }

    const permissionsContext = permissionResponse.permissionsContext as Hex;
    const delegationManager = permissionResponse.signerMeta?.delegationManager as Hex;

    if (!permissionsContext || !delegationManager) {
      return executeVaultDepositDirect(agentPrivateKey, vaultAddress, amount, agentAddr, chainId);
    }

    const walletClient = createWalletClient({ account, chain: config.chain, transport: http(config.rpc) });
    const publicClient = createPublicClient({ chain: config.chain, transport: http(config.rpc) });

    const { erc7710WalletActions } = await import("@metamask/smart-accounts-kit/actions");
    const extendedClient = walletClient.extend(erc7710WalletActions());

    const txHash = await extendedClient.sendTransactionWithDelegation({
      account,
      chain: config.chain,
      to: vaultAddress,
      value: parseEther(amount),
      data: encodeFunctionData({ abi: VAULT_ABI, functionName: "deposit" }),
      permissionsContext,
      delegationManager,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    storeExecution({
      hash: txHash, timestamp, amount, token: "ETH", action: "vault-deposit",
      recipient: vaultAddress, status: receipt.status === "success" ? "success" : "failed",
      usedPermission: true, agentWallet: agentAddr, chainId,
    });

    return { success: receipt.status === "success", txHash, timestamp, amount, action: "vault-deposit" };
  } catch (error: any) {
    if (error.message?.includes("delegation") || error.message?.includes("permission") || error.message?.includes("revert")) {
      return executeVaultDepositDirect(agentPrivateKey, vaultAddress, amount, agentAddr, chainId);
    }
    return { success: false, error: error.message || "Vault deposit failed", timestamp, amount, action: "vault-deposit" };
  }
}

async function executeVaultDepositDirect(
  agentPrivateKey: `0x${string}`,
  vaultAddress: `0x${string}`,
  amount: string,
  agentWallet?: string,
  chainId: number = sepolia.id
): Promise<ExecutionResult> {
  const timestamp = Date.now();

  try {
    const account = privateKeyToAccount(agentPrivateKey);
    const agentAddr = agentWallet || account.address;
    
    // Get chain config
    const config = CHAIN_CONFIG[chainId] || CHAIN_CONFIG[sepolia.id];
    
    const walletClient = createWalletClient({ account, chain: config.chain, transport: http(config.rpc) });
    const publicClient = createPublicClient({ chain: config.chain, transport: http(config.rpc) });

    const txHash = await walletClient.sendTransaction({
      to: vaultAddress,
      value: parseEther(amount),
      data: encodeFunctionData({ abi: VAULT_ABI, functionName: "deposit" }),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    storeExecution({
      hash: txHash, timestamp, amount, token: "ETH", action: "vault-deposit-direct",
      recipient: vaultAddress, status: receipt.status === "success" ? "success" : "failed",
      usedPermission: false, agentWallet: agentAddr, chainId,
    });

    return { success: receipt.status === "success", txHash, timestamp, amount, action: "vault-deposit" };
  } catch (error: any) {
    return { success: false, error: error.message || "Vault deposit failed", timestamp, amount, action: "vault-deposit" };
  }
}

/**
 * Get wallet balance (ETH and USDC)
 */
export async function getUserSmartAccountBalance(
  address: `0x${string}`,
  chainId: number = sepolia.id
): Promise<{ eth: string; usdc: string }> {
  try {
    const config = CHAIN_CONFIG[chainId] || CHAIN_CONFIG[sepolia.id];
    const publicClient = createPublicClient({ chain: config.chain, transport: http(config.rpc) });

    const ethBalance = await publicClient.getBalance({ address });
    
    let usdcBalance = BigInt(0);
    try {
      usdcBalance = await publicClient.readContract({
        address: config.usdc,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
    } catch { /* USDC might not exist */ }

    return {
      eth: (Number(ethBalance) / 1e18).toFixed(6),
      usdc: (Number(usdcBalance) / 1e6).toFixed(2),
    };
  } catch {
    return { eth: "0", usdc: "0" };
  }
}
