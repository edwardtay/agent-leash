import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, baseSepolia } from "wagmi/chains";
import { SEPOLIA_RPC, BASE_SEPOLIA_RPC, CHAINS } from "./chains";

export const config = getDefaultConfig({
  appName: "AgentLeash",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [sepolia, baseSepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
  },
});

// Re-export CHAINS for convenience
export { CHAINS };
