import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, baseSepolia, base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "AgentLeash",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [sepolia, baseSepolia, base],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});

export const SUPPORTED_CHAINS = {
  sepolia: {
    id: sepolia.id,
    name: "Sepolia",
    explorer: "https://sepolia.etherscan.io",
  },
  baseSepolia: {
    id: baseSepolia.id,
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
  },
  base: {
    id: base.id,
    name: "Base",
    explorer: "https://basescan.org",
  },
};
