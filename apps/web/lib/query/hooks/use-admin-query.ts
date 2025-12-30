"use client";

/**
 * Admin Query Hooks
 *
 * TanStack Query hooks for Admin dashboard pages:
 * - Banned users & appeals
 * - Notifications management
 * - Donation analytics
 * - Data exports
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { dashboardFetcher, STALE_TIMES } from "..";
import { toast } from "@/components/toast";
import {
  getBannedUsers,
  getBanAppeals,
  reviewBanAppeal,
  type BannedUser,
  type BanAppeal,
} from "@/app/actions/ban-appeals";
import {
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  scheduleAdminNotification,
  cancelAdminNotification,
  deleteAdminNotification,
  sendVersionNotification,
  type AdminNotification,
  type AdminNotificationStatus,
  type CreateAdminNotificationParams,
} from "@/app/actions/admin-notifications";
import {
  createExportJob,
  getExportJobs,
  getExportDownloadUrl,
  cancelExportJob,
  deleteExportJob,
  type ExportJob,
  type ExportType,
} from "@/app/actions/admin-export";
import type { ExportFormat } from "@/lib/export-formats";
import type { DonorBadgeTier } from "@/lib/donations/types";

// ============================================
// TYPES
// ============================================

// Re-export types for convenience
export type {
  BannedUser,
  BanAppeal,
  AdminNotification,
  AdminNotificationStatus,
  CreateAdminNotificationParams,
  ExportJob,
  ExportType,
};

// Donations types
export interface DonationStats {
  overview: {
    total_raised: number;
    completed_donations: number;
    pending_donations: number;
    failed_donations: number;
    unique_donors: number;
    recurring_donations: number;
    average_donation: number;
    largest_donation: number;
  };
  periods: {
    today: { amount: number; count: number };
    week: { amount: number; count: number };
    month: { amount: number; count: number };
  };
  trend: Array<{ date: string; amount: number; count: number }>;
  by_method: Record<string, { amount: number; count: number }>;
  by_tier: Array<{ tier: DonorBadgeTier; count: number; total_amount: number }>;
  recent_donations: Array<{
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    donor_name: string;
    donor_email?: string | null;
    is_anonymous: boolean;
    message: string | null;
    created_at: string;
  }>;
  pending_transfers: Array<{
    id: string;
    amount: number;
    currency: string;
    donor_name: string;
    donor_email: string;
    message: string | null;
    created_at: string;
  }>;
}

// ============================================
// BANNED USERS HOOKS
// ============================================

/**
 * Fetch banned users list
 */
export function useBannedUsers() {
  return useQuery({
    queryKey: queryKeys.admin.bannedUsers,
    queryFn: async () => {
      const result = await getBannedUsers();
      if (result.error) {
        throw new Error(result.error);
      }
      return {
        users: result.users || [],
        total: result.total || 0,
      };
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Fetch ban appeals with optional status filter
 */
export function useBanAppeals(status?: "all" | "pending" | "approved" | "rejected") {
  return useQuery({
    queryKey: queryKeys.admin.banAppeals(status),
    queryFn: async () => {
      const result = await getBanAppeals({
        status: status === "all" ? "all" : status,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.appeals || [];
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Review a ban appeal (approve or reject)
 */
export function useReviewBanAppeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appealId,
      decision,
      reviewNotes,
      responseMessage,
    }: {
      appealId: string;
      decision: "approved" | "rejected";
      reviewNotes?: string;
      responseMessage?: string;
    }) => {
      const result = await reviewBanAppeal(appealId, decision, {
        reviewNotes,
        responseMessage,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success(
        "Success",
        variables.decision === "approved"
          ? "Appeal approved! User has been unbanned."
          : "Appeal rejected."
      );
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to review appeal");
    },
  });
}

// Note: useUnbanUser is exported from use-users-query.ts
// Use it for unbanning users in the banned users page

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

/**
 * Fetch admin notifications with optional status filter
 */
export function useAdminNotifications(status?: AdminNotificationStatus) {
  return useQuery({
    queryKey: queryKeys.admin.notifications(status),
    queryFn: async () => {
      const result = await getAdminNotifications({
        status,
        limit: 50,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return {
        notifications: result.data || [],
        total: result.total || 0,
      };
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Create a new admin notification
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAdminNotificationParams) => {
      const result = await createAdminNotification(params);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() });
      toast.success("Success", "Notification created");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to create notification");
    },
  });
}

/**
 * Update an existing notification
 */
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      params,
    }: {
      id: string;
      params: CreateAdminNotificationParams;
    }) => {
      const result = await updateAdminNotification(id, params);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() });
      toast.success("Success", "Notification updated");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to update notification");
    },
  });
}

/**
 * Schedule or send a notification immediately
 */
export function useScheduleNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      immediate,
    }: {
      id: string;
      immediate: boolean;
    }) => {
      const result = await scheduleAdminNotification(id, immediate);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() });
      toast.success(
        "Success",
        variables.immediate ? "Notification queued for sending" : "Notification scheduled"
      );
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to schedule notification");
    },
  });
}

/**
 * Cancel a scheduled notification
 */
export function useCancelNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await cancelAdminNotification(id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() });
      toast.success("Success", "Notification cancelled");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to cancel notification");
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAdminNotification(id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() });
      toast.success("Success", "Notification deleted");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to delete notification");
    },
  });
}

/**
 * Send a version update notification
 */
export function useSendVersionNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      version,
      title,
      highlights,
    }: {
      version: string;
      title: string;
      highlights?: string[];
    }) => {
      const result = await sendVersionNotification({ version, title, highlights });
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications() });
      toast.success(
        "Success",
        `Version update notification sent to ${data.notifiedCount} users!`
      );
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to send version notification");
    },
  });
}

// ============================================
// DONATIONS HOOKS
// ============================================

/**
 * Fetch donation statistics and analytics
 */
export function useDonationStats() {
  return useQuery({
    queryKey: queryKeys.admin.donations,
    queryFn: () => dashboardFetcher<DonationStats>("/api/dashboard/donations"),
    staleTime: STALE_TIMES.dashboard,
  });
}

/**
 * Confirm or reject a pending bank transfer
 */
export function useConfirmTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      donationId,
      action,
    }: {
      donationId: string;
      action: "confirm" | "reject";
    }) => {
      const response = await fetch("/api/dashboard/donations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donation_id: donationId, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process transfer");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.donations });
      toast.success(
        "Success",
        variables.action === "confirm" ? "Transfer confirmed!" : "Transfer rejected"
      );
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to process transfer");
    },
  });
}

/**
 * Resend thank you email for a donation
 */
export function useResendThankYou() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      donationId,
      donorEmail,
      donorName,
    }: {
      donationId: string;
      donorEmail: string;
      donorName?: string;
    }) => {
      const response = await fetch("/api/dashboard/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend_thank_you",
          donation_id: donationId,
          donor_email: donorEmail,
          donor_name: donorName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.donations });
      toast.success("Success", `Thank you email queued for ${variables.donorEmail}`);
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to send email");
    },
  });
}

// ============================================
// EXPORTS HOOKS
// ============================================

/**
 * Fetch export jobs list
 */
export function useExportJobs() {
  return useQuery({
    queryKey: queryKeys.admin.exports,
    queryFn: async () => {
      const result = await getExportJobs(1, 50);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.jobs || [];
    },
    staleTime: STALE_TIMES.dashboard,
    // Auto-refetch every 5 seconds if there are active jobs
    refetchInterval: (query) => {
      const jobs = query.state.data as ExportJob[] | undefined;
      const hasActiveJobs = jobs?.some(
        (j) => j.status === "pending" || j.status === "processing"
      );
      return hasActiveJobs ? 5000 : false;
    },
  });
}

/**
 * Create a new export job
 */
export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exportType,
      format,
      options,
    }: {
      exportType: ExportType;
      format: ExportFormat;
      options?: { anonymize?: boolean };
    }) => {
      const result = await createExportJob({ exportType, format, options });
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.exports });
      toast.success("Success", "Export job created");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to create export");
    },
  });
}

/**
 * Get download URL for a completed export
 */
export function useGetExportDownloadUrl() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const result = await getExportDownloadUrl(jobId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.url;
    },
    onSuccess: (url) => {
      if (url) {
        window.open(url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to get download URL");
    },
  });
}

/**
 * Cancel an active export job
 */
export function useCancelExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const result = await cancelExportJob(jobId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.exports });
      toast.success("Success", "Export cancelled");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to cancel export");
    },
  });
}

/**
 * Delete an export job
 */
export function useDeleteExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const result = await deleteExportJob(jobId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.exports });
      toast.success("Success", "Export deleted");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message || "Failed to delete export");
    },
  });
}
