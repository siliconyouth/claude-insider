/**
 * Security Log Table
 *
 * Displays security logs with filtering and pagination.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { format } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type {
  SecurityLogEntry,
  SecurityEventType,
  SecuritySeverity,
} from "@/lib/security-logger";

interface LogTableProps {
  logs: SecurityLogEntry[];
  total: number;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: LogFilters) => void;
}

export interface LogFilters {
  eventType?: SecurityEventType;
  severity?: SecuritySeverity;
  isBot?: boolean;
  honeypotServed?: boolean;
  search?: string;
}

const eventTypes: SecurityEventType[] = [
  "request",
  "bot_detected",
  "honeypot_served",
  "rate_limited",
  "blocked",
  "auth_attempt",
  "auth_success",
  "auth_failure",
  "visitor_blocked",
  "visitor_unblocked",
];

const severities: SecuritySeverity[] = [
  "debug",
  "info",
  "warning",
  "error",
  "critical",
];

const severityColors: Record<SecuritySeverity, string> = {
  debug: "text-gray-400 bg-gray-400/10",
  info: "text-blue-400 bg-blue-400/10",
  warning: "text-amber-400 bg-amber-400/10",
  error: "text-red-400 bg-red-400/10",
  critical: "text-rose-500 bg-rose-500/10 font-semibold",
};

export function LogTable({
  logs,
  total,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onFilterChange,
}: LogTableProps) {
  const [filters, setFilters] = useState<LogFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = (key: keyof LogFilters, value: unknown) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 transition-colors",
            showFilters && "border-blue-500 bg-blue-500/10"
          )}
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </button>

        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by request ID or visitor ID..."
            className={cn(
              "w-full rounded-lg py-2 pl-10 pr-4 text-sm",
              "bg-gray-50 dark:bg-[#1a1a1a]",
              "border border-gray-200 dark:border-[#262626]",
              "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            )}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg bg-gray-50 p-4 dark:bg-[#1a1a1a]">
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#111111]"
            onChange={(e) => handleFilterChange("eventType", e.target.value as SecurityEventType)}
            value={filters.eventType || ""}
          >
            <option value="">All Events</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#111111]"
            onChange={(e) => handleFilterChange("severity", e.target.value as SecuritySeverity)}
            value={filters.severity || ""}
          >
            <option value="">All Severities</option>
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#111111]"
            onChange={(e) => handleFilterChange("isBot", e.target.value === "" ? undefined : e.target.value === "true")}
            value={filters.isBot === undefined ? "" : String(filters.isBot)}
          >
            <option value="">All Traffic</option>
            <option value="true">Bots Only</option>
            <option value="false">Humans Only</option>
          </select>

          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#111111]"
            onChange={(e) => handleFilterChange("honeypotServed", e.target.value === "" ? undefined : e.target.value === "true")}
            value={filters.honeypotServed === undefined ? "" : String(filters.honeypotServed)}
          >
            <option value="">All Responses</option>
            <option value="true">Honeypot Served</option>
            <option value="false">Real Response</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#262626]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#262626]">
          <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Endpoint
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Request ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Bot
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-[#262626] dark:bg-[#111111]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {log.eventType.replace(/_/g, " ")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        severityColors[log.severity]
                      )}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm font-mono text-gray-500">
                    {log.endpoint || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-400">
                    {log.requestId.substring(0, 8)}...
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {log.isBot ? (
                      <span className="text-amber-500">
                        {log.isVerifiedBot ? "Verified Bot" : "Bot"}
                      </span>
                    ) : (
                      <span className="text-gray-400">Human</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, total)} of {total} logs
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={cn(
              "rounded-lg p-2",
              "border border-gray-200 dark:border-[#262626]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:border-blue-500/50 transition-colors"
            )}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              "rounded-lg p-2",
              "border border-gray-200 dark:border-[#262626]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:border-blue-500/50 transition-colors"
            )}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
