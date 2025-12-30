/**
 * Envio HyperIndex GraphQL Client
 * Queries indexed blockchain data for permission analytics
 */

const ENVIO_ENDPOINT = import.meta.env.VITE_ENVIO_ENDPOINT || "https://indexer.dev.hyperindex.xyz/120211b/v1/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function query<T>(queryString: string, variables?: Record<string, any>): Promise<T | null> {
  try {
    const response = await fetch(ENVIO_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryString, variables }),
    });

    const result: GraphQLResponse<T> = await response.json();
    
    if (result.errors) {
      console.error("Envio GraphQL errors:", result.errors);
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error("Envio query error:", error);
    return null;
  }
}

/**
 * Get recent executions for an agent wallet
 */
export async function getAgentExecutions(agentAddress: string, limit = 20) {
  const result = await query<{
    Execution: Array<{
      id: string;
      txHash: string;
      from: string;
      to: string;
      value: string;
      timestamp: number;
      blockNumber: number;
    }>;
  }>(`
    query GetExecutions($agent: String!, $limit: Int!) {
      Execution(
        where: { from: { _eq: $agent } }
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        txHash
        from
        to
        value
        timestamp
        blockNumber
      }
    }
  `, { agent: agentAddress.toLowerCase(), limit });

  return result?.Execution || [];
}

/**
 * Get permission grants for a user
 */
export async function getPermissionGrants(userAddress: string) {
  const result = await query<{
    Permission: Array<{
      id: string;
      grantor: string;
      grantee: string;
      permissionId: string;
      expiry: number;
      createdAt: number;
      isRevoked: boolean;
    }>;
  }>(`
    query GetPermissions($user: String!) {
      Permission(
        where: { grantor: { _eq: $user } }
        order_by: { createdAt: desc }
      ) {
        id
        grantor
        grantee
        permissionId
        expiry
        createdAt
        isRevoked
      }
    }
  `, { user: userAddress.toLowerCase() });

  return result?.Permission || [];
}

/**
 * Get spending snapshots for analytics
 */
export async function getSpendingSnapshots(agentAddress: string, days = 7) {
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  
  const result = await query<{
    SpendingSnapshot: Array<{
      id: string;
      agent: string;
      date: string;
      totalSpent: string;
      txCount: number;
    }>;
  }>(`
    query GetSnapshots($agent: String!, $since: Int!) {
      SpendingSnapshot(
        where: { 
          agent: { _eq: $agent },
          timestamp: { _gte: $since }
        }
        order_by: { timestamp: asc }
      ) {
        id
        agent
        date
        totalSpent
        txCount
      }
    }
  `, { agent: agentAddress.toLowerCase(), since });

  return result?.SpendingSnapshot || [];
}

/**
 * Get aggregated stats
 */
export async function getAggregatedStats(userAddress: string) {
  const result = await query<{
    Permission_aggregate: {
      aggregate: {
        count: number;
      };
    };
    Execution_aggregate: {
      aggregate: {
        count: number;
        sum: { value: string };
      };
    };
  }>(`
    query GetStats($user: String!) {
      Permission_aggregate(where: { grantor: { _eq: $user } }) {
        aggregate {
          count
        }
      }
      Execution_aggregate(where: { from: { _eq: $user } }) {
        aggregate {
          count
          sum {
            value
          }
        }
      }
    }
  `, { user: userAddress.toLowerCase() });

  return {
    totalPermissions: result?.Permission_aggregate?.aggregate?.count || 0,
    totalExecutions: result?.Execution_aggregate?.aggregate?.count || 0,
    totalVolume: result?.Execution_aggregate?.aggregate?.sum?.value || "0",
  };
}

/**
 * Check if Envio endpoint is available
 */
export async function checkEnvioHealth(): Promise<boolean> {
  try {
    const response = await fetch(ENVIO_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    return response.ok;
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

/**
 * Get daily stats from Envio indexer
 */
export async function getDailyStatsFromEnvio() {
  const result = await query<{ DailyStats: Array<{
    id: string;
    date: string;
    chainId: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalVolume: string;
  }> }>(`
    query {
      DailyStats(order_by: { date: desc }, limit: 14) {
        id
        date
        chainId
        totalDeposits
        totalWithdrawals
        totalVolume
      }
    }
  `);

  return result?.DailyStats || [];
}
