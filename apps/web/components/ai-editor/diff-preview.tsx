"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/design-system";

interface DiffPreviewProps {
  original: string;
  edited: string;
  onAccept: () => void;
  onReject: () => void;
}

interface DiffLine {
  type: "unchanged" | "added" | "removed";
  content: string;
  originalLineNum: number | null;
  editedLineNum: number | null;
}

// Simple line-by-line diff algorithm
function computeDiff(original: string, edited: string): DiffLine[] {
  const originalLines = original.split("\n");
  const editedLines = edited.split("\n");
  const result: DiffLine[] = [];

  // Use LCS (Longest Common Subsequence) approach for better diffs
  const lcs = computeLCS(originalLines, editedLines);

  let originalIndex = 0;
  let editedIndex = 0;
  let originalLineNum = 1;
  let editedLineNum = 1;

  for (const match of lcs) {
    // Add removed lines (in original but not in LCS)
    while (originalIndex < match.originalIndex) {
      result.push({
        type: "removed",
        content: originalLines[originalIndex] ?? "",
        originalLineNum: originalLineNum,
        editedLineNum: null,
      });
      originalIndex++;
      originalLineNum++;
    }

    // Add added lines (in edited but not in LCS)
    while (editedIndex < match.editedIndex) {
      result.push({
        type: "added",
        content: editedLines[editedIndex] ?? "",
        originalLineNum: null,
        editedLineNum: editedLineNum,
      });
      editedIndex++;
      editedLineNum++;
    }

    // Add unchanged line
    result.push({
      type: "unchanged",
      content: originalLines[originalIndex] ?? "",
      originalLineNum: originalLineNum,
      editedLineNum: editedLineNum,
    });
    originalIndex++;
    editedIndex++;
    originalLineNum++;
    editedLineNum++;
  }

  // Add remaining removed lines
  while (originalIndex < originalLines.length) {
    result.push({
      type: "removed",
      content: originalLines[originalIndex] ?? "",
      originalLineNum: originalLineNum,
      editedLineNum: null,
    });
    originalIndex++;
    originalLineNum++;
  }

  // Add remaining added lines
  while (editedIndex < editedLines.length) {
    result.push({
      type: "added",
      content: editedLines[editedIndex] ?? "",
      originalLineNum: null,
      editedLineNum: editedLineNum,
    });
    editedIndex++;
    editedLineNum++;
  }

  return result;
}

interface LCSMatch {
  originalIndex: number;
  editedIndex: number;
}

function computeLCS(original: string[], edited: string[]): LCSMatch[] {
  const m = original.length;
  const n = edited.length;

  // Build LCS table - initialized with zeros
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    const row: number[] = [];
    for (let j = 0; j <= n; j++) {
      row[j] = 0;
    }
    dp[i] = row;
  }

  for (let i = 1; i <= m; i++) {
    const currentRow = dp[i];
    const prevRow = dp[i - 1];
    if (!currentRow || !prevRow) continue;

    for (let j = 1; j <= n; j++) {
      const prevDiag = prevRow[j - 1] ?? 0;
      const prevUp = prevRow[j] ?? 0;
      const prevLeft = currentRow[j - 1] ?? 0;

      if (original[i - 1] === edited[j - 1]) {
        currentRow[j] = prevDiag + 1;
      } else {
        currentRow[j] = Math.max(prevUp, prevLeft);
      }
    }
  }

  // Backtrack to find LCS
  const result: LCSMatch[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (original[i - 1] === edited[j - 1]) {
      result.unshift({ originalIndex: i - 1, editedIndex: j - 1 });
      i--;
      j--;
    } else {
      const prevUp = dp[i - 1]?.[j] ?? 0;
      const prevLeft = dp[i]?.[j - 1] ?? 0;
      if (prevUp > prevLeft) {
        i--;
      } else {
        j--;
      }
    }
  }

  return result;
}

export function DiffPreview({
  original,
  edited,
  onAccept,
  onReject,
}: DiffPreviewProps) {
  const [viewMode, setViewMode] = useState<"split" | "unified">("unified");

  const diffLines = useMemo(() => computeDiff(original, edited), [original, edited]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === "added") added++;
      if (line.type === "removed") removed++;
    }
    return { added, removed };
  }, [diffLines]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Diff header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#262626]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Changes Preview
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 dark:text-green-400">
              +{stats.added} added
            </span>
            <span className="text-red-600 dark:text-red-400">
              -{stats.removed} removed
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("unified")}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              viewMode === "unified"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              viewMode === "split"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            Split
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        {viewMode === "unified" ? (
          <UnifiedDiff lines={diffLines} />
        ) : (
          <SplitDiff original={original} edited={edited} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#262626]">
        <button
          onClick={onReject}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-700 dark:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-[#262626]",
            "transition-colors"
          )}
        >
          Reject Changes
        </button>
        <button
          onClick={onAccept}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium text-white",
            "bg-gradient-to-r from-green-600 to-emerald-600",
            "shadow-lg shadow-green-500/25",
            "hover:opacity-90",
            "transition-all"
          )}
        >
          Accept Changes
        </button>
      </div>
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
          <span className="w-10 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
            {line.originalLineNum ?? ""}
          </span>
          <span className="w-10 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
            {line.editedLineNum ?? ""}
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

function SplitDiff({ original, edited }: { original: string; edited: string }) {
  const originalLines = original.split("\n");
  const editedLines = edited.split("\n");
  const maxLines = Math.max(originalLines.length, editedLines.length);

  return (
    <div className="flex min-w-full">
      {/* Original side */}
      <div className="flex-1 border-r border-gray-200 dark:border-[#262626]">
        <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-xs font-medium text-red-700 dark:text-red-300 border-b border-gray-200 dark:border-[#262626]">
          Original
        </div>
        {Array.from({ length: maxLines }).map((_, i) => (
          <div key={i} className="flex px-2 py-0.5">
            <span className="w-8 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
              {i < originalLines.length ? i + 1 : ""}
            </span>
            <span className="flex-1 whitespace-pre text-gray-700 dark:text-gray-300">
              {originalLines[i] || ""}
            </span>
          </div>
        ))}
      </div>

      {/* Edited side */}
      <div className="flex-1">
        <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-xs font-medium text-green-700 dark:text-green-300 border-b border-gray-200 dark:border-[#262626]">
          Edited
        </div>
        {Array.from({ length: maxLines }).map((_, i) => (
          <div key={i} className="flex px-2 py-0.5">
            <span className="w-8 text-right pr-2 text-gray-400 dark:text-gray-600 select-none shrink-0">
              {i < editedLines.length ? i + 1 : ""}
            </span>
            <span className="flex-1 whitespace-pre text-gray-700 dark:text-gray-300">
              {editedLines[i] || ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
