/**
 * Centralized Chain Configuration
 * All chain-specific data in one place - use this everywhere
 */

import { sepolia, baseSepolia } from "viem/chains";

export const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
export const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  chain: typeof sepolia | typeof baseSepolia;
  rpc: string;
  explorer: string;
  logo: string;
  color: string;
  colorClass: string;
  bgClass: string;
  contracts: {
    SimpleVault: `0x${string}`;
    YieldVault: `0x${string}`;
    USDC: `0x${string}`;
    AaveWrapper?: `0x${string}`;
    AavePool?: `0x${string}`;
    WETH?: `0x${string}`;
    aWETH?: `0x${string}`;
  };
}

export const CHAINS: Record<number, ChainConfig> = {
  [sepolia.id]: {
    id: sepolia.id,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    chain: sepolia,
    rpc: SEPOLIA_RPC,
    explorer: "https://sepolia.etherscan.io",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    color: "blue",
    colorClass: "text-blue-400",
    bgClass: "bg-blue-500/20",
    contracts: {
      SimpleVault: "0x9acec7011519F89C59d9A595f9829bBb79Ed0d4b",
      YieldVault: "0xcE338780004Ebf71Af391Eb1D5a593ef32C176D4",
      USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      AaveWrapper: "0xdb1acDc06b6b6Fb711EC111376F410954362f9BA",
      AavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
      WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
      aWETH: "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830",
    },
  },
  [baseSepolia.id]: {
    id: baseSepolia.id,
    name: "Base Sepolia",
    shortName: "Base",
    chain: baseSepolia,
    rpc: BASE_SEPOLIA_RPC,
    explorer: "https://sepolia.basescan.org",
    logo: "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg",
    color: "purple",
    colorClass: "text-purple-400",
    bgClass: "bg-purple-500/20",
    contracts: {
      SimpleVault: "0x93fc90a3Fb7d8c15bbaF50bFCc612B26CA8E68c8",
      YieldVault: "0x78Efd0937058F3599Af03Fd496DB0eCB68d5c9Bb",
      USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    },
  },
};

// Default chain (Sepolia)
export const DEFAULT_CHAIN_ID = sepolia.id;

// Helper functions
export function getChain(chainId: number): ChainConfig {
  return CHAINS[chainId] || CHAINS[DEFAULT_CHAIN_ID];
}

export function getExplorerUrl(chainId: number, type: "tx" | "address", hash: string): string {
  const chain = getChain(chainId);
  return `${chain.explorer}/${type}/${hash}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  return getExplorerUrl(chainId, "tx", txHash);
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  return getExplorerUrl(chainId, "address", address);
}

export function getVaultAddress(chainId: number): `0x${string}` | null {
  return getChain(chainId).contracts.SimpleVault || null;
}

export function getYieldVaultAddress(chainId: number): `0x${string}` | null {
  return getChain(chainId).contracts.YieldVault || null;
}

export function getAaveWrapperAddress(chainId: number): `0x${string}` | null {
  return getChain(chainId).contracts.AaveWrapper || null;
}

export function getUSDCAddress(chainId: number): `0x${string}` | null {
  return getChain(chainId).contracts.USDC || null;
}

export function hasAaveSupport(chainId: number): boolean {
  return !!getChain(chainId).contracts.AaveWrapper;
}
