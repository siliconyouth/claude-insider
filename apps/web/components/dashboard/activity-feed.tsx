/**
 * Comprehensive Activity Feed Component
 *
 * Real-time activity feed showing all website events including:
 * - Security events (bot detections, honeypots, blocks)
 * - User actions (logins, signups, profile updates)
 * - Notifications sent
 * - Emails delivered
 *
 * Features linkified entries with hovercards for users/notifications.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { formatDistanceToNow, format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Activity types
export type ActivityType =
  | "security"
  | "user"
  | "notification"
  | "email"
  | "feedback"
  | "comment"
  | "achievement";

// Activity entry interface
export interface ActivityEntry {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: string;
  severity?: "info" | "warning" | "error" | "success";
  // Linkable entities
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  target?: {
    type: "user" | "notification" | "email" | "page" | "comment" | "feedback";
    id: string;
    label: string;
    url?: string;
  };
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

// Filter configuration
const ACTIVITY_FILTERS: Array<{
  type: ActivityType | "all";
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: "all",
    label: "All Activity",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    color: "gray",
  },
  {
    type: "security",
    label: "Security",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "blue",
  },
  {
    type: "user",
    label: "Users",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "emerald",
  },
  {
    type: "notification",
    label: "Notifications",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    color: "purple",
  },
  {
    type: "email",
    label: "Emails",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: "cyan",
  },
  {
    type: "feedback",
    label: "Feedback",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    color: "amber",
  },
  {
    type: "achievement",
    label: "Achievements",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: "yellow",
  },
];

export function ActivityFeed({
  className,
  maxItems = 50,
  showFilters = true,
  showSearch = true,
  autoRefresh = true,
  refreshInterval = 30000,
  enableRealtime = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActivityType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<ActivityEntry["user"] | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const feedRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch activities from API
  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/dashboard/activity?limit=${maxItems}${activeFilter !== "all" ? `&type=${activeFilter}` : ""}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
        setError(null);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, [maxItems, activeFilter]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchActivities();

    if (autoRefresh && !isPaused) {
      refreshTimeoutRef.current = setInterval(fetchActivities, refreshInterval);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [fetchActivities, autoRefresh, refreshInterval, isPaused]);

  // Setup Realtime subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const supabase = createClient();

    // Subscribe to activity_log table (if it exists) or security_logs
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_logs",
        },
        (payload: { new: Record<string, unknown> }) => {
          // Transform security log to activity
          const log = payload.new;
          const activity: ActivityEntry = {
            id: log.id as string,
            type: "security",
            action: (log.event_type as string) || "event",
            description: formatSecurityDescription(log),
            timestamp: (log.created_at as string) || new Date().toISOString(),
            severity: getSeverityFromLog(log),
            metadata: log as Record<string, unknown>,
          };

          if (!isPaused) {
            setActivities((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enableRealtime, isPaused, maxItems]);

  // Filter activities based on search and type
  const filteredActivities = activities.filter((activity) => {
    if (activeFilter !== "all" && activity.type !== activeFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        activity.description.toLowerCase().includes(query) ||
        activity.action.toLowerCase().includes(query) ||
        activity.user?.name.toLowerCase().includes(query) ||
        activity.user?.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get activity icon
  const getActivityIcon = (type: ActivityType, severity?: string): React.ReactNode => {
    const filter = ACTIVITY_FILTERS.find((f) => f.type === type);
    if (filter) return filter.icon;
    return null;
  };

  // Get severity color
  const getSeverityStyles = (
    type: ActivityType,
    severity?: string
  ): { border: string; bg: string; text: string } => {
    if (severity === "error") {
      return { border: "border-l-red-500", bg: "bg-red-500/5", text: "text-red-400" };
    }
    if (severity === "warning") {
      return { border: "border-l-amber-500", bg: "bg-amber-500/5", text: "text-amber-400" };
    }
    if (severity === "success") {
      return { border: "border-l-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-400" };
    }

    // Default by type
    switch (type) {
      case "security":
        return { border: "border-l-blue-500", bg: "bg-blue-500/5", text: "text-blue-400" };
      case "user":
        return { border: "border-l-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-400" };
      case "notification":
        return { border: "border-l-purple-500", bg: "bg-purple-500/5", text: "text-purple-400" };
      case "email":
        return { border: "border-l-cyan-500", bg: "bg-cyan-500/5", text: "text-cyan-400" };
      case "feedback":
        return { border: "border-l-amber-500", bg: "bg-amber-500/5", text: "text-amber-400" };
      case "achievement":
        return { border: "border-l-yellow-500", bg: "bg-yellow-500/5", text: "text-yellow-400" };
      default:
        return { border: "border-l-gray-500", bg: "bg-gray-500/5", text: "text-gray-400" };
    }
  };

  // Handle user hover for hovercard
  const handleUserHover = (
    user: ActivityEntry["user"],
    event: React.MouseEvent
  ) => {
    if (user) {
      setHoveredUser(user);
      setHoverPosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
          {/* Connection indicator */}
          {enableRealtime && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isConnected
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-gray-500"
                )}
              />
              <span className="text-xs text-gray-500">
                {isConnected ? "Live" : "Connecting..."}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Pause button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "p-2 rounded-lg text-xs transition-colors",
              isPaused
                ? "bg-amber-500/20 text-amber-400"
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchActivities}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              className={cn("w-4 h-4", isLoading && "animate-spin")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {ACTIVITY_FILTERS.map((filter) => (
            <button
              key={filter.type}
              onClick={() => setActiveFilter(filter.type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeFilter === filter.type
                  ? cn(
                      "bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20",
                      "text-white border border-blue-500/30"
                    )
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
              "bg-gray-800/50 border border-gray-700",
              "text-white placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            )}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Activity list */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto space-y-2 max-h-[500px] scrollbar-thin scrollbar-thumb-gray-700"
      >
        {isLoading && activities.length === 0 ? (
          // Loading skeleton
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-4 rounded-lg bg-gray-800/30 border-l-2 border-l-gray-600"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No activities found</p>
            <p className="text-xs mt-1 opacity-75">
              {searchQuery
                ? "Try a different search term"
                : "Activities will appear here"}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const styles = getSeverityStyles(activity.type, activity.severity);

            return (
              <div
                key={activity.id}
                className={cn(
                  "group p-4 rounded-lg transition-all",
                  "bg-gray-800/30 hover:bg-gray-800/50",
                  "border-l-2",
                  styles.border
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn("mt-0.5 p-1.5 rounded-lg", styles.bg, styles.text)}>
                    {getActivityIcon(activity.type, activity.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Action and badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white capitalize">
                        {activity.action.replace(/_/g, " ")}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] font-medium rounded uppercase",
                          styles.bg,
                          styles.text
                        )}
                      >
                        {activity.type}
                      </span>
                      {activity.severity === "error" && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-500/20 text-red-400">
                          ERROR
                        </span>
                      )}
                    </div>

                    {/* Description with linkified entities */}
                    <p className="mt-1 text-sm text-gray-400">
                      {activity.description}
                    </p>

                    {/* User link */}
                    {activity.user && (
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href={`/dashboard/users?id=${activity.user.id}`}
                          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          onMouseEnter={(e) => handleUserHover(activity.user, e)}
                          onMouseLeave={() => setHoveredUser(null)}
                        >
                          {activity.user.image ? (
                            <img
                              src={activity.user.image}
                              alt={activity.user.name}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-medium">
                              {activity.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {activity.user.name}
                        </Link>
                      </div>
                    )}

                    {/* Target link */}
                    {activity.target && (
                      <div className="mt-2">
                        <Link
                          href={activity.target.url || `#`}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                            "bg-gray-700/50 text-gray-300 hover:text-white",
                            "transition-colors"
                          )}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {activity.target.label}
                        </Link>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <time
                        dateTime={activity.timestamp}
                        title={format(new Date(activity.timestamp), "PPpp")}
                      >
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </time>
                      <span className="opacity-50">•</span>
                      <span className="font-mono opacity-75">
                        {format(new Date(activity.timestamp), "HH:mm:ss")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User hovercard */}
      {hoveredUser && (
        <div
          className={cn(
            "fixed z-50 p-4 rounded-xl shadow-xl",
            "bg-gray-900 border border-gray-700",
            "min-w-[250px] pointer-events-none"
          )}
          style={{
            left: Math.min(hoverPosition.x + 10, window.innerWidth - 280),
            top: Math.min(hoverPosition.y + 10, window.innerHeight - 150),
          }}
        >
          <div className="flex items-center gap-3">
            {hoveredUser.image ? (
              <img
                src={hoveredUser.image}
                alt={hoveredUser.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-lg text-white font-medium">
                {hoveredUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-white">{hoveredUser.name}</div>
              <div className="text-sm text-gray-400">{hoveredUser.email}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              Click to view full profile
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatSecurityDescription(log: Record<string, unknown>): string {
  const eventType = log.event_type as string;
  const endpoint = log.endpoint as string;
  const isBot = log.is_bot as boolean;
  const botName = log.bot_name as string;

  if (isBot) {
    return `Bot detected: ${botName || "Unknown"} accessing ${endpoint || "unknown endpoint"}`;
  }

  switch (eventType) {
    case "request":
      return `${log.method || "GET"} request to ${endpoint || "/"}`;
    case "bot_detected":
      return `Bot ${botName || "Unknown"} detected`;
    case "honeypot_served":
      return `Honeypot response served for ${endpoint}`;
    case "rate_limited":
      return `Rate limit triggered for ${log.ip_address || "unknown IP"}`;
    case "blocked":
      return `Visitor blocked: ${(log.visitor_id as string)?.substring(0, 8) || log.ip_address}`;
    default:
      return `Security event: ${eventType}`;
  }
}

function getSeverityFromLog(log: Record<string, unknown>): "info" | "warning" | "error" | "success" {
  const severity = log.severity as string;
  if (severity === "error" || severity === "critical") return "error";
  if (severity === "warning") return "warning";
  if (log.is_bot) return "warning";
  return "info";
}
