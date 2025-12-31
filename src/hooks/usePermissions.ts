import { useCallback, useState } from "react";
import { parseUnits } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { useAccount, useChainId, useWalletClient } from "wagmi";

// Chain-specific token configurations
const CHAIN_TOKENS: Record<number, { USDC: `0x${string}` }> = {
  [sepolia.id]: {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  [baseSepolia.id]: {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
};

// Token configurations (address will be resolved per chain)
export const TOKENS = {
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`, // default, will be overridden
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
  },
  ETH: {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as `0x${string}`,
    symbol: "ETH",
    decimals: 18,
    name: "Ethereum",
    isNative: true,
  },
} as const;

export type TokenKey = keyof typeof TOKENS;

export interface PermissionConfig {
  token: TokenKey;
  amountPerPeriod: string;
  periodDuration: number;
  durationDays: number;
  agentWallet?: string;
  permissionType?: "periodic" | "stream";
  startTime?: "now" | "custom";
  customStartDate?: string;
  justification?: string;
  initialAmount?: string;
  maxAmount?: string;
  amountPerSecond?: string;
}

export const PERIOD_OPTIONS = [
  { label: "Hourly", value: 3600 },
  { label: "Daily", value: 86400 },
  { label: "Weekly", value: 604800 },
];

export const usePermissions = () => {
  const [grantedPermissions, setGrantedPermissions] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const requestPermission = useCallback(
    async (config: PermissionConfig, sessionAccountAddress: string) => {
      if (!address) {
        setError("Wallet not connected");
        return;
      }

      if (!walletClient) {
        setError("Wallet client not ready");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Dynamic import to avoid SSR issues
        const { erc7715ProviderActions } = await import("@metamask/smart-accounts-kit/actions");
        const client = walletClient.extend(erc7715ProviderActions());

        const currentTime = Math.floor(Date.now() / 1000);
        const startTime =
          config.startTime === "custom" && config.customStartDate
            ? Math.floor(new Date(config.customStartDate).getTime() / 1000)
            : currentTime;
        const expiry = currentTime + config.durationDays * 86400;
        
        // Get chain-specific token address
        const chainTokens = CHAIN_TOKENS[chainId] || CHAIN_TOKENS[sepolia.id];
        const token = {
          ...TOKENS[config.token],
          address: config.token === "USDC" ? chainTokens.USDC : TOKENS[config.token].address,
        };
        
        const justification =
          config.justification ||
          `AgentLeash: ${config.permissionType === "stream" ? "Stream" : "Spend"} ${config.token}`;

        const agentAddress = (config.agentWallet || sessionAccountAddress) as `0x${string}`;

        let permissionRequest: any;
        const isStream = config.permissionType === "stream";

        if (config.token === "ETH") {
          if (isStream) {
            permissionRequest = {
              chainId,
              expiry,
              signer: { type: "account", data: { address: agentAddress } },
              isAdjustmentAllowed: true,
              permission: {
                type: "native-token-stream",
                data: {
                  amountPerSecond: parseUnits(config.amountPerSecond || "0.0001", token.decimals),
                  initialAmount: parseUnits(config.initialAmount || "0", token.decimals),
                  ...(config.maxAmount ? { maxAmount: parseUnits(config.maxAmount, token.decimals) } : {}),
                  startTime,
                  justification,
                },
              },
            };
          } else {
            permissionRequest = {
              chainId,
              expiry,
              signer: { type: "account", data: { address: agentAddress } },
              isAdjustmentAllowed: true,
              permission: {
                type: "native-token-periodic",
                data: {
                  periodAmount: parseUnits(config.amountPerPeriod, token.decimals),
                  periodDuration: config.periodDuration,
                  startTime,
                  justification,
                },
              },
            };
          }
        } else {
          if (isStream) {
            permissionRequest = {
              chainId,
              expiry,
              signer: { type: "account", data: { address: agentAddress } },
              isAdjustmentAllowed: true,
              permission: {
                type: "erc20-token-stream",
                data: {
                  tokenAddress: token.address,
                  amountPerSecond: parseUnits(config.amountPerSecond || "0.0001", token.decimals),
                  initialAmount: parseUnits(config.initialAmount || "0", token.decimals),
                  ...(config.maxAmount ? { maxAmount: parseUnits(config.maxAmount, token.decimals) } : {}),
                  startTime,
                  justification,
                },
              },
            };
          } else {
            permissionRequest = {
              chainId,
              expiry,
              signer: { type: "account", data: { address: agentAddress } },
              isAdjustmentAllowed: true,
              permission: {
                type: "erc20-token-periodic",
                data: {
                  tokenAddress: token.address,
                  periodAmount: parseUnits(config.amountPerPeriod, token.decimals),
                  periodDuration: config.periodDuration,
                  startTime,
                  justification,
                },
              },
            };
          }
        }

        const permission = await client.requestExecutionPermissions([permissionRequest]);
        console.log("Permission response:", JSON.stringify(permission, null, 2));
        setGrantedPermissions(permission);

        // Store permission in localStorage with agent wallet
        const storedPermissions = JSON.parse(localStorage.getItem("leash_permissions") || "[]");
        storedPermissions.push({
          permission,
          config,
          agentWallet: agentAddress, // Store agent wallet explicitly
          createdAt: currentTime,
          expiry,
        });
        localStorage.setItem("leash_permissions", JSON.stringify(storedPermissions));
        console.log("Stored permission:", storedPermissions[storedPermissions.length - 1]);

        return permission;
      } catch (err: any) {
        setError(err.message || "Failed to request permission");
        console.error("Permission request error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [address, walletClient, chainId]
  );

  const getStoredPermissions = useCallback(() => {
    return JSON.parse(localStorage.getItem("leash_permissions") || "[]");
  }, []);

  const getStoredExecutions = useCallback(() => {
    return JSON.parse(localStorage.getItem("leash_executions") || "[]");
  }, []);

  return {
    grantedPermissions,
    isLoading,
    error,
    txHash,
    requestPermission,
    getStoredPermissions,
    getStoredExecutions,
    setError,
  };
};
