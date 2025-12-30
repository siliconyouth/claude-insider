"use client";

/**
 * Security Query Hooks
 *
 * TanStack Query hooks for the Security management dashboard.
 * Handles stats, logs, visitors, honeypots, and settings.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, dashboardMutator, STALE_TIMES } from "..";
import { toast } from "@/components/toast";
import type { SecurityStatsData } from "@/components/dashboard/security";
import type { HoneypotConfig, HoneypotResponseType } from "@/lib/honeypot";
import type { SecurityLogEntry } from "@/lib/security-logger";
import type { VisitorFingerprint } from "@/lib/fingerprint";

// ============================================
// TYPES
// ============================================

// Re-export imported types for convenience
export type { SecurityLogEntry, VisitorFingerprint };

export interface SecurityLogsResponse {
  success: boolean;
  logs: SecurityLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LogsFilters {
  page: number;
  limit?: number;
  severity?: string;
  eventType?: string;
  isBot?: boolean;
  honeypotServed?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Visitors types (uses imported VisitorFingerprint from @/lib/fingerprint)
export interface VisitorsResponse {
  success: boolean;
  visitors: VisitorFingerprint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VisitorsFilters {
  page: number;
  limit?: number;
  trustLevel?: string;
  isBlocked?: boolean;
  hasAccount?: boolean;
  search?: string;
}

// Honeypots types
export interface HoneypotsResponse {
  success: boolean;
  honeypots: HoneypotConfig[];
}

export interface CreateHoneypotInput {
  name: string;
  description?: string;
  pathPattern: string;
  method: string;
  priority: number;
  responseType: HoneypotResponseType;
  responseDelayMs: number;
  redirectUrl?: string;
  statusCode: number;
  targetBotsOnly: boolean;
  targetLowTrust: boolean;
  trustThreshold: number;
  enabled: boolean;
}

export interface UpdateHoneypotInput extends Partial<CreateHoneypotInput> {
  id: string;
}

// Settings types
export interface SecuritySetting {
  id: string;
  key: string;
  value: unknown;
  valueType: string;
  description: string | null;
  category: string;
}

export type GroupedSettings = Record<string, SecuritySetting[]>;

export interface SettingsResponse {
  success: boolean;
  settings: SecuritySetting[];
  grouped: GroupedSettings;
}

export interface UpdateSettingsInput {
  updates: Array<{ key: string; value: unknown }>;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch security statistics
 * Used by both Overview and Analytics pages
 */
export function useSecurityStats() {
  return useQuery({
    queryKey: queryKeys.security.stats,
    queryFn: () =>
      dashboardFetcher<SecurityStatsData & { success: boolean }>(
        "/api/dashboard/security/stats"
      ),
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Fetch security logs with filters and pagination
 */
export function useSecurityLogs(filters: LogsFilters) {
  const limit = filters.limit || 50;

  return useQuery({
    queryKey: queryKeys.security.logs(filters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        limit,
        offset: (filters.page - 1) * limit,
      };

      if (filters.severity) params.severity = filters.severity;
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.isBot !== undefined) params.isBot = filters.isBot;
      if (filters.honeypotServed !== undefined)
        params.honeypotServed = filters.honeypotServed;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      return dashboardFetcher<SecurityLogsResponse>(
        "/api/dashboard/security/logs",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch visitors with filters and pagination
 */
export function useSecurityVisitors(filters: VisitorsFilters) {
  const limit = filters.limit || 25;

  return useQuery({
    queryKey: queryKeys.security.visitors(filters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        limit,
        offset: (filters.page - 1) * limit,
        sortBy: "last_seen",
        sortOrder: "desc",
      };

      if (filters.trustLevel) params.trustLevel = filters.trustLevel;
      if (filters.isBlocked !== undefined) params.isBlocked = filters.isBlocked;
      if (filters.hasAccount !== undefined) params.hasAccount = filters.hasAccount;
      if (filters.search) params.search = filters.search;

      return dashboardFetcher<VisitorsResponse>(
        "/api/dashboard/security/visitors",
        params
      );
    },
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch honeypots list
 */
export function useHoneypotsList() {
  return useQuery({
    queryKey: queryKeys.security.honeypots,
    queryFn: () =>
      dashboardFetcher<HoneypotsResponse>("/api/dashboard/security/honeypots"),
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Fetch security settings (grouped by category)
 */
export function useSecuritySettings() {
  return useQuery({
    queryKey: queryKeys.security.settings,
    queryFn: () =>
      dashboardFetcher<SettingsResponse>("/api/dashboard/security/settings"),
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Block a visitor
 */
export function useBlockVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitorId,
      reason,
    }: {
      visitorId: string;
      reason?: string;
    }) => {
      return dashboardMutator<{ success: boolean }>(
        "/api/dashboard/security/visitors",
        "PATCH",
        { visitorId, action: "block", reason }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.all });
      toast.success("Success", "Visitor blocked");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to block visitor");
    },
  });
}

/**
 * Unblock a visitor
 */
export function useUnblockVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitorId: string) => {
      return dashboardMutator<{ success: boolean }>(
        "/api/dashboard/security/visitors",
        "PATCH",
        { visitorId, action: "unblock" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.all });
      toast.success("Success", "Visitor unblocked");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to unblock visitor");
    },
  });
}

/**
 * Create a new honeypot
 */
export function useCreateHoneypot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHoneypotInput) => {
      return dashboardMutator<{ success: boolean; honeypot: HoneypotConfig }>(
        "/api/dashboard/security/honeypots",
        "POST",
        input
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.honeypots });
      toast.success("Success", "Honeypot created");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to create honeypot");
    },
  });
}

/**
 * Update an existing honeypot
 */
export function useUpdateHoneypot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateHoneypotInput) => {
      return dashboardMutator<{ success: boolean }>(
        "/api/dashboard/security/honeypots",
        "PATCH",
        input
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.honeypots });
      toast.success("Success", "Honeypot updated");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to update honeypot");
    },
  });
}

/**
 * Toggle honeypot enabled status
 */
export function useToggleHoneypot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }) => {
      return dashboardMutator<{ success: boolean }>(
        "/api/dashboard/security/honeypots",
        "PATCH",
        { id, enabled }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.honeypots });
      toast.success(
        "Success",
        variables.enabled ? "Honeypot enabled" : "Honeypot disabled"
      );
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to update honeypot");
    },
  });
}

/**
 * Delete a honeypot
 */
export function useDeleteHoneypot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return dashboardMutator<{ success: boolean }>(
        `/api/dashboard/security/honeypots?id=${id}`,
        "DELETE"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.honeypots });
      toast.success("Success", "Honeypot deleted");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to delete honeypot");
    },
  });
}

/**
 * Update security settings (batch)
 */
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      return dashboardMutator<{ success: boolean; updated: number }>(
        "/api/dashboard/security/settings",
        "PATCH",
        input
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.settings });
      toast.success("Success", `${data.updated} setting(s) updated`);
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to update settings");
    },
  });
}

/**
 * Export security logs
 */
export function useExportSecurityLogs() {
  return useMutation({
    mutationFn: async (filters: Omit<LogsFilters, "page" | "limit">) => {
      const params = new URLSearchParams();
      params.set("format", "csv");
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.eventType) params.set("eventType", filters.eventType);
      if (filters.isBot) params.set("isBot", "true");
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await fetch(
        `/api/dashboard/security/logs/export?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to export logs");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Success", "Logs exported successfully");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to export logs");
    },
  });
}
