/**
 * Envio HyperIndex GraphQL Client
 * Queries indexed blockchain data for vault deposits
 */

const ENVIO_ENDPOINT = import.meta.env.VITE_ENVIO_ENDPOINT || "https://indexer.dev.hyperindex.xyz/2839683/v1/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function query<T>(queryString: string, retries = 2): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(ENVIO_ENDPOINT, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ query: queryString }),
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      const result: GraphQLResponse<T> = await response.json();
      
      if (result.errors) {
        console.error("Envio GraphQL errors:", result.errors);
        return null;
      }

      return result.data || null;
    } catch (error: any) {
      if (attempt === retries) {
        console.warn("Envio query failed:", error.message || "Network error");
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Check if Envio endpoint is available
 */
export async function checkEnvioHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(ENVIO_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query: "{ __typename }" }),
      signal: controller.signal,
      mode: "cors",
      credentials: "omit",
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return !!data?.data?.__typename;
  } catch {
    return false;
  }
}

export interface VaultDeposit {
  id: string;
  user: string;
  amount: string;
  txHash: string;
  chainId: number;
  blockNumber: number;
  timestamp: string;
}

/**
 * Get vault deposits from Envio indexer (multi-chain)
 */
export async function getVaultDeposits(limit = 20): Promise<VaultDeposit[]> {
  const result = await query<{ VaultDeposit: VaultDeposit[] }>(`
    query {
      VaultDeposit(
        order_by: { blockNumber: desc }
        limit: ${limit}
      ) {
        id
        user
        amount
        txHash
        chainId
        blockNumber
        timestamp
      }
    }
  `);

  return result?.VaultDeposit || [];
}
