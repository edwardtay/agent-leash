/**
 * Deployed Contract Addresses
 * Update these after running script/deploy.sh
 */

export const CONTRACTS = {
  // Sepolia (chainId: 11155111)
  sepolia: {
    SimpleVault: "0x9acec7011519F89C59d9A595f9829bBb79Ed0d4b",
    AaveWrapper: "0xdb1acDc06b6b6Fb711EC111376F410954362f9BA", // Real Aave yield
    YieldVault: "0xcE338780004Ebf71Af391Eb1D5a593ef32C176D4",  // Unified interface
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    // Aave V3 addresses
    AavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
    aWETH: "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830",
  },
  // Base Sepolia (chainId: 84532)
  baseSepolia: {
    SimpleVault: "0x93fc90a3Fb7d8c15bbaF50bFCc612B26CA8E68c8",
    YieldVault: "0x78Efd0937058F3599Af03Fd496DB0eCB68d5c9Bb",   // Same interface as Sepolia
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
} as const;

export function getVaultAddress(chainId: number): `0x${string}` | null {
  if (chainId === 11155111) return CONTRACTS.sepolia.SimpleVault as `0x${string}`;
  if (chainId === 84532) return CONTRACTS.baseSepolia.SimpleVault as `0x${string}`;
  return null;
}

export function getAaveWrapperAddress(chainId: number): `0x${string}` | null {
  // Only available on Sepolia (Aave V3)
  if (chainId === 11155111) return CONTRACTS.sepolia.AaveWrapper as `0x${string}`;
  return null;
}

export function getYieldVaultAddress(chainId: number): `0x${string}` | null {
  if (chainId === 11155111) return CONTRACTS.sepolia.YieldVault as `0x${string}`;
  if (chainId === 84532) return CONTRACTS.baseSepolia.YieldVault as `0x${string}`;
  return null;
}

export function getUSDCAddress(chainId: number): `0x${string}` | null {
  if (chainId === 11155111) return CONTRACTS.sepolia.USDC as `0x${string}`;
  if (chainId === 84532) return CONTRACTS.baseSepolia.USDC as `0x${string}`;
  return null;
}
