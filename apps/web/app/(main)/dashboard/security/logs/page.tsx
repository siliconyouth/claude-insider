/**
 * Security Logs Page
 *
 * Browse and filter security events with pagination.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { LogTable, type LogFilters } from "@/components/dashboard/security";
import type { SecurityLogEntry } from "@/lib/security-logger";
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 50;

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({});

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });

      if (filters.eventType) params.set("eventType", filters.eventType);
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.isBot !== undefined) params.set("isBot", String(filters.isBot));
      if (filters.honeypotServed !== undefined)
        params.set("honeypotServed", String(filters.honeypotServed));

      const response = await fetch(`/api/dashboard/security/logs?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch logs");
      }

      setLogs(data.logs);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (newFilters: LogFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleExport = async () => {
    try {
      // Fetch all logs for export (up to 1000)
      const params = new URLSearchParams({ limit: "1000", offset: "0" });
      if (filters.eventType) params.set("eventType", filters.eventType);
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.isBot !== undefined) params.set("isBot", String(filters.isBot));

      const response = await fetch(`/api/dashboard/security/logs?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to export logs");
      }

      // Create CSV
      const headers = [
        "Time",
        "Event Type",
        "Severity",
        "Endpoint",
        "Method",
        "Request ID",
        "Visitor ID",
        "Is Bot",
        "Bot Name",
        "Honeypot Served",
        "IP Address",
      ];
      const rows = data.logs.map((log: SecurityLogEntry) => [
        new Date(log.createdAt).toISOString(),
        log.eventType,
        log.severity,
        log.endpoint || "",
        log.method || "",
        log.requestId,
        log.visitorId || "",
        log.isBot,
        log.botName || "",
        log.honeypotServed,
        log.ipAddress || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join(
        "\n"
      );

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/security"
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
              <DocumentTextIcon className="h-8 w-8 text-purple-500" />
              Security Logs
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Browse and filter security events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "hover:border-blue-500/50 transition-colors"
            )}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "bg-purple-500 text-white",
              "hover:bg-purple-600 transition-colors",
              "disabled:opacity-50"
            )}
          >
            <ArrowPathIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Log Table */}
      <LogTable
        logs={logs}
        total={total}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
