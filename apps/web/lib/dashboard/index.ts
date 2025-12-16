/**
 * Dashboard Library
 *
 * Shared hooks, types, and configurations for dashboard pages.
 * Import from "@/lib/dashboard" for cleaner imports.
 */

// Types
export type {
  PaginationState,
  PaginatedResponse,
  FilterOption,
  FilterConfig,
  TableColumn,
  StatusStyle,
  StatusConfig,
  ActionResult,
  ActionConfig,
  ModalAction,
  BaseEntity,
  UserInfo,
  UsePaginatedListOptions,
  UseDashboardActionOptions,
} from "./types";

// Hooks
export { usePaginatedList, useSimpleList } from "./use-paginated-list";
export {
  useDashboardAction,
  useEntityAction,
  useModerationAction,
  useStatusAction,
  useBulkAction,
} from "./use-dashboard-action";

// Status Configurations
export {
  // Status configs
  MODERATION_STATUS,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE,
  SEVERITY,
  REPORT_STATUS,
  NOTIFICATION_STATUS,
  BETA_APPLICATION_STATUS,
  RESOURCE_STATUS,
  USER_ROLE,
  TRUST_LEVEL,
  // Types
  type ModerationStatus,
  type FeedbackStatus,
  type FeedbackType,
  type Severity,
  type ReportStatus,
  type NotificationStatus,
  type BetaApplicationStatus,
  type ResourceStatus,
  type UserRole,
  type TrustLevel,
  // Helpers
  getStatusStyle,
  getStatusOptions,
} from "./status-config";
