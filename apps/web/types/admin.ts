/**
 * Admin Types
 *
 * Types for admin dashboard, user management, and audit logging.
 */

import type { UserRole } from "@/lib/roles";

/**
 * Admin log entry for audit trail
 */
export interface AdminLog {
  id: string;
  adminId: string;
  adminName?: string;
  adminEmail?: string;
  action: AdminAction;
  targetType: AdminTargetType;
  targetId: string;
  targetName?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Types of admin actions
 */
export type AdminAction =
  // Beta applications
  | "approve_beta"
  | "reject_beta"
  // Feedback
  | "update_feedback_status"
  | "close_feedback"
  // User management
  | "change_role"
  | "ban_user"
  | "unban_user"
  | "delete_user"
  // Comments
  | "hide_comment"
  | "unhide_comment"
  // Edit suggestions
  | "approve_suggestion"
  | "reject_suggestion";

/**
 * Target types for admin actions
 */
export type AdminTargetType =
  | "user"
  | "beta_application"
  | "feedback"
  | "comment"
  | "edit_suggestion";

/**
 * Dashboard statistics
 */
export interface AdminStats {
  users: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    byRole: Record<UserRole, number>;
  };
  beta: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  feedback: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
}

/**
 * User for admin list view
 */
export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  isBetaTester: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

/**
 * User detail for admin view
 */
export interface AdminUserDetail extends AdminUserListItem {
  bio?: string;
  socialLinks?: Record<string, string>;
  hasPassword: boolean;
  provider?: string;
  feedbackCount: number;
  suggestionsCount: number;
  commentsCount: number;
  betaApplication?: {
    id: string;
    status: "pending" | "approved" | "rejected";
    motivation: string;
    experienceLevel?: string;
    useCase?: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewNotes?: string;
  };
}

/**
 * Beta application for admin review
 */
export interface AdminBetaApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  motivation: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  useCase?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feedback for admin view
 */
export interface AdminFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  feedbackType: "bug" | "feature" | "general";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  pageUrl?: string;
  userAgent?: string;
  screenshotUrl?: string;
  status: "open" | "in_progress" | "resolved" | "closed" | "wont_fix";
  createdAt: string;
  updatedAt: string;
}

/**
 * Filters for admin user list
 */
export interface AdminUserFilters {
  search?: string;
  role?: UserRole | "all";
  isBetaTester?: boolean | "all";
  sortBy?: "name" | "email" | "createdAt" | "role";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Filters for admin beta applications
 */
export interface AdminBetaFilters {
  status?: "pending" | "approved" | "rejected" | "all";
  experienceLevel?: "beginner" | "intermediate" | "advanced" | "expert" | "all";
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Filters for admin feedback
 */
export interface AdminFeedbackFilters {
  status?: "open" | "in_progress" | "resolved" | "closed" | "wont_fix" | "all";
  feedbackType?: "bug" | "feature" | "general" | "all";
  severity?: "low" | "medium" | "high" | "critical" | "all";
  sortBy?: "createdAt" | "updatedAt" | "severity";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  role?: UserRole;
  isBanned?: boolean;
  banReason?: string;
}

/**
 * Review beta application request
 */
export interface ReviewBetaRequest {
  status: "approved" | "rejected";
  reviewNotes?: string;
}

/**
 * Update feedback status request
 */
export interface UpdateFeedbackRequest {
  status: "open" | "in_progress" | "resolved" | "closed" | "wont_fix";
}
