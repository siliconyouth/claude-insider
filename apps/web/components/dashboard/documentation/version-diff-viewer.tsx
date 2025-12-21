"use client";

/**
 * Version Diff Viewer Component
 *
 * Displays a side-by-side or unified diff view of two documentation versions.
 * Supports:
 * - Toggle between unified and split views
 * - Line-by-line highlighting
 * - Version metadata display
 * - Rollback action
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/design-system";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  fromLine: number | null;
  toLine: number | null;
}

interface VersionInfo {
  version: number;
  title: string;
  changeType: string;
  createdAt: string;
  lineCount: number;
}

interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

interface VersionDiffViewerProps {
  from: VersionInfo;
  to: VersionInfo;
  diff: DiffLine[];
  stats: DiffStats;
  onRollback?: (version: number) => void;
  isRollingBack?: boolean;
  canRollback?: boolean;
}

export function VersionDiffViewer({
  from,
  to,
  diff,
  stats,
  onRollback,
  isRollingBack = false,
  canRollback = false,
}: VersionDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [showUnchanged, setShowUnchanged] = useState(true);

  // Filter lines based on settings
  const filteredDiff = useMemo(() => {
    if (showUnchanged) return diff;
    return diff.filter((line) => line.type !== "unchanged");
  }, [diff, showUnchanged]);

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Change type badge color
  const getChangeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      scrape_update: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      manual_edit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      ai_rewrite: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
      rollback: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      current: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[type] || colors.update;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626]">
        <div className="flex items-center gap-6">
          {/* From version */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">From:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              v{from.version}
            </span>
            <span className={cn("px-2 py-0.5 rounded text-xs", getChangeTypeBadge(from.changeType))}>
              {from.changeType.replace("_", " ")}
            </span>
          </div>

          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>

          {/* To version */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">To:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              v{to.version}
            </span>
            <span className={cn("px-2 py-0.5 rounded text-xs", getChangeTypeBadge(to.changeType))}>
              {to.changeType.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Stats and controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 dark:text-green-400">
              +{stats.additions} added
            </span>
            <span className="text-red-600 dark:text-red-400">
              -{stats.deletions} removed
            </span>
            {showUnchanged && (
              <span className="text-gray-500 dark:text-gray-400">
                {stats.unchanged} unchanged
              </span>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
            <button
              onClick={() => setViewMode("unified")}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "unified"
                  ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "split"
                  ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Split
            </button>
          </div>

          {/* Show unchanged toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showUnchanged}
              onChange={(e) => setShowUnchanged(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Show unchanged
          </label>
        </div>
      </div>

      {/* Version metadata */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50/50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#262626]">
        <div className="text-sm">
          <div className="text-gray-500 dark:text-gray-400 mb-1">
            {formatDate(from.createdAt)}
          </div>
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {from.title}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {from.lineCount} lines
          </div>
        </div>
        <div className="text-sm">
          <div className="text-gray-500 dark:text-gray-400 mb-1">
            {formatDate(to.createdAt)}
          </div>
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {to.title}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {to.lineCount} lines
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        {viewMode === "unified" ? (
          <UnifiedDiff lines={filteredDiff} />
        ) : (
          <SplitDiff lines={filteredDiff} from={from} to={to} />
        )}
      </div>

      {/* Rollback action */}
      {canRollback && onRollback && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#111111] border-t border-gray-200 dark:border-[#262626]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rollback will create a new version with the content from v{from.version}
          </p>
          <button
            onClick={() => onRollback(from.version)}
            disabled={isRollingBack}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-amber-500 text-white hover:bg-amber-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isRollingBack ? "Rolling back..." : `Rollback to v${from.version}`}
          </button>
        </div>
      )}
    </div>
  );
}

function UnifiedDiff({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="min-w-full">
      {lines.map((line, index) => (
        <div
          key={index}
          className={cn(
            "flex px-4 py-0.5",
            line.type === "added" && "bg-green-50 dark:bg-green-900/20",
            line.type === "removed" && "bg-red-50 dark:bg-red-900/20"
          )}
        >
          {/* Line numbers */}
          <span className="w-12 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
            {line.fromLine ?? ""}
          </span>
          <span className="w-12 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
            {line.toLine ?? ""}
          </span>

          {/* Change indicator */}
          <span
            className={cn(
              "w-5 text-center shrink-0",
              line.type === "added" && "text-green-600 dark:text-green-400",
              line.type === "removed" && "text-red-600 dark:text-red-400"
            )}
          >
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
          </span>

          {/* Content */}
          <span
            className={cn(
              "flex-1 whitespace-pre",
              line.type === "added" && "text-green-800 dark:text-green-200",
              line.type === "removed" && "text-red-800 dark:text-red-200",
              line.type === "unchanged" && "text-gray-700 dark:text-gray-300"
            )}
          >
            {line.content || " "}
          </span>
        </div>
      ))}
    </div>
  );
}

function SplitDiff({
  lines,
  from,
  to,
}: {
  lines: DiffLine[];
  from: VersionInfo;
  to: VersionInfo;
}) {
  // Separate lines into left (removed/unchanged) and right (added/unchanged)
  const leftLines: (DiffLine | null)[] = [];
  const rightLines: (DiffLine | null)[] = [];

  let leftIdx = 0;
  let rightIdx = 0;

  for (const line of lines) {
    if (line.type === "unchanged") {
      leftLines.push(line);
      rightLines.push(line);
      leftIdx++;
      rightIdx++;
    } else if (line.type === "removed") {
      leftLines.push(line);
      rightLines.push(null);
      leftIdx++;
    } else if (line.type === "added") {
      leftLines.push(null);
      rightLines.push(line);
      rightIdx++;
    }
  }

  const maxLines = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="flex min-w-full">
      {/* Left side (from) */}
      <div className="flex-1 border-r border-gray-200 dark:border-[#262626]">
        <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-xs font-medium text-red-700 dark:text-red-300 border-b border-gray-200 dark:border-[#262626]">
          v{from.version} - {from.title}
        </div>
        {Array.from({ length: maxLines }).map((_, i) => {
          const line = leftLines[i];
          return (
            <div
              key={i}
              className={cn(
                "flex px-2 py-0.5",
                line?.type === "removed" && "bg-red-50 dark:bg-red-900/20"
              )}
            >
              <span className="w-8 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
                {line?.fromLine ?? ""}
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-pre",
                  line?.type === "removed"
                    ? "text-red-800 dark:text-red-200"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {line?.content || ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Right side (to) */}
      <div className="flex-1">
        <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-xs font-medium text-green-700 dark:text-green-300 border-b border-gray-200 dark:border-[#262626]">
          v{to.version} - {to.title}
        </div>
        {Array.from({ length: maxLines }).map((_, i) => {
          const line = rightLines[i];
          return (
            <div
              key={i}
              className={cn(
                "flex px-2 py-0.5",
                line?.type === "added" && "bg-green-50 dark:bg-green-900/20"
              )}
            >
              <span className="w-8 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
                {line?.toLine ?? ""}
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-pre",
                  line?.type === "added"
                    ? "text-green-800 dark:text-green-200"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {line?.content || ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
