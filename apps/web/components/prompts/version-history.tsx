"use client";

/**
 * Version History Component
 *
 * Displays prompt version history with ability to view and restore versions.
 *
 * Features:
 * - List of versions with timestamps
 * - Change summaries
 * - Side-by-side comparison
 * - Restore previous versions
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import {
  HistoryIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  UserIcon,
  ClockIcon,
  Loader2Icon,
  XIcon,
  DiffIcon,
} from "lucide-react";

interface PromptVersion {
  id: string;
  versionNumber: number;
  content: string;
  variables: Array<{ name: string; description?: string }>;
  changeSummary: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface VersionHistoryProps {
  promptId: string;
  promptSlug: string;
  currentContent: string;
  canEdit: boolean;
  onRestore?: (content: string) => void;
  className?: string;
}

export function VersionHistory({
  promptId,
  promptSlug: _promptSlug,
  currentContent,
  canEdit,
  onRestore,
  className,
}: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [promptId]);

  // Load versions when expanded
  useEffect(() => {
    if (isExpanded && versions.length === 0) {
      fetchVersions();
    }
  }, [isExpanded, versions.length, fetchVersions]);

  // Handle restore
  const handleRestore = async (version: PromptVersion) => {
    if (!canEdit || isRestoring) return;

    const confirmed = window.confirm(
      `Restore version ${version.versionNumber}? This will create a new version with the old content.`
    );

    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          versionId: version.id,
        }),
      });

      if (res.ok) {
        // Refresh versions and notify parent
        await fetchVersions();
        if (onRestore) {
          onRestore(version.content);
        }
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error("Error restoring version:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  // Simple diff visualization
  const renderDiff = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    // Very simple line-by-line diff (not optimal but readable)
    const maxLen = Math.max(oldLines.length, newLines.length);
    const diffLines: Array<{ type: "same" | "removed" | "added"; content: string }> = [];

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        if (oldLine !== undefined) {
          diffLines.push({ type: "same", content: oldLine });
        }
      } else {
        if (oldLine !== undefined) {
          diffLines.push({ type: "removed", content: oldLine });
        }
        if (newLine !== undefined) {
          diffLines.push({ type: "added", content: newLine });
        }
      }
    }

    return (
      <div className="font-mono text-xs leading-relaxed">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "px-2 py-0.5",
              line.type === "removed" && "bg-red-500/10 text-red-400",
              line.type === "added" && "bg-emerald-500/10 text-emerald-400",
              line.type === "same" && "text-gray-500"
            )}
          >
            <span className="select-none mr-2">
              {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
            </span>
            {line.content || " "}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("rounded-xl border border-gray-200 dark:border-[#262626]", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "text-left hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors",
          isExpanded && "border-b border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            Version History
          </span>
          {versions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500">
              {versions.length} versions
            </span>
          )}
        </div>
        <ChevronRightIcon
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No version history yet. Versions are created when the prompt is edited.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    "bg-gray-50 dark:bg-[#0a0a0a]",
                    "hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-500">
                        v{version.versionNumber}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {version.changeSummary || `Version ${version.versionNumber}`}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {version.createdBy ? (
                          <span className="flex items-center gap-1">
                            {version.createdBy.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={version.createdBy.image}
                                alt=""
                                className="w-3 h-3 rounded-full"
                              />
                            ) : (
                              <UserIcon className="w-3 h-3" />
                            )}
                            {version.createdBy.name || "Unknown"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            System
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedVersion(version);
                        setShowDiff(false);
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                      title="View version"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleRestore(version)}
                        disabled={isRestoring}
                        className="p-2 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 transition-colors disabled:opacity-50"
                        title="Restore this version"
                      >
                        <RotateCcwIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version Detail Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={cn(
              "relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col",
              "bg-white dark:bg-[#111111]",
              "rounded-2xl shadow-2xl shadow-black/20",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-500">
                    v{selectedVersion.versionNumber}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {selectedVersion.changeSummary ||
                      `Version ${selectedVersion.versionNumber}`}
                  </h2>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    showDiff
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <DiffIcon className="w-4 h-4" />
                  {showDiff ? "Hide Diff" : "Show Diff"}
                </button>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {showDiff ? (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Changes from this version to current
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#262626] overflow-hidden">
                    {renderDiff(selectedVersion.content, currentContent)}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#262626] p-4 bg-gray-50 dark:bg-[#0a0a0a]">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {canEdit && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
                <button
                  onClick={() => setSelectedVersion(null)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "text-gray-600 dark:text-gray-400",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "transition-colors"
                  )}
                >
                  Close
                </button>
                <button
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={isRestoring}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white",
                    "hover:shadow-lg transition-all",
                    "disabled:opacity-50"
                  )}
                >
                  {isRestoring ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcwIcon className="w-4 h-4" />
                  )}
                  Restore This Version
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VersionHistory;
