/**
 * Query Key Factory
 *
 * Centralized query key definitions for TanStack Query.
 * Using a factory pattern ensures consistent cache invalidation.
 *
 * Key Structure:
 * - ["dashboard", "section", "subsection", filters]
 * - Invalidating parent keys invalidates all children
 *
 * Example:
 * - queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
 *   → Invalidates all user-related queries
 */

// Filter types for type-safe query keys
export interface UsersFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FeedbackFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  search?: string;
}

export interface DiscoveryQueueFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  sourceId?: string;
}

export interface BetaFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface ResourceFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
}

export interface NotificationFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  sent?: boolean;
}

export interface AuditFilters {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Query Keys Factory
 *
 * Each section has:
 * - all: Base key for invalidating everything in that section
 * - list: Key factory for paginated/filtered lists
 * - detail: Key factory for individual items
 * - stats: Key for section-specific statistics
 */
export const queryKeys = {
  // Dashboard Overview
  dashboard: {
    all: ["dashboard"] as const,
    stats: ["dashboard", "stats"] as const,
    chartStats: ["dashboard", "chart-stats"] as const,
  },

  // Navigation Counts (real-time badge updates)
  navCounts: ["dashboard", "nav-counts"] as const,

  // Users Section
  users: {
    all: ["dashboard", "users"] as const,
    list: (filters: UsersFilters) =>
      ["dashboard", "users", "list", filters] as const,
    detail: (id: string) => ["dashboard", "users", "detail", id] as const,
    banned: ["dashboard", "users", "banned"] as const,
  },

  // Discovery Section
  discovery: {
    all: ["dashboard", "discovery"] as const,
    stats: ["dashboard", "discovery", "stats"] as const,
    queue: (filters: DiscoveryQueueFilters) =>
      ["dashboard", "discovery", "queue", filters] as const,
    sources: ["dashboard", "discovery", "sources"] as const,
    sourceDetail: (id: string) =>
      ["dashboard", "discovery", "sources", id] as const,
  },

  // Feedback Section
  feedback: {
    all: ["dashboard", "feedback"] as const,
    list: (filters: FeedbackFilters) =>
      ["dashboard", "feedback", "list", filters] as const,
    detail: (id: string) => ["dashboard", "feedback", "detail", id] as const,
    stats: ["dashboard", "feedback", "stats"] as const,
  },

  // Beta Applications
  beta: {
    all: ["dashboard", "beta"] as const,
    applications: (filters: BetaFilters) =>
      ["dashboard", "beta", "applications", filters] as const,
    testers: (filters: BetaFilters) =>
      ["dashboard", "beta", "testers", filters] as const,
    detail: (id: string) => ["dashboard", "beta", "detail", id] as const,
  },

  // Content Moderation
  moderation: {
    all: ["dashboard", "moderation"] as const,
    suggestions: (filters: { page?: number; status?: string }) =>
      ["dashboard", "moderation", "suggestions", filters] as const,
    comments: (filters: { page?: number; status?: string }) =>
      ["dashboard", "moderation", "comments", filters] as const,
    reports: (filters: { page?: number; status?: string; type?: string }) =>
      ["dashboard", "moderation", "reports", filters] as const,
  },

  // Resources Section
  resources: {
    all: ["dashboard", "resources"] as const,
    list: (filters: ResourceFilters) =>
      ["dashboard", "resources", "list", filters] as const,
    detail: (id: string) => ["dashboard", "resources", "detail", id] as const,
    analytics: ["dashboard", "resources", "analytics"] as const,
    updates: ["dashboard", "resources", "updates"] as const,
  },

  // Documentation Section
  documentation: {
    all: ["dashboard", "documentation"] as const,
    list: (filters: { page?: number; category?: string }) =>
      ["dashboard", "documentation", "list", filters] as const,
    versions: ["dashboard", "documentation", "versions"] as const,
    relationships: ["dashboard", "documentation", "relationships"] as const,
  },

  // Prompts Section
  prompts: {
    all: ["dashboard", "prompts"] as const,
    list: (filters: { page?: number; category?: string }) =>
      ["dashboard", "prompts", "list", filters] as const,
    detail: (id: string) => ["dashboard", "prompts", "detail", id] as const,
  },

  // Security Section
  security: {
    all: ["dashboard", "security"] as const,
    stats: ["dashboard", "security", "stats"] as const,
    overview: ["dashboard", "security", "overview"] as const,
    logs: (filters: {
      page?: number;
      severity?: string;
      eventType?: string;
      botOnly?: boolean;
      search?: string;
      startDate?: string;
      endDate?: string;
    }) => ["dashboard", "security", "logs", filters] as const,
    visitors: (filters: {
      page?: number;
      trustLevel?: string;
      isBlocked?: boolean;
      hasAccount?: boolean;
      search?: string;
    }) => ["dashboard", "security", "visitors", filters] as const,
    honeypots: ["dashboard", "security", "honeypots"] as const,
    bots: ["dashboard", "security", "bots"] as const,
    settings: ["dashboard", "security", "settings"] as const,
  },

  // Analytics Section
  analytics: {
    all: ["dashboard", "analytics"] as const,
    faq: ["dashboard", "analytics", "faq"] as const,
    search: (filters: { period?: string }) =>
      ["dashboard", "analytics", "search", filters] as const,
  },

  // Notifications Section
  notifications: {
    all: ["dashboard", "notifications"] as const,
    list: (filters: NotificationFilters) =>
      ["dashboard", "notifications", "list", filters] as const,
    templates: ["dashboard", "notifications", "templates"] as const,
  },

  // Donations Section
  donations: {
    all: ["dashboard", "donations"] as const,
    list: (filters: { page?: number; status?: string }) =>
      ["dashboard", "donations", "list", filters] as const,
    stats: ["dashboard", "donations", "stats"] as const,
  },

  // Exports Section
  exports: {
    all: ["dashboard", "exports"] as const,
    jobs: (filters: { page?: number }) =>
      ["dashboard", "exports", "jobs", filters] as const,
  },

  // SEO Section
  seo: {
    all: ["dashboard", "seo"] as const,
    pages: ["dashboard", "seo", "pages"] as const,
    indexnow: ["dashboard", "seo", "indexnow"] as const,
  },

  // Admin Section (consolidated admin-specific queries)
  admin: {
    all: ["dashboard", "admin"] as const,
    // Banned users & appeals
    bannedUsers: ["dashboard", "admin", "banned-users"] as const,
    banAppeals: (status?: "all" | "pending" | "approved" | "rejected") =>
      ["dashboard", "admin", "ban-appeals", status] as const,
    // Admin notifications
    notifications: (status?: string) =>
      ["dashboard", "admin", "notifications", status] as const,
    // Donations
    donations: ["dashboard", "admin", "donations"] as const,
    // Exports
    exports: ["dashboard", "admin", "exports"] as const,
  },
} as const;

// Helper type for extracting query key type
export type QueryKeyOf<T> = T extends readonly unknown[] ? T : never;
