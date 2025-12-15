/**
 * Security Live Feed Component
 *
 * Real-time activity feed showing security events as they happen.
 * Uses Supabase Realtime subscriptions.
 */

"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/design-system";
import {
  useSecurityRealtime,
  type SecurityLogEntry,
} from "@/hooks/use-security-realtime";
import { formatDistanceToNow } from "date-fns";

interface LiveFeedProps {
  className?: string;
  maxItems?: number;
  autoScroll?: boolean;
  showStats?: boolean;
}

export function LiveFeed({
  className,
  maxItems = 20,
  autoScroll = true,
  showStats = true,
}: LiveFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const {
    recentLogs,
    isConnected,
    error,
    stats,
    clearLogs,
    clearStats,
  } = useSecurityRealtime({
    maxLogs: maxItems,
    onNewLog: () => {
      // Auto-scroll to top when new log arrives (if not paused)
      if (autoScroll && !isPaused && feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  });

  // Format event for display
  const formatEvent = (log: SecurityLogEntry): string => {
    if (log.is_bot) {
      return `Bot detected: ${log.bot_name || "Unknown"}`;
    }
    if (log.honeypot_served) {
      return `Honeypot served for ${log.endpoint || "unknown endpoint"}`;
    }
    switch (log.event_type) {
      case "request":
        return `${log.method || "GET"} ${log.endpoint || "/"}`;
      case "bot_detected":
        return `Bot: ${log.bot_name || log.bot_category || "Unknown"}`;
      case "honeypot_served":
        return `Honeypot: ${log.endpoint}`;
      case "rate_limited":
        return `Rate limited: ${log.ip_address}`;
      case "blocked":
        return `Blocked: ${log.visitor_id?.substring(0, 8) || log.ip_address}`;
      default:
        return log.event_type;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string, isBot: boolean): string => {
    if (isBot) return "text-amber-400";
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-amber-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  // Get event icon
  const getEventIcon = (log: SecurityLogEntry): React.ReactNode => {
    if (log.is_bot) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    if (log.honeypot_served) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (log.severity === "error" || log.severity === "critical") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Live Activity</h3>
          {/* Connection indicator */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected
                  ? "bg-emerald-500 animate-pulse"
                  : error
                  ? "bg-red-500"
                  : "bg-gray-500"
              )}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? "Live" : error ? "Error" : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors",
              isPaused
                ? "bg-amber-500/20 text-amber-400"
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
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

          {/* Clear button */}
          <button
            onClick={() => {
              clearLogs();
              clearStats();
            }}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Clear feed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {showStats && stats.newLogsCount > 0 && (
        <div className="flex items-center gap-4 mb-3 px-3 py-2 rounded-lg bg-gray-800/50 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Events:</span>
            <span className="text-white font-medium">{stats.newLogsCount}</span>
          </div>
          {stats.botDetections > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Bots:</span>
              <span className="text-amber-400 font-medium">{stats.botDetections}</span>
            </div>
          )}
          {stats.honeypotTriggers > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Honeypots:</span>
              <span className="text-cyan-400 font-medium">{stats.honeypotTriggers}</span>
            </div>
          )}
          {stats.visitorUpdates > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Visitors:</span>
              <span className="text-blue-400 font-medium">{stats.visitorUpdates}</span>
            </div>
          )}
        </div>
      )}

      {/* Feed content */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto space-y-1 max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700"
      >
        {recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm">Waiting for security events...</p>
            <p className="text-xs mt-1 opacity-75">Events will appear here in real-time</p>
          </div>
        ) : (
          recentLogs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                "bg-gray-800/30 hover:bg-gray-800/50 transition-colors",
                "border-l-2",
                log.is_bot
                  ? "border-l-amber-500"
                  : log.honeypot_served
                  ? "border-l-cyan-500"
                  : log.severity === "error"
                  ? "border-l-red-500"
                  : "border-l-gray-600"
              )}
            >
              {/* Icon */}
              <div className={cn("mt-0.5", getSeverityColor(log.severity, log.is_bot))}>
                {getEventIcon(log)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white truncate">
                    {formatEvent(log)}
                  </span>
                  {log.is_bot && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400">
                      BOT
                    </span>
                  )}
                  {log.honeypot_served && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-500/20 text-cyan-400">
                      HONEYPOT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{log.request_id?.substring(0, 8)}</span>
                  {log.ip_address && (
                    <>
                      <span>•</span>
                      <span>{log.ip_address}</span>
                    </>
                  )}
                  {log.response_time_ms && (
                    <>
                      <span>•</span>
                      <span>{log.response_time_ms}ms</span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Status code badge */}
              {log.status_code && (
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-mono rounded",
                    log.status_code >= 500
                      ? "bg-red-500/20 text-red-400"
                      : log.status_code >= 400
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}
                >
                  {log.status_code}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Compact connection status indicator
 */
export function LiveStatusIndicator() {
  const { isConnected, error } = useSecurityRealtime({ autoConnect: true });

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected
            ? "bg-emerald-500 animate-pulse"
            : error
            ? "bg-red-500"
            : "bg-gray-500"
        )}
      />
      <span className="text-xs text-gray-500">
        {isConnected ? "Realtime active" : error ? "Connection error" : "Connecting..."}
      </span>
    </div>
  );
}
