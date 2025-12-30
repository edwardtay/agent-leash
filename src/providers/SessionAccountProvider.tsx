import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

interface SessionAccountContextType {
  sessionAccount: ReturnType<typeof privateKeyToAccount> | null;
  isReady: boolean;
  regenerateAccount: () => void;
}

const SessionAccountContext = createContext<SessionAccountContextType>({
  sessionAccount: null,
  isReady: false,
  regenerateAccount: () => {},
});

export const useSessionAccount = () => useContext(SessionAccountContext);

export const SessionAccountProvider = ({ children }: { children: ReactNode }) => {
  const [sessionAccount, setSessionAccount] = useState<ReturnType<typeof privateKeyToAccount> | null>(null);
  const [isReady, setIsReady] = useState(false);

  const createSessionAccount = () => {
    const stored = localStorage.getItem("session_private_key");
    let privateKey: `0x${string}`;

    if (stored) {
      privateKey = stored as `0x${string}`;
    } else {
      privateKey = generatePrivateKey();
      localStorage.setItem("session_private_key", privateKey);
    }

    const account = privateKeyToAccount(privateKey);
    setSessionAccount(account);
    setIsReady(true);
  };

  const regenerateAccount = () => {
    const privateKey = generatePrivateKey();
    localStorage.setItem("session_private_key", privateKey);
    const account = privateKeyToAccount(privateKey);
    setSessionAccount(account);
  };

  useEffect(() => {
    createSessionAccount();
  }, []);

  return (
    <SessionAccountContext.Provider value={{ sessionAccount, isReady, regenerateAccount }}>
      {children}
    </SessionAccountContext.Provider>
  );
};
