/**
 * Audit Logging Utilities
 *
 * Helper functions for creating audit log entries.
 * All admin actions should be logged for accountability.
 */

import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "discover"
  | "scrape"
  | "analyze"
  | "import"
  | "export"
  | "login"
  | "logout"
  | "settings"
  | "bulk";

export type AuditStatus = "success" | "failed" | "partial";

export interface AuditLogEntry {
  action: AuditAction;
  collection?: string;
  documentId?: string;
  userId: string | number;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    diff?: Record<string, { old: unknown; new: unknown }>;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    duration?: number;
    statusCode?: number;
  };
  context?: {
    reason?: string;
    notes?: string;
    affectedCount?: number;
    sourceUrl?: string;
  };
  status: AuditStatus;
  error?: {
    message?: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const payload = await getPayload({ config });

    // Convert userId to number for relationship field
    const userIdNum = typeof entry.userId === "string"
      ? parseInt(entry.userId, 10)
      : entry.userId;

    await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: "audit-logs" as any,
      data: {
        action: entry.action,
        collection: entry.collection,
        documentId: entry.documentId,
        user: isNaN(userIdNum) ? undefined : userIdNum,
        userSnapshot: {
          email: entry.userEmail,
          name: entry.userName,
          role: entry.userRole,
        },
        changes: entry.changes,
        metadata: entry.metadata,
        context: entry.context,
        status: entry.status,
        error: entry.error,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should never break the main flow
    console.error("[Audit] Failed to create audit log:", error);
  }
}

/**
 * Helper to extract request metadata
 */
export function extractRequestMetadata(request: Request): AuditLogEntry["metadata"] {
  const url = new URL(request.url);

  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined,
    userAgent: request.headers.get("user-agent") || undefined,
    endpoint: url.pathname,
    method: request.method,
  };
}

/**
 * Calculate diff between two objects
 */
export function calculateDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};

  // Get all unique keys
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const oldValue = before[key];
    const newValue = after[key];

    // Skip if values are equal
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    diff[key] = { old: oldValue, new: newValue };
  }

  return diff;
}

/**
 * Audit log wrapper for async operations
 * Automatically logs the operation and handles errors
 */
export async function withAuditLog<T>(
  entry: Omit<AuditLogEntry, "status" | "error">,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();

    await createAuditLog({
      ...entry,
      status: "success",
      metadata: {
        ...entry.metadata,
        duration: Date.now() - startTime,
        statusCode: 200,
      },
    });

    return result;
  } catch (error) {
    await createAuditLog({
      ...entry,
      status: "failed",
      metadata: {
        ...entry.metadata,
        duration: Date.now() - startTime,
        statusCode: 500,
      },
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    throw error;
  }
}

/**
 * Audit log for queue operations
 */
export async function auditQueueAction(
  action: "approve" | "reject",
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  queueItemId: string,
  resourceTitle: string,
  reason?: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action,
    collection: "resource-discovery-queue",
    documentId: queueItemId,
    userId,
    userEmail,
    userName,
    userRole,
    context: {
      reason,
      notes: `${action === "approve" ? "Approved" : "Rejected"}: ${resourceTitle}`,
    },
    metadata: request ? extractRequestMetadata(request) : undefined,
    status: "success",
  });
}

/**
 * Audit log for discovery operations
 */
export async function auditDiscovery(
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  sourceUrl: string,
  status: AuditStatus,
  affectedCount?: number,
  error?: Error,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: "discover",
    collection: "resource-discovery-queue",
    userId,
    userEmail,
    userName,
    userRole,
    context: {
      sourceUrl,
      affectedCount,
    },
    metadata: request ? extractRequestMetadata(request) : undefined,
    status,
    error: error
      ? {
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  });
}

/**
 * Audit log for bulk operations
 */
export async function auditBulkOperation(
  action: "approve" | "reject" | "delete",
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  affectedIds: string[],
  status: AuditStatus,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: "bulk",
    collection: "resource-discovery-queue",
    userId,
    userEmail,
    userName,
    userRole,
    context: {
      notes: `Bulk ${action} operation`,
      affectedCount: affectedIds.length,
    },
    changes: {
      after: { affectedIds },
    },
    metadata: request ? extractRequestMetadata(request) : undefined,
    status,
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  action?: AuditAction;
  userId?: string;
  collection?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{
  docs: unknown[];
  totalDocs: number;
  totalPages: number;
  page: number;
}> {
  const payload = await getPayload({ config });

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (filters.action) {
    where.action = { equals: filters.action };
  }
  if (filters.userId) {
    where.user = { equals: filters.userId };
  }
  if (filters.collection) {
    where.collection = { equals: filters.collection };
  }
  if (filters.status) {
    where.status = { equals: filters.status };
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.greater_than_equal = filters.startDate.toISOString();
    }
    if (filters.endDate) {
      where.createdAt.less_than_equal = filters.endDate.toISOString();
    }
  }

  const result = await payload.find({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: "audit-logs" as any,
    where: Object.keys(where).length > 0 ? where : undefined,
    page: filters.page || 1,
    limit: filters.limit || 50,
    sort: "-createdAt",
  });

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages ?? 1,
    page: result.page ?? 1,
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(days: number = 7): Promise<{
  totalActions: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
  byUser: Array<{ userId: string; userName: string; count: number }>;
}> {
  const payload = await getPayload({ config });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await payload.find({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: "audit-logs" as any,
    where: {
      createdAt: {
        greater_than_equal: startDate.toISOString(),
      },
    },
    limit: 10000, // Get all recent logs
  });

  const byAction: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byUserMap: Map<string, { userName: string; count: number }> = new Map();

  for (const doc of result.docs) {
    // Count by action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action = (doc as any).action as string;
    byAction[action] = (byAction[action] || 0) + 1;

    // Count by status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (doc as any).status as string;
    byStatus[status] = (byStatus[status] || 0) + 1;

    // Count by user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (doc as any).user?.toString() || "unknown";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userName = (doc as any).userSnapshot?.name || "Unknown";
    const userEntry = byUserMap.get(userId) || { userName, count: 0 };
    userEntry.count += 1;
    byUserMap.set(userId, userEntry);
  }

  // Convert user map to sorted array
  const byUser = Array.from(byUserMap.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 users

  return {
    totalActions: result.totalDocs,
    byAction,
    byStatus,
    byUser,
  };
}
