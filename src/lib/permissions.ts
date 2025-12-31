/**
 * AgentLeash - Permission Data Service
 * Reads actual granted permissions from localStorage
 */

export interface StoredPermission {
  permission: any;
  config: {
    token: string;
    amountPerPeriod: string;
    periodDuration: number;
    durationDays: number;
    permissionType?: "periodic" | "stream";
  };
  createdAt: number;
  expiry: number;
  isRevoked?: boolean;
  revokedAt?: number;
}

export interface StoredExecution {
  hash: string;
  timestamp: number;
  amount: string;
}

export interface PermissionWithHealth extends StoredPermission {
  id: string;
  healthScore: number;
  status: "healthy" | "warning" | "critical" | "expired" | "revoked";
  timeRemaining: number;
  utilizationRate: number;
  executionCount: number;
  totalExecuted: number;
  granteeAddress: string;
}

export function getPermissions(): StoredPermission[] {
  try {
    return JSON.parse(localStorage.getItem("leash_permissions") || "[]");
  } catch {
    return [];
  }
}

export function getExecutions(): StoredExecution[] {
  try {
    return JSON.parse(localStorage.getItem("leash_executions") || "[]");
  } catch {
    return [];
  }
}

export function calculatePermissionHealth(
  permission: StoredPermission,
  executions: StoredExecution[]
): PermissionWithHealth {
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = Math.max(0, permission.expiry - now);
  const totalDuration = permission.expiry - permission.createdAt;
  const timeElapsed = totalDuration - timeRemaining;

  // Use stored agentWallet first, fallback to extracting from permission response
  const granteeAddress = (permission as any).agentWallet || 
    permission.permission?.[0]?.signer?.data?.address || 
    "Unknown";

  const periodsElapsed = Math.floor(timeElapsed / permission.config.periodDuration);
  const expectedSpent = periodsElapsed * parseFloat(permission.config.amountPerPeriod || "0");

  const permissionExecutions = executions.filter(
    (e) => e.timestamp >= permission.createdAt * 1000 && e.timestamp <= permission.expiry * 1000
  );
  const executionCount = permissionExecutions.length;
  const totalExecuted = permissionExecutions.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const utilizationRate = expectedSpent > 0 ? (totalExecuted / expectedSpent) * 100 : 0;

  let status: PermissionWithHealth["status"];
  if (permission.isRevoked) {
    status = "revoked";
  } else if (timeRemaining <= 0) {
    status = "expired";
  } else if (utilizationRate > 150 || timeRemaining < 3600) {
    status = "critical";
  } else if (utilizationRate > 100 || timeRemaining < 86400) {
    status = "warning";
  } else {
    status = "healthy";
  }

  let healthScore = 100;
  if (timeRemaining < 86400) healthScore -= 30;
  else if (timeRemaining < 86400 * 7) healthScore -= 10;
  if (utilizationRate > 150) healthScore -= 40;
  else if (utilizationRate > 100) healthScore -= 20;
  if (permission.isRevoked) healthScore = 0;
  if (timeRemaining <= 0) healthScore = Math.min(healthScore, 20);
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    ...permission,
    id: `${permission.createdAt}-${granteeAddress.slice(-6)}`,
    healthScore,
    status,
    timeRemaining,
    utilizationRate,
    executionCount,
    totalExecuted,
    granteeAddress,
  };
}

export function getPermissionsWithHealth(): PermissionWithHealth[] {
  const permissions = getPermissions();
  const executions = getExecutions();
  return permissions.map((p) => calculatePermissionHealth(p, executions));
}

export function getDashboardStats() {
  const permissions = getPermissionsWithHealth();
  const executions = getExecutions();
  const now = Math.floor(Date.now() / 1000);

  const activePermissions = permissions.filter((p) => !p.isRevoked && p.expiry > now);
  const revokedPermissions = permissions.filter((p) => p.isRevoked);
  const expiredPermissions = permissions.filter((p) => !p.isRevoked && p.expiry <= now);

  const healthyCount = activePermissions.filter((p) => p.status === "healthy").length;
  const warningCount = activePermissions.filter((p) => p.status === "warning").length;
  const criticalCount = activePermissions.filter((p) => p.status === "critical").length;

  const totalVolume = executions.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recentExecutions = executions.filter((e) => e.timestamp > last24h);
  const velocity = recentExecutions.length / 24;

  return {
    totalPermissions: permissions.length,
    activePermissions: activePermissions.length,
    revokedPermissions: revokedPermissions.length,
    expiredPermissions: expiredPermissions.length,
    totalExecutions: executions.length,
    totalVolume,
    healthyCount,
    warningCount,
    criticalCount,
    velocity,
    uniqueAgents: new Set(permissions.map((p) => p.granteeAddress)).size,
  };
}

/**
 * Mark permission as revoked locally.
 * Note: ERC-7715 permissions are expiry-based. True on-chain revoke requires
 * calling disableDelegation on the DelegationManager contract.
 */
export function revokePermissionLocal(index: number): boolean {
  try {
    const permissions = JSON.parse(localStorage.getItem("leash_permissions") || "[]");
    if (index >= 0 && index < permissions.length) {
      permissions[index].isRevoked = true;
      permissions[index].revokedAt = Math.floor(Date.now() / 1000);
      localStorage.setItem("leash_permissions", JSON.stringify(permissions));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get the delegation data needed for on-chain revoke
 */
export function getPermissionDelegation(index: number): any | null {
  try {
    const permissions = JSON.parse(localStorage.getItem("leash_permissions") || "[]");
    if (index >= 0 && index < permissions.length) {
      return permissions[index].permission;
    }
    return null;
  } catch {
    return null;
  }
}

// Legacy alias
export const revokePermission = revokePermissionLocal;

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
