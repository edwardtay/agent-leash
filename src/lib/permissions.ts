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
  agentWallet?: string;
  createdAt: number;
  expiry: number;
  isRevoked?: boolean;
  revokedAt?: number;
}

export interface StoredExecution {
  hash: string;
  timestamp: number;
  amount: string;
  recipient?: string;
  agentWallet?: string;
}

export interface PeriodUtilization {
  periodStart: number;
  periodEnd: number;
  used: number;
  allowed: number;
  percentage: number;
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
  currentPeriod: PeriodUtilization;
  expiryWarning: "none" | "week" | "day" | "critical";
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
  // The permission response structure varies - try multiple paths
  let granteeAddress = permission.agentWallet;
  
  if (!granteeAddress) {
    // Try to extract from permission response - check various structures
    const permData = permission.permission;
    if (Array.isArray(permData) && permData[0]) {
      // Structure: permission: [{ signer: { data: { address } } }]
      granteeAddress = permData[0]?.signer?.data?.address;
    } else if (permData?.signer?.data?.address) {
      // Structure: permission: { signer: { data: { address } } }
      granteeAddress = permData.signer.data.address;
    }
  }
  
  // Also check config for agentWallet as another fallback (cast to any for flexibility)
  if (!granteeAddress && (permission.config as any)?.agentWallet) {
    granteeAddress = (permission.config as any).agentWallet;
  }
  
  granteeAddress = granteeAddress || "Unknown";
  
  // Debug log for troubleshooting
  console.log(`Permission health calc - agentWallet: ${permission.agentWallet}, extracted: ${granteeAddress}`);

  const periodsElapsed = Math.floor(timeElapsed / permission.config.periodDuration);
  const expectedSpent = periodsElapsed * parseFloat(permission.config.amountPerPeriod || "0");

  // Filter executions for this specific permission/agent
  const permissionExecutions = executions.filter(
    (e) => {
      const inTimeRange = e.timestamp >= permission.createdAt * 1000 && e.timestamp <= permission.expiry * 1000;
      const matchesAgent = !e.agentWallet || e.agentWallet.toLowerCase() === granteeAddress.toLowerCase();
      return inTimeRange && matchesAgent;
    }
  );
  const executionCount = permissionExecutions.length;
  const totalExecuted = permissionExecutions.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const utilizationRate = expectedSpent > 0 ? (totalExecuted / expectedSpent) * 100 : 0;

  // Calculate current period utilization
  const periodDuration = permission.config.periodDuration;
  const currentPeriodIndex = Math.floor(timeElapsed / periodDuration);
  const currentPeriodStart = permission.createdAt + (currentPeriodIndex * periodDuration);
  const currentPeriodEnd = currentPeriodStart + periodDuration;
  const allowedPerPeriod = parseFloat(permission.config.amountPerPeriod || "0");
  
  const currentPeriodExecutions = permissionExecutions.filter(
    (e) => e.timestamp >= currentPeriodStart * 1000 && e.timestamp < currentPeriodEnd * 1000
  );
  const usedThisPeriod = currentPeriodExecutions.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const currentPeriod: PeriodUtilization = {
    periodStart: currentPeriodStart,
    periodEnd: currentPeriodEnd,
    used: usedThisPeriod,
    allowed: allowedPerPeriod,
    percentage: allowedPerPeriod > 0 ? (usedThisPeriod / allowedPerPeriod) * 100 : 0,
  };

  // Expiry warning levels
  let expiryWarning: "none" | "week" | "day" | "critical" = "none";
  if (timeRemaining <= 0) {
    expiryWarning = "critical";
  } else if (timeRemaining < 86400) { // < 1 day
    expiryWarning = "critical";
  } else if (timeRemaining < 86400 * 2) { // < 2 days
    expiryWarning = "day";
  } else if (timeRemaining < 86400 * 7) { // < 7 days
    expiryWarning = "week";
  }

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
    currentPeriod,
    expiryWarning,
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

/**
 * Get executions for a specific agent
 */
export function getAgentExecutions(agentWallet: string): StoredExecution[] {
  const executions = getExecutions();
  return executions.filter(
    (e) => e.agentWallet?.toLowerCase() === agentWallet.toLowerCase()
  );
}

/**
 * Get permissions that are expiring soon (within days)
 */
export function getExpiringPermissions(withinDays: number = 7): PermissionWithHealth[] {
  const permissions = getPermissionsWithHealth();
  const threshold = withinDays * 86400;
  
  return permissions.filter(
    (p) => !p.isRevoked && p.timeRemaining > 0 && p.timeRemaining < threshold
  );
}

/**
 * Check if any permissions need attention (expiring or over-utilized)
 */
export function getPermissionAlerts(): { type: "expiring" | "overused"; permission: PermissionWithHealth }[] {
  const permissions = getPermissionsWithHealth();
  const alerts: { type: "expiring" | "overused"; permission: PermissionWithHealth }[] = [];
  
  permissions.forEach((p) => {
    if (p.isRevoked || p.timeRemaining <= 0) return;
    
    if (p.expiryWarning === "critical" || p.expiryWarning === "day") {
      alerts.push({ type: "expiring", permission: p });
    }
    if (p.currentPeriod.percentage > 90) {
      alerts.push({ type: "overused", permission: p });
    }
  });
  
  return alerts;
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
