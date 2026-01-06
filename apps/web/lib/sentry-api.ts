/**
 * Sentry REST API Client
 *
 * Provides functions to interact with Sentry's REST API for:
 * - Fetching project issues (errors, warnings)
 * - Getting issue details with stack traces
 * - Updating issue status (resolve, ignore, unresolve)
 * - Fetching project statistics
 *
 * @see https://docs.sentry.io/api/
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SentryIssueStatus = "resolved" | "unresolved" | "ignored";
export type SentryIssueLevel = "fatal" | "error" | "warning" | "info" | "debug";

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  permalink: string;
  level: SentryIssueLevel;
  status: SentryIssueStatus;
  platform: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  metadata: {
    value?: string;
    type?: string;
    filename?: string;
    function?: string;
  };
  count: string; // Sentry returns as string
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  isPublic: boolean;
  isSubscribed: boolean;
  hasSeen: boolean;
  annotations: string[];
  assignedTo: {
    type: string;
    id: string;
    name: string;
    email?: string;
  } | null;
  stats: {
    "24h": Array<[number, number]>;
  };
}

export interface SentryEvent {
  id: string;
  eventID: string;
  context: Record<string, unknown>;
  contexts: Record<string, unknown>;
  dateCreated: string;
  dateReceived: string;
  entries: Array<{
    type: string;
    data: unknown;
  }>;
  errors: Array<{
    type: string;
    message: string;
  }>;
  message: string;
  metadata: Record<string, string>;
  platform: string;
  sdk: {
    name: string;
    version: string;
  };
  tags: Array<{
    key: string;
    value: string;
  }>;
  title: string;
  type: string;
  user: {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  } | null;
}

export interface SentryIssueDetail extends SentryIssue {
  activity: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    dateCreated: string;
    user: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  seenBy: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  pluginActions: unknown[];
  pluginContexts: unknown[];
  pluginIssues: unknown[];
  userReportCount: number;
}

export interface SentryProjectStats {
  received: number;
  rejected: number;
  blacklisted: number;
}

export interface FetchIssuesOptions {
  query?: string; // e.g., "is:unresolved", "level:error"
  statsPeriod?: string; // e.g., "24h", "14d", "30d"
  cursor?: string; // Pagination cursor
  limit?: number; // Default 25, max 100
  sort?: "date" | "new" | "priority" | "freq" | "user";
}

export interface FetchIssuesResult {
  issues: SentryIssue[];
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface SentryStats {
  totalIssues: number;
  unresolvedCount: number;
  errorCount: number;
  warningCount: number;
  fatalCount: number;
  affectedUsers: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const SENTRY_API_BASE = "https://sentry.io/api/0";

function getSentryConfig() {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!authToken || !org || !project) {
    throw new Error(
      "Missing Sentry configuration. Required: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT"
    );
  }

  return { authToken, org, project };
}

function getHeaders(): HeadersInit {
  const { authToken } = getSentryConfig();
  return {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch issues (errors) from Sentry project
 *
 * @param options - Query options (query, statsPeriod, cursor, limit, sort)
 * @returns Paginated list of issues
 *
 * @example
 * // Get unresolved errors from last 24 hours
 * const result = await fetchSentryIssues({
 *   query: "is:unresolved level:error",
 *   statsPeriod: "24h",
 *   limit: 25,
 * });
 */
export async function fetchSentryIssues(
  options: FetchIssuesOptions = {}
): Promise<FetchIssuesResult> {
  const { org, project } = getSentryConfig();

  const params = new URLSearchParams();

  // Default query to unresolved issues
  params.set("query", options.query || "is:unresolved");

  if (options.statsPeriod) {
    params.set("statsPeriod", options.statsPeriod);
  }

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit) {
    params.set("limit", String(Math.min(options.limit, 100)));
  }

  if (options.sort) {
    params.set("sort", options.sort);
  }

  const url = `${SENTRY_API_BASE}/projects/${org}/${project}/issues/?${params}`;

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 30 }, // Cache for 30 seconds
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Sentry API] Fetch issues failed:", response.status, errorText);
    throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
  }

  const issues: SentryIssue[] = await response.json();

  // Parse Link header for pagination cursors
  const linkHeader = response.headers.get("Link");
  const { nextCursor, prevCursor } = parseLinkHeader(linkHeader);

  return {
    issues,
    nextCursor,
    prevCursor,
  };
}

/**
 * Fetch a single issue with full details
 *
 * @param issueId - The Sentry issue ID
 * @returns Issue details with activity and participants
 */
export async function fetchSentryIssue(issueId: string): Promise<SentryIssueDetail> {
  const url = `${SENTRY_API_BASE}/issues/${issueId}/`;

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Sentry API] Fetch issue failed:", response.status, errorText);
    throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch the latest event for an issue (includes stack trace)
 *
 * @param issueId - The Sentry issue ID
 * @returns Latest event with full details
 */
export async function fetchSentryIssueLatestEvent(issueId: string): Promise<SentryEvent> {
  const url = `${SENTRY_API_BASE}/issues/${issueId}/events/latest/`;

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Sentry API] Fetch latest event failed:", response.status, errorText);
    throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update issue status (resolve, ignore, unresolve)
 *
 * @param issueId - The Sentry issue ID
 * @param status - New status
 * @returns Updated issue
 */
export async function updateSentryIssue(
  issueId: string,
  status: SentryIssueStatus
): Promise<SentryIssue> {
  const url = `${SENTRY_API_BASE}/issues/${issueId}/`;

  const body: Record<string, unknown> = {};

  switch (status) {
    case "resolved":
      body.status = "resolved";
      break;
    case "ignored":
      body.status = "ignored";
      body.statusDetails = { ignoreCount: 0, ignoreWindow: 0 };
      break;
    case "unresolved":
      body.status = "unresolved";
      break;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Sentry API] Update issue failed:", response.status, errorText);
    throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get aggregated stats for the project
 *
 * @param statsPeriod - Time period (e.g., "24h", "7d", "30d")
 * @returns Aggregated statistics
 */
export async function getSentryStats(statsPeriod: string = "24h"): Promise<SentryStats> {
  // Fetch issues to calculate stats
  const [unresolvedResult, errorsResult, warningsResult, fatalsResult] = await Promise.all([
    fetchSentryIssues({ query: "is:unresolved", statsPeriod, limit: 1 }),
    fetchSentryIssues({ query: "is:unresolved level:error", statsPeriod, limit: 100 }),
    fetchSentryIssues({ query: "is:unresolved level:warning", statsPeriod, limit: 100 }),
    fetchSentryIssues({ query: "is:unresolved level:fatal", statsPeriod, limit: 100 }),
  ]);

  // Calculate total affected users (unique across all issues)
  const allIssues = [
    ...errorsResult.issues,
    ...warningsResult.issues,
    ...fatalsResult.issues,
  ];

  const affectedUsers = allIssues.reduce((sum, issue) => sum + issue.userCount, 0);

  // Get total count from unresolved query
  // Note: Sentry doesn't return total count easily, so we estimate from fetched data
  const totalIssues =
    errorsResult.issues.length + warningsResult.issues.length + fatalsResult.issues.length;

  return {
    totalIssues,
    unresolvedCount: totalIssues,
    errorCount: errorsResult.issues.length,
    warningCount: warningsResult.issues.length,
    fatalCount: fatalsResult.issues.length,
    affectedUsers,
  };
}

/**
 * Check for new issues since a given timestamp
 *
 * @param since - ISO timestamp to check from
 * @returns New issues since the timestamp
 */
export async function getNewIssuesSince(since: Date): Promise<SentryIssue[]> {
  // Fetch recent issues
  const result = await fetchSentryIssues({
    query: "is:unresolved",
    statsPeriod: "24h",
    sort: "new",
    limit: 50,
  });

  // Filter to only issues first seen after the timestamp
  const sinceTime = since.getTime();
  return result.issues.filter((issue) => new Date(issue.firstSeen).getTime() > sinceTime);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse Sentry's Link header for pagination cursors
 *
 * Format: <url>; rel="previous"; results="false"; cursor="xxx",
 *         <url>; rel="next"; results="true"; cursor="yyy"
 */
function parseLinkHeader(header: string | null): {
  nextCursor: string | null;
  prevCursor: string | null;
} {
  if (!header) {
    return { nextCursor: null, prevCursor: null };
  }

  let nextCursor: string | null = null;
  let prevCursor: string | null = null;

  const parts = header.split(",");

  for (const part of parts) {
    const relMatch = part.match(/rel="(\w+)"/);
    const resultsMatch = part.match(/results="(\w+)"/);
    const cursorMatch = part.match(/cursor="([^"]+)"/);

    if (relMatch && cursorMatch) {
      const rel = relMatch[1];
      const hasResults = resultsMatch?.[1] === "true";
      const cursor = cursorMatch[1] ?? null;

      if (rel === "next" && hasResults && cursor) {
        nextCursor = cursor;
      } else if (rel === "previous" && hasResults && cursor) {
        prevCursor = cursor;
      }
    }
  }

  return { nextCursor, prevCursor };
}

/**
 * Format issue level with appropriate emoji
 */
export function formatIssueLevel(level: SentryIssueLevel): {
  emoji: string;
  label: string;
  color: string;
} {
  switch (level) {
    case "fatal":
      return { emoji: "💀", label: "Fatal", color: "text-red-600" };
    case "error":
      return { emoji: "🔴", label: "Error", color: "text-red-500" };
    case "warning":
      return { emoji: "🟡", label: "Warning", color: "text-yellow-500" };
    case "info":
      return { emoji: "🔵", label: "Info", color: "text-blue-500" };
    case "debug":
      return { emoji: "⚪", label: "Debug", color: "text-gray-500" };
    default:
      return { emoji: "❓", label: level, color: "text-gray-500" };
  }
}

/**
 * Format issue status with appropriate styling
 */
export function formatIssueStatus(status: SentryIssueStatus): {
  label: string;
  bgClass: string;
  textClass: string;
} {
  switch (status) {
    case "resolved":
      return {
        label: "Resolved",
        bgClass: "bg-green-100 dark:bg-green-900/30",
        textClass: "text-green-700 dark:text-green-400",
      };
    case "ignored":
      return {
        label: "Ignored",
        bgClass: "bg-gray-100 dark:bg-gray-800",
        textClass: "text-gray-600 dark:text-gray-400",
      };
    case "unresolved":
      return {
        label: "Unresolved",
        bgClass: "bg-red-100 dark:bg-red-900/30",
        textClass: "text-red-700 dark:text-red-400",
      };
    default:
      return {
        label: status,
        bgClass: "bg-gray-100 dark:bg-gray-800",
        textClass: "text-gray-600 dark:text-gray-400",
      };
  }
}

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return !!(
    process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
  );
}
