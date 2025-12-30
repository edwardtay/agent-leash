import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "./config/wagmi";
import { SessionAccountProvider } from "./providers/SessionAccountProvider";
import App from "./App";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#F6851B",
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
        >
          <SessionAccountProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SessionAccountProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
