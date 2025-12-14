"use client";

/**
 * Audit Logs Dashboard Page
 *
 * View and filter audit logs for admin accountability.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface AuditLog {
  id: string;
  action: string;
  collection: string;
  documentId: string;
  user: { id: string; email: string; name: string } | string;
  userSnapshot: { email: string; name: string; role: string };
  changes: Record<string, unknown>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
  };
  context: {
    reason: string;
    notes: string;
    affectedCount: number;
    sourceUrl: string;
  };
  status: "success" | "failed" | "partial";
  error?: { message: string; code: string };
  createdAt: string;
}

interface AuditStats {
  totalActions: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
  byUser: Array<{ userId: string; userName: string; count: number }>;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  reject: "Reject",
  discover: "Discover",
  scrape: "Scrape",
  analyze: "Analyze",
  import: "Import",
  export: "Export",
  login: "Login",
  logout: "Logout",
  settings: "Settings",
  bulk: "Bulk Op",
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  approve: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  reject: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  discover: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  scrape: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  analyze: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  import: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  bulk: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  login: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  partial: "text-amber-600 dark:text-amber-400",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    status: "",
    collection: "",
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        includeStats: "true",
      });

      if (filters.action) params.set("action", filters.action);
      if (filters.status) params.set("status", filters.status);
      if (filters.collection) params.set("collection", filters.collection);

      const response = await fetch(`/api/admin/audit-logs?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setLogs(data.docs || []);
      setTotalPages(data.totalPages || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUserName = (log: AuditLog) => {
    if (log.userSnapshot?.name) return log.userSnapshot.name;
    if (typeof log.user === "object" && log.user?.name) return log.user.name;
    return "Unknown";
  };

  const getUserEmail = (log: AuditLog) => {
    if (log.userSnapshot?.email) return log.userSnapshot.email;
    if (typeof log.user === "object" && log.user?.email) return log.user.email;
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track all admin actions for accountability
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalActions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Actions (7d)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.byStatus?.success || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Successful
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.byStatus?.failed || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Failed
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.byUser?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Users
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
        <select
          value={filters.action}
          onChange={(e) => {
            setFilters({ ...filters, action: e.target.value });
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="partial">Partial</option>
        </select>

        <select
          value={filters.collection}
          onChange={(e) => {
            setFilters({ ...filters, collection: e.target.value });
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Collections</option>
          <option value="resources">Resources</option>
          <option value="resource-discovery-queue">Discovery Queue</option>
          <option value="resource-sources">Sources</option>
        </select>

        <button
          onClick={() => {
            setFilters({ action: "", status: "", collection: "" });
            setPage(1);
          }}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading logs...</p>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && !error && (
        <div className="rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#262626]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                              ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getUserName(log)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getUserEmail(log)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {log.collection || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-sm font-medium", STATUS_COLORS[log.status])}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {log.context?.notes || log.context?.sourceUrl || log.documentId || "-"}
                        </td>
                      </tr>
                      {/* Expanded Details */}
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-[#0a0a0a]">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                  Metadata
                                </h4>
                                <dl className="space-y-1 text-gray-600 dark:text-gray-400">
                                  {log.metadata?.endpoint && (
                                    <div>
                                      <dt className="inline font-medium">Endpoint:</dt>{" "}
                                      <dd className="inline">{log.metadata.endpoint}</dd>
                                    </div>
                                  )}
                                  {log.metadata?.method && (
                                    <div>
                                      <dt className="inline font-medium">Method:</dt>{" "}
                                      <dd className="inline">{log.metadata.method}</dd>
                                    </div>
                                  )}
                                  {log.metadata?.ipAddress && (
                                    <div>
                                      <dt className="inline font-medium">IP:</dt>{" "}
                                      <dd className="inline">{log.metadata.ipAddress}</dd>
                                    </div>
                                  )}
                                  {log.metadata?.duration && (
                                    <div>
                                      <dt className="inline font-medium">Duration:</dt>{" "}
                                      <dd className="inline">{log.metadata.duration}ms</dd>
                                    </div>
                                  )}
                                </dl>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                  Context
                                </h4>
                                <dl className="space-y-1 text-gray-600 dark:text-gray-400">
                                  {log.documentId && (
                                    <div>
                                      <dt className="inline font-medium">Document ID:</dt>{" "}
                                      <dd className="inline font-mono text-xs">{log.documentId}</dd>
                                    </div>
                                  )}
                                  {log.context?.reason && (
                                    <div>
                                      <dt className="inline font-medium">Reason:</dt>{" "}
                                      <dd className="inline">{log.context.reason}</dd>
                                    </div>
                                  )}
                                  {log.context?.affectedCount && (
                                    <div>
                                      <dt className="inline font-medium">Affected:</dt>{" "}
                                      <dd className="inline">{log.context.affectedCount} items</dd>
                                    </div>
                                  )}
                                  {log.error?.message && (
                                    <div className="text-red-600 dark:text-red-400">
                                      <dt className="inline font-medium">Error:</dt>{" "}
                                      <dd className="inline">{log.error.message}</dd>
                                    </div>
                                  )}
                                </dl>
                              </div>
                              {log.changes && Object.keys(log.changes).length > 0 && (
                                <div className="col-span-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    Changes
                                  </h4>
                                  <pre className="p-3 rounded-lg bg-gray-100 dark:bg-[#111111] text-xs overflow-x-auto">
                                    {JSON.stringify(log.changes, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626] flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 dark:border-[#262626] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 dark:border-[#262626] disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
