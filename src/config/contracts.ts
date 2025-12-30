/**
 * Deployed Contract Addresses
 * Update these after running script/deploy.sh
 */

export const CONTRACTS = {
  // Sepolia (chainId: 11155111)
  sepolia: {
    SimpleVault: "0x9acec7011519F89C59d9A595f9829bBb79Ed0d4b",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  // Base Sepolia (chainId: 84532)
  baseSepolia: {
    SimpleVault: "0x93fc90a3Fb7d8c15bbaF50bFCc612B26CA8E68c8",
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
} as const;

export function getVaultAddress(chainId: number): `0x${string}` | null {
  if (chainId === 11155111) return CONTRACTS.sepolia.SimpleVault as `0x${string}`;
  if (chainId === 84532) return CONTRACTS.baseSepolia.SimpleVault as `0x${string}`;
  return null;
}

export function getUSDCAddress(chainId: number): `0x${string}` | null {
  if (chainId === 11155111) return CONTRACTS.sepolia.USDC as `0x${string}`;
  if (chainId === 84532) return CONTRACTS.baseSepolia.USDC as `0x${string}`;
  return null;
}
