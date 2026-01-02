"use client";

/**
 * MCP Configuration Moderation Queue
 *
 * Admin page for reviewing and approving MCP configurations
 * submitted by users for public gallery publication.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { getModerationQueue, moderateConfig } from "@/lib/mcp/storage";
import type { MCPModerationItem } from "@/lib/mcp/schema";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ServerStackIcon,
  UserIcon,
  CalendarIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function MCPModerationPage() {
  const { user } = useAuth();

  // State
  const [queue, setQueue] = useState<MCPModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  // Load queue
  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await getModerationQueue();
      setQueue(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Handle approve
  const handleApprove = useCallback(
    async (configId: string) => {
      setActionLoading(configId);
      try {
        await moderateConfig(configId, true, feedback[configId] || undefined);
        await loadQueue();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve");
      } finally {
        setActionLoading(null);
      }
    },
    [loadQueue, feedback]
  );

  // Handle reject
  const handleReject = useCallback(
    async (configId: string) => {
      if (!feedback[configId]?.trim()) {
        setError("Please provide feedback for rejection");
        return;
      }

      setActionLoading(configId);
      try {
        await moderateConfig(configId, false, feedback[configId]);
        await loadQueue();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setActionLoading(null);
      }
    },
    [loadQueue, feedback]
  );

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Check if user has permission
  const hasPermission = user && ["moderator", "admin", "superadmin"].includes(user.role || "");

  if (!hasPermission) {
    return (
      <div className="min-h-screen ui-bg-page flex items-center justify-center p-4">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 mx-auto ui-text-secondary mb-3" />
          <h2 className="text-xl font-semibold ui-text-heading mb-2">
            Access Denied
          </h2>
          <p className="ui-text-secondary">
            You need moderator permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ui-bg-page">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
              <ShieldCheckIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold ui-text-heading">
                MCP Moderation Queue
              </h1>
              <p className="ui-text-secondary">
                {queue.length} configuration{queue.length !== 1 ? "s" : ""} pending review
              </p>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center">
            <ArrowPathIcon className="h-8 w-8 mx-auto ui-text-secondary animate-spin" />
            <p className="mt-2 ui-text-secondary">Loading queue...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && queue.length === 0 && (
          <div className="py-12 text-center ui-bg-card border ui-border rounded-xl">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-semibold ui-text-heading mb-1">
              All caught up!
            </h3>
            <p className="ui-text-secondary">
              No configurations pending review.
            </p>
          </div>
        )}

        {/* Queue list */}
        {!isLoading && queue.length > 0 && (
          <div className="space-y-4">
            {queue.map((item) => {
              const isExpanded = expandedId === item.id;
              const configJson = JSON.stringify(item.config_json, null, 2);

              return (
                <div
                  key={item.id}
                  className="ui-bg-card border ui-border rounded-xl overflow-hidden"
                >
                  {/* Header row */}
                  <div
                    className={cn(
                      "p-4 flex items-center gap-4 cursor-pointer transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <ChevronDownIcon
                      className={cn(
                        "h-5 w-5 ui-text-secondary transition-transform shrink-0",
                        isExpanded && "rotate-180"
                      )}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold ui-text-heading truncate">
                          {item.name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm ui-text-secondary line-clamp-1">
                        {item.description || "No description"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1 text-sm ui-text-secondary">
                        <ServerStackIcon className="h-4 w-4" />
                        {item.server_count}
                      </div>
                      <div className="flex items-center gap-1 text-sm ui-text-secondary">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t ui-border">
                      {/* Author info */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/30 flex items-center gap-3">
                        <UserIcon className="h-5 w-5 ui-text-secondary" />
                        <div>
                          <p className="text-sm font-medium ui-text-heading">
                            {item.author_name || "Anonymous"}
                          </p>
                          <p className="text-xs ui-text-secondary">
                            {item.author_email}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="px-4 py-3 border-t ui-border">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 ui-text-secondary"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.difficulty && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-xs rounded font-medium capitalize",
                                  item.difficulty === "beginner" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                  item.difficulty === "intermediate" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                  item.difficulty === "advanced" && "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}
                              >
                                {item.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Config JSON */}
                      <div className="p-4 border-t ui-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium ui-text-heading">
                            Configuration
                          </h4>
                          <button
                            onClick={() => {
                              const encoded = btoa(encodeURIComponent(configJson));
                              window.open(`/mcp-playground?config=${encoded}`, "_blank");
                            }}
                            className="text-xs text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            Preview in Playground
                          </button>
                        </div>
                        <pre className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono overflow-x-auto max-h-64">
                          {configJson}
                        </pre>
                      </div>

                      {/* Feedback & actions */}
                      <div className="p-4 border-t ui-border bg-gray-50 dark:bg-gray-800/30">
                        <textarea
                          value={feedback[item.id] || ""}
                          onChange={(e) =>
                            setFeedback((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Feedback for the author (required for rejection)..."
                          rows={2}
                          className="ui-input w-full mb-3 text-sm resize-none"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoading === item.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionLoading === item.id ? (
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoading === item.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === item.id ? (
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            ) : (
                              <XCircleIcon className="h-5 w-5" />
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
