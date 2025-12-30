import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, baseSepolia } from "wagmi/chains";

const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com";
const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export const config = getDefaultConfig({
  appName: "AgentLeash",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [sepolia, baseSepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
  },
});

export const SUPPORTED_CHAINS = {
  sepolia: {
    id: sepolia.id,
    name: "Sepolia",
    explorer: "https://sepolia.etherscan.io",
    rpc: SEPOLIA_RPC,
  },
  baseSepolia: {
    id: baseSepolia.id,
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    rpc: BASE_SEPOLIA_RPC,
  },
};
