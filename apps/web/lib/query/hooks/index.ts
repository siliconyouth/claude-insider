/**
 * Dashboard Query Hooks
 *
 * Re-exports all dashboard-specific query hooks for convenient importing.
 *
 * Usage:
 * import { useDashboardQuery, useDashboardMutation } from "@/lib/query/hooks";
 */

export {
  useDashboardQuery,
  useDashboardList,
  useDashboardStats,
  useDashboardMutation,
  useBulkMutation,
  useOptimisticMutation,
} from "./use-dashboard-query";

// Discovery hooks
export {
  useDiscoveryStats,
  useDiscoveryQueue,
  useDiscoverySources,
  useQueueAction,
  useSourceToggle,
  useTriggerScan,
  useTriggerAllScans,
  useBulkQueueAction,
  type QueueStatus,
  type QueueItem,
  type Source,
  type DiscoveryStats,
  type QueueFilters,
  type ScanResult,
  type DiscoveryScanResponse,
} from "./use-discovery-query";

// Dashboard overview hooks
export {
  useDashboardOverviewStats,
  useDashboardChartStats,
  useRecentBetaApplications,
  useRecentFeedback,
  useRecentNotifications,
  useDonationOverview,
  useDashboardOverviewData,
  type ChartStats,
  type DonationOverviewStats,
} from "./use-dashboard-overview-query";

// Users hooks
export {
  useUsersList,
  useUserDetail,
  useUserActivity,
  useUpdateUserRole,
  useBanUser,
  useUnbanUser,
  type UserListFilters,
} from "./use-users-query";

// Feedback hooks
export {
  useFeedbackList,
  useFeedbackDetail,
  useUpdateFeedbackStatus,
  useDeleteFeedback,
  type FeedbackListFilters,
} from "./use-feedback-query";

// Moderation hooks (Beta, Suggestions, Comments, Reports)
export {
  // Beta
  useBetaApplicationsList,
  useReviewBetaApplication,
  type BetaListFilters,
  type BetaStatus,
  // Suggestions
  useSuggestionsList,
  useReviewSuggestion,
  type SuggestionListFilters,
  type SuggestionStatus,
  type SuggestionWithUser,
  // Comments
  useCommentsList,
  useModerateComment,
  useDeleteComment,
  type CommentListFilters,
  type CommentModerationStatus,
  type CommentWithUser,
  // Reports
  useReportsList,
  useReportStats,
  useReviewReport,
  type ReportListFilters,
  type ReportStatus,
  type Report,
  type ReportTypeFilter,
} from "./use-moderation-query";

// Documentation hooks
export {
  useDocumentationList,
  useDocumentationDetail,
  type DocumentationItem,
  type CategoryStats,
  type DocumentationStats,
  type DocumentationListFilters,
  type DocumentationListResponse,
} from "./use-documentation-query";

// Resources Admin hooks
export {
  useResourcesAdminList,
  useResourceAdminDetail,
  type ResourceAdminItem,
  type ResourceCategoryStats,
  type ResourceAdminStats,
  type ResourceAdminListResponse,
  type ResourceAdminListFilters,
} from "./use-resources-admin-query";

// Prompts hooks
export {
  usePromptsList,
  usePromptDetail,
  useTogglePromptFeatured,
  useDeletePrompt,
  type PromptItem,
  type PromptCategory,
  type PromptStats,
  type PromptListResponse,
  type PromptListFilters,
} from "./use-prompts-query";

// Relationships hooks
export {
  useRelationshipsList,
  isDocResourceResponse,
  isResourceResourceResponse,
  type DocResourceRelationship,
  type ResourceResourceRelationship,
  type DocResourceStats,
  type ResourceResourceStats,
  type DocResourceApiResponse,
  type ResourceResourceApiResponse,
  type RelationshipsApiResponse,
  type RelationshipsListFilters,
} from "./use-relationships-query";

// Security hooks
export {
  // Query hooks
  useSecurityStats,
  useSecurityLogs,
  useSecurityVisitors,
  useHoneypotsList,
  useSecuritySettings,
  // Mutation hooks
  useBlockVisitor,
  useUnblockVisitor,
  useCreateHoneypot,
  useUpdateHoneypot,
  useToggleHoneypot,
  useDeleteHoneypot,
  useUpdateSecuritySettings,
  useExportSecurityLogs,
  // Types (SecurityLogEntry and VisitorFingerprint are re-exported from original modules)
  type SecurityLogEntry,
  type VisitorFingerprint,
  type SecurityLogsResponse,
  type LogsFilters,
  type VisitorsResponse,
  type VisitorsFilters,
  type HoneypotsResponse,
  type CreateHoneypotInput,
  type UpdateHoneypotInput,
  type SecuritySetting,
  type GroupedSettings,
  type SettingsResponse,
  type UpdateSettingsInput,
} from "./use-security-query";

// Admin hooks (useUnbanUser is already exported from use-users-query)
export {
  // Banned users hooks
  useBannedUsers,
  useBanAppeals,
  useReviewBanAppeal,
  // Notifications hooks
  useAdminNotifications,
  useCreateNotification,
  useUpdateNotification,
  useScheduleNotification,
  useCancelNotification,
  useDeleteNotification,
  useSendVersionNotification,
  // Donations hooks
  useDonationStats,
  useConfirmTransfer,
  useResendThankYou,
  // Exports hooks
  useExportJobs,
  useCreateExport,
  useGetExportDownloadUrl,
  useCancelExport,
  useDeleteExport,
  // Types
  type BannedUser,
  type BanAppeal,
  type AdminNotification,
  type AdminNotificationStatus,
  type CreateAdminNotificationParams,
  type ExportJob,
  type ExportType,
  type DonationStats,
} from "./use-admin-query";

// Analytics hooks
export {
  useSearchAnalytics,
  type SearchAnalyticsData,
  type SearchDateRange,
} from "./use-analytics-query";

// Broken Links hooks
export {
  useBrokenLinksQueue,
  useBrokenLinksStats,
  useFixBrokenLink,
  useHideBrokenLink,
  useDismissBrokenLink,
  useTriggerValidation,
  useBulkBrokenLinkAction,
  useRediscoverBrokenLinks,
  type BrokenLinkEntry,
  type BrokenLinkQueueFilters,
  type BrokenLinkStats,
  type BrokenLinkStatus,
  type RediscoverResult,
  type RediscoverResponse,
} from "./use-broken-links-query";
