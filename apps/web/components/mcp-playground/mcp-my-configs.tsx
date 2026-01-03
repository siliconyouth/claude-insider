"use client";

/**
 * MCP My Configs Panel
 *
 * Displays the user's saved MCP configurations.
 * Shows both database configs (authenticated) and localStorage drafts (guests).
 * Features:
 * - Load config into editor
 * - Delete config
 * - Status indicators
 * - Submit for publishing
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getMyConfigs,
  deleteConfig,
  getLocalDrafts,
  deleteLocalDraft,
  submitForReview,
  withdrawFromReview,
} from "@/lib/mcp/storage";
import type { SavedMCPConfig, LocalMCPDraft, MCPConfig } from "@/lib/mcp/schema";
import {
  FolderOpenIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface MCPMyConfigsProps {
  onLoadConfig: (config: MCPConfig, savedConfig: SavedMCPConfig | LocalMCPDraft) => void;
  onRefresh?: () => void;
  className?: string;
}

type ConfigItem = (SavedMCPConfig | LocalMCPDraft) & { isLocal?: boolean };

// Helper to get server count from any config item
function getServerCount(item: ConfigItem): number {
  // SavedMCPConfig has server_count, LocalMCPDraft doesn't
  if ("server_count" in item && typeof item.server_count === "number") {
    return item.server_count;
  }
  // Calculate from config_json for LocalMCPDraft
  return Object.keys(item.config_json?.mcpServers || {}).length;
}

// Status badge component
type StatusConfig = { icon: typeof ClockIcon; label: string; className: string };

const STATUS_CONFIGS = {
  draft: {
    icon: DocumentDuplicateIcon,
    label: "Draft",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
  pending_review: {
    icon: ClockIcon,
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  published: {
    icon: CheckCircleIcon,
    label: "Published",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    icon: XCircleIcon,
    label: "Rejected",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  local: {
    icon: FolderOpenIcon,
    label: "Local",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
} as const satisfies Record<string, StatusConfig>;

function StatusBadge({ status }: { status: string }) {
  const config = (STATUS_CONFIGS as Record<string, StatusConfig>)[status] ?? STATUS_CONFIGS.draft;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function MCPMyConfigs({
  onLoadConfig,
  onRefresh,
  className,
}: MCPMyConfigsProps) {
  const { user: _user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load configurations
  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items: ConfigItem[] = [];

      if (isAuthenticated) {
        // Load from database
        const dbConfigs = await getMyConfigs();
        items.push(...dbConfigs);
      }

      // Always load local drafts
      const localDrafts = getLocalDrafts();
      items.push(
        ...localDrafts.map((d) => ({
          ...d,
          isLocal: true,
          status: "local" as const,
          is_public: false,
          stars_count: 0,
          forks_count: 0,
          views_count: 0,
          server_count: Object.keys(d.config_json.mcpServers || {}).length,
          forked_from_id: null,
          rejection_reason: null,
          published_at: null,
          user_id: "",
        }))
      );

      // Sort by updated_at descending
      items.sort((a, b) => {
        const aDate = new Date(a.updated_at).getTime();
        const bDate = new Date(b.updated_at).getTime();
        return bDate - aDate;
      });

      setConfigs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load configurations");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load on mount and when auth changes
  useEffect(() => {
    if (!authLoading) {
      loadConfigs();
    }
  }, [authLoading, loadConfigs]);

  // Handle delete
  const handleDelete = useCallback(
    async (item: ConfigItem) => {
      if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) {
        return;
      }

      setActionLoading(item.id);

      try {
        if (item.isLocal) {
          deleteLocalDraft(item.id);
        } else {
          await deleteConfig(item.id);
        }
        await loadConfigs();
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setActionLoading(null);
      }
    },
    [loadConfigs, onRefresh]
  );

  // Handle submit for review
  const handleSubmitForReview = useCallback(
    async (item: ConfigItem) => {
      if (item.isLocal) return;

      setActionLoading(item.id);

      try {
        await submitForReview(item.id);
        await loadConfigs();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit");
      } finally {
        setActionLoading(null);
      }
    },
    [loadConfigs]
  );

  // Handle withdraw from review
  const handleWithdraw = useCallback(
    async (item: ConfigItem) => {
      if (item.isLocal) return;

      setActionLoading(item.id);

      try {
        await withdrawFromReview(item.id);
        await loadConfigs();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to withdraw");
      } finally {
        setActionLoading(null);
      }
    },
    [loadConfigs]
  );

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "ui-bg-card border ui-border rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b ui-border flex items-center justify-between">
        <h3 className="font-semibold ui-text-heading flex items-center gap-2">
          <FolderOpenIcon className="h-5 w-5" />
          My Configurations
          {configs.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {configs.length}
            </span>
          )}
        </h3>
        <button
          onClick={loadConfigs}
          disabled={isLoading}
          className="p-2 rounded-lg ui-btn-ghost"
          title="Refresh"
        >
          <ArrowPathIcon
            className={cn("h-4 w-4", isLoading && "animate-spin")}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <ExclamationCircleIcon className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Guest notice */}
      {!authLoading && !isAuthenticated && configs.length > 0 && (
        <div className="p-3 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Local drafts only.{" "}
              <Link href="/sign-in" className="font-medium underline">
                Sign in
              </Link>{" "}
              to sync and publish.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-6 text-center">
          <ArrowPathIcon className="h-6 w-6 mx-auto ui-text-secondary animate-spin" />
          <p className="text-sm ui-text-secondary mt-2">Loading...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && configs.length === 0 && (
        <div className="p-6 text-center">
          <FolderOpenIcon className="h-8 w-8 mx-auto ui-text-secondary mb-2" />
          <p className="text-sm ui-text-secondary">No saved configurations</p>
          <p className="text-xs ui-text-secondary mt-1">
            Save your first config using the Save button
          </p>
        </div>
      )}

      {/* Config list */}
      {!isLoading && configs.length > 0 && (
        <div className="divide-y ui-border max-h-[300px] overflow-y-auto">
          {configs.map((item) => (
            <div key={item.id} className="group">
              {/* Main row */}
              <div
                className={cn(
                  "p-3 flex items-center gap-3 cursor-pointer transition-colors",
                  "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                  expandedId === item.id && "bg-gray-50 dark:bg-gray-800/30"
                )}
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                {/* Expand icon */}
                <ChevronRightIcon
                  className={cn(
                    "h-4 w-4 ui-text-secondary transition-transform shrink-0",
                    expandedId === item.id && "rotate-90"
                  )}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium ui-text-heading truncate text-sm">
                      {item.name}
                    </p>
                    <StatusBadge
                      status={item.isLocal ? "local" : (item as SavedMCPConfig).status}
                    />
                  </div>
                  <p className="text-xs ui-text-secondary">
                    {getServerCount(item)} server{getServerCount(item) !== 1 ? "s" : ""} •{" "}
                    {formatDate(item.updated_at)}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadConfig(item.config_json, item);
                    }}
                    className="p-1.5 rounded-lg ui-btn-ghost text-blue-600 dark:text-blue-400"
                    title="Load into editor"
                  >
                    <FolderOpenIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    disabled={actionLoading === item.id}
                    className="p-1.5 rounded-lg ui-btn-ghost text-red-600 dark:text-red-400"
                    title="Delete"
                  >
                    {actionLoading === item.id ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === item.id && (
                <div className="px-3 pb-3 pl-10 space-y-2">
                  {item.description && (
                    <p className="text-xs ui-text-secondary">{item.description}</p>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 ui-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {!item.isLocal &&
                    (item as SavedMCPConfig).status === "rejected" &&
                    (item as SavedMCPConfig).rejection_reason && (
                      <div className="p-2 rounded bg-red-500/10 text-xs text-red-600 dark:text-red-400">
                        <strong>Feedback:</strong>{" "}
                        {(item as SavedMCPConfig).rejection_reason}
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onLoadConfig(item.config_json, item)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium",
                        "bg-gradient-to-r from-violet-600 to-cyan-600",
                        "text-white hover:opacity-90"
                      )}
                    >
                      Load into Editor
                    </button>

                    {/* Submit for review button */}
                    {!item.isLocal &&
                      (item as SavedMCPConfig).status === "draft" && (
                        <button
                          onClick={() => handleSubmitForReview(item)}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium ui-btn-secondary"
                        >
                          <CloudArrowUpIcon className="h-3.5 w-3.5 inline mr-1" />
                          Publish
                        </button>
                      )}

                    {/* Withdraw button */}
                    {!item.isLocal &&
                      (item as SavedMCPConfig).status === "pending_review" && (
                        <button
                          onClick={() => handleWithdraw(item)}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium ui-btn-secondary text-amber-600"
                        >
                          Withdraw
                        </button>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer link to gallery */}
      <div className="p-3 border-t ui-border bg-gray-50 dark:bg-gray-800/30">
        <Link
          href="/mcp-playground/gallery"
          className="block text-center text-sm text-blue-600 dark:text-cyan-400 hover:underline"
        >
          Browse public gallery →
        </Link>
      </div>
    </div>
  );
}
