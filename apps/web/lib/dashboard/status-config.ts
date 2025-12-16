/**
 * Dashboard Status Configuration
 *
 * Centralized status/color mappings used across dashboard pages.
 * Follows the design system color conventions.
 */

import type { StatusConfig, StatusStyle } from "./types";

// =============================================================================
// MODERATION STATUS (Comments, Reports, Suggestions)
// =============================================================================

export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export const MODERATION_STATUS: StatusConfig<ModerationStatus> = {
  pending: {
    bg: "bg-yellow-900/30",
    text: "text-yellow-400",
    label: "Pending",
    border: "border-yellow-500/30",
  },
  approved: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Approved",
    border: "border-emerald-500/30",
  },
  rejected: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Rejected",
    border: "border-red-500/30",
  },
  flagged: {
    bg: "bg-orange-900/30",
    text: "text-orange-400",
    label: "Flagged",
    border: "border-orange-500/30",
  },
};

// =============================================================================
// FEEDBACK STATUS
// =============================================================================

export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed" | "wont_fix";

export const FEEDBACK_STATUS: StatusConfig<FeedbackStatus> = {
  open: {
    bg: "bg-yellow-900/30",
    text: "text-yellow-400",
    label: "Open",
    border: "border-yellow-500/30",
  },
  in_progress: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    label: "In Progress",
    border: "border-blue-500/30",
  },
  resolved: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Resolved",
    border: "border-emerald-500/30",
  },
  closed: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "Closed",
    border: "border-gray-600",
  },
  wont_fix: {
    bg: "bg-gray-800",
    text: "text-gray-500",
    label: "Won't Fix",
    border: "border-gray-600",
  },
};

// =============================================================================
// FEEDBACK TYPE
// =============================================================================

export type FeedbackType = "bug" | "feature" | "general";

export const FEEDBACK_TYPE: StatusConfig<FeedbackType> = {
  bug: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Bug",
    border: "border-red-500/30",
  },
  feature: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Feature",
    border: "border-emerald-500/30",
  },
  general: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    label: "General",
    border: "border-blue-500/30",
  },
};

// =============================================================================
// SEVERITY
// =============================================================================

export type Severity = "low" | "medium" | "high" | "critical";

export const SEVERITY: StatusConfig<Severity> = {
  low: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "Low",
    border: "border-gray-600",
  },
  medium: {
    bg: "bg-yellow-900/30",
    text: "text-yellow-400",
    label: "Medium",
    border: "border-yellow-500/30",
  },
  high: {
    bg: "bg-orange-900/30",
    text: "text-orange-400",
    label: "High",
    border: "border-orange-500/30",
  },
  critical: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Critical",
    border: "border-red-500/30",
  },
};

// =============================================================================
// REPORT STATUS
// =============================================================================

export type ReportStatus = "pending" | "investigating" | "action_taken" | "dismissed";

export const REPORT_STATUS: StatusConfig<ReportStatus> = {
  pending: {
    bg: "bg-yellow-900/30",
    text: "text-yellow-400",
    label: "Pending",
    border: "border-yellow-500/30",
  },
  investigating: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    label: "Investigating",
    border: "border-blue-500/30",
  },
  action_taken: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Action Taken",
    border: "border-emerald-500/30",
  },
  dismissed: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "Dismissed",
    border: "border-gray-600",
  },
};

// =============================================================================
// NOTIFICATION STATUS
// =============================================================================

export type NotificationStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export const NOTIFICATION_STATUS: StatusConfig<NotificationStatus> = {
  draft: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "Draft",
    border: "border-gray-600",
  },
  scheduled: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    label: "Scheduled",
    border: "border-blue-500/30",
  },
  sending: {
    bg: "bg-cyan-900/30",
    text: "text-cyan-400",
    label: "Sending",
    border: "border-cyan-500/30",
  },
  sent: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Sent",
    border: "border-emerald-500/30",
  },
  failed: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Failed",
    border: "border-red-500/30",
  },
};

// =============================================================================
// BETA APPLICATION STATUS
// =============================================================================

export type BetaApplicationStatus = "pending" | "approved" | "rejected";

export const BETA_APPLICATION_STATUS: StatusConfig<BetaApplicationStatus> = {
  pending: {
    bg: "bg-yellow-900/30",
    text: "text-yellow-400",
    label: "Pending Review",
    border: "border-yellow-500/30",
  },
  approved: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Approved",
    border: "border-emerald-500/30",
  },
  rejected: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Rejected",
    border: "border-red-500/30",
  },
};

// =============================================================================
// RESOURCE STATUS
// =============================================================================

export type ResourceStatus = "pending" | "approved" | "rejected" | "archived";

export const RESOURCE_STATUS: StatusConfig<ResourceStatus> = {
  pending: {
    bg: "bg-yellow-900/30",
    text: "text-yellow-400",
    label: "Pending",
    border: "border-yellow-500/30",
  },
  approved: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Approved",
    border: "border-emerald-500/30",
  },
  rejected: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Rejected",
    border: "border-red-500/30",
  },
  archived: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "Archived",
    border: "border-gray-600",
  },
};

// =============================================================================
// USER ROLE COLORS
// =============================================================================

export type UserRole = "user" | "editor" | "moderator" | "admin" | "superadmin" | "ai_assistant";

export const USER_ROLE: StatusConfig<UserRole> = {
  user: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "User",
    border: "border-gray-600",
  },
  editor: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    label: "Editor",
    border: "border-blue-500/30",
  },
  moderator: {
    bg: "bg-violet-900/30",
    text: "text-violet-400",
    label: "Moderator",
    border: "border-violet-500/30",
  },
  admin: {
    bg: "bg-amber-900/30",
    text: "text-amber-400",
    label: "Admin",
    border: "border-amber-500/30",
  },
  superadmin: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Super Admin",
    border: "border-red-500/30",
  },
  ai_assistant: {
    bg: "bg-cyan-900/30",
    text: "text-cyan-400",
    label: "AI Assistant",
    border: "border-cyan-500/30",
  },
};

// =============================================================================
// TRUST LEVEL COLORS
// =============================================================================

export type TrustLevel = "untrusted" | "suspicious" | "neutral" | "trusted" | "verified";

export const TRUST_LEVEL: StatusConfig<TrustLevel> = {
  untrusted: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    label: "Untrusted",
    border: "border-red-500/30",
  },
  suspicious: {
    bg: "bg-orange-900/30",
    text: "text-orange-400",
    label: "Suspicious",
    border: "border-orange-500/30",
  },
  neutral: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: "Neutral",
    border: "border-gray-600",
  },
  trusted: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    label: "Trusted",
    border: "border-blue-500/30",
  },
  verified: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    label: "Verified",
    border: "border-emerald-500/30",
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get status style with fallback
 */
export function getStatusStyle<T extends string>(
  config: StatusConfig<T>,
  status: T | string,
  fallback?: T
): StatusStyle {
  return config[status as T] || (fallback ? config[fallback] : {
    bg: "bg-gray-800",
    text: "text-gray-400",
    label: status,
    border: "border-gray-600",
  });
}

/**
 * Get all status options for filter dropdowns
 */
export function getStatusOptions<T extends string>(
  config: StatusConfig<T>,
  includeAll = true
): Array<{ value: T | "all"; label: string }> {
  const options: Array<{ value: T | "all"; label: string }> = includeAll
    ? [{ value: "all" as T | "all", label: "All" }]
    : [];

  for (const [key, style] of Object.entries(config) as Array<[T, StatusStyle]>) {
    options.push({ value: key, label: style.label });
  }

  return options;
}
