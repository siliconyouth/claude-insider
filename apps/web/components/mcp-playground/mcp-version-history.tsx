"use client";

/**
 * MCP Version History Component
 *
 * Displays version history for a saved MCP configuration.
 * Allows viewing diffs and restoring previous versions.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { getVersionHistory, restoreVersion } from "@/lib/mcp/storage";
import type { MCPConfigVersion, MCPConfig } from "@/lib/mcp/schema";
import {
  ClockIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface MCPVersionHistoryProps {
  configId: string;
  currentConfig: MCPConfig;
  onRestore: (config: MCPConfig) => void;
  className?: string;
}

export function MCPVersionHistory({
  configId,
  currentConfig: _currentConfig,
  onRestore,
  className,
}: MCPVersionHistoryProps) {
  const [versions, setVersions] = useState<MCPConfigVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  // Load version history
  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await getVersionHistory(configId);
      setVersions(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  // Load on mount
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Handle restore
  const handleRestore = useCallback(
    async (versionNumber: number) => {
      if (!confirm(`Restore to version ${versionNumber}? Current changes will be saved as a new version.`)) {
        return;
      }

      setRestoringVersion(versionNumber);

      try {
        const restored = await restoreVersion(configId, versionNumber);
        onRestore(restored.config_json);
        await loadVersions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to restore");
      } finally {
        setRestoringVersion(null);
      }
    },
    [configId, onRestore, loadVersions]
  );

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Compare configs (simple diff)
  const getConfigDiff = (oldConfig: MCPConfig, newConfig: MCPConfig) => {
    const oldServers = Object.keys(oldConfig.mcpServers || {});
    const newServers = Object.keys(newConfig.mcpServers || {});

    const added = newServers.filter((s) => !oldServers.includes(s));
    const removed = oldServers.filter((s) => !newServers.includes(s));
    const modified = oldServers.filter((s) => {
      if (!newServers.includes(s)) return false;
      return JSON.stringify(oldConfig.mcpServers[s]) !== JSON.stringify(newConfig.mcpServers[s]);
    });

    return { added, removed, modified };
  };

  if (versions.length === 0 && !isLoading) {
    return (
      <div className={cn("ui-bg-card border ui-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 ui-text-secondary">
          <ClockIcon className="h-5 w-5" />
          <span className="text-sm">No version history yet</span>
        </div>
        <p className="text-xs ui-text-secondary mt-1">
          Versions are created when you save with &quot;Create version&quot; enabled
        </p>
      </div>
    );
  }

  return (
    <div className={cn("ui-bg-card border ui-border rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b ui-border flex items-center justify-between">
        <h3 className="font-semibold ui-text-heading flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Version History
          {versions.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {versions.length}
            </span>
          )}
        </h3>
        <button
          onClick={loadVersions}
          disabled={isLoading}
          className="p-2 rounded-lg ui-btn-ghost"
          title="Refresh"
        >
          <ArrowPathIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <XMarkIcon className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-6 text-center">
          <ArrowPathIcon className="h-6 w-6 mx-auto ui-text-secondary animate-spin" />
        </div>
      )}

      {/* Version list */}
      {!isLoading && versions.length > 0 && (
        <div className="divide-y ui-border max-h-[300px] overflow-y-auto">
          {versions.map((version, index) => {
            const isExpanded = expandedVersion === version.version_number;
            const isLatest = index === 0;
            const nextVersion = index < versions.length - 1 ? versions[index + 1] : null;
            const diff = nextVersion
              ? getConfigDiff(nextVersion.config_json, version.config_json)
              : null;

            return (
              <div key={version.id} className="group">
                {/* Main row */}
                <div
                  className={cn(
                    "p-3 flex items-center gap-3 cursor-pointer transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                    isExpanded && "bg-gray-50 dark:bg-gray-800/30"
                  )}
                  onClick={() =>
                    setExpandedVersion(isExpanded ? null : version.version_number)
                  }
                >
                  {/* Expand icon */}
                  <ChevronRightIcon
                    className={cn(
                      "h-4 w-4 ui-text-secondary transition-transform shrink-0",
                      isExpanded && "rotate-90"
                    )}
                  />

                  {/* Version info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium ui-text-heading text-sm">
                        Version {version.version_number}
                      </p>
                      {isLatest && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs ui-text-secondary">
                      {formatDate(version.created_at)}
                    </p>
                  </div>

                  {/* Quick restore */}
                  {!isLatest && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version.version_number);
                      }}
                      disabled={restoringVersion !== null}
                      className="p-1.5 rounded-lg ui-btn-ghost text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Restore this version"
                    >
                      {restoringVersion === version.version_number ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pl-10 space-y-2">
                    {/* Change summary */}
                    {version.change_summary && (
                      <p className="text-xs ui-text-secondary">
                        &quot;{version.change_summary}&quot;
                      </p>
                    )}

                    {/* Diff summary */}
                    {diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {diff.added.map((s) => (
                          <span
                            key={`+${s}`}
                            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          >
                            + {s}
                          </span>
                        ))}
                        {diff.removed.map((s) => (
                          <span
                            key={`-${s}`}
                            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-red-500/10 text-red-600 dark:text-red-400"
                          >
                            - {s}
                          </span>
                        ))}
                        {diff.modified.map((s) => (
                          <span
                            key={`~${s}`}
                            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          >
                            ~ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Server count */}
                    <div className="text-xs ui-text-secondary">
                      {Object.keys(version.config_json.mcpServers || {}).length} servers
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(version.config_json, null, 2)
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium ui-btn-secondary"
                      >
                        <DocumentDuplicateIcon className="h-3.5 w-3.5 inline mr-1" />
                        Copy JSON
                      </button>

                      {!isLatest && (
                        <button
                          onClick={() => handleRestore(version.version_number)}
                          disabled={restoringVersion !== null}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium",
                            "bg-gradient-to-r from-violet-600 to-cyan-600",
                            "text-white hover:opacity-90"
                          )}
                        >
                          {restoringVersion === version.version_number ? (
                            <ArrowPathIcon className="h-3.5 w-3.5 inline mr-1 animate-spin" />
                          ) : (
                            <ArrowUturnLeftIcon className="h-3.5 w-3.5 inline mr-1" />
                          )}
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
