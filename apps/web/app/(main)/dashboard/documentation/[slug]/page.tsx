"use client";

/**
 * Documentation Detail Page with Version History
 *
 * Shows a single documentation page with:
 * - Current content preview
 * - Version history list
 * - Diff viewer for comparing versions
 * - Rollback functionality for admins
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { PageHeader } from "@/components/dashboard/shared";
import { VersionDiffViewer } from "@/components/dashboard/documentation/version-diff-viewer";
import {
  ArrowLeftIcon,
  FileTextIcon,
  ClockIcon,
  UserIcon,
  GitBranchIcon,
  SparklesIcon,
  ChevronRightIcon,
  HistoryIcon,
  RefreshCwIcon,
  EyeIcon,
  DiffIcon,
} from "lucide-react";

interface VersionItem {
  id: string | null;
  version: number;
  title: string;
  description: string | null;
  changeType: string;
  changeSummary: string | null;
  changedBy: string | null;
  changedByName: string | null;
  aiModel: string | null;
  aiConfidence: number | null;
  wordCount: number;
  createdAt: string;
  isCurrent?: boolean;
}

interface DocumentDetail {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  sources: string[] | null;
  version: number;
  isPublished: boolean;
  isFeatured: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  fromLine: number | null;
  toLine: number | null;
}

interface DiffResult {
  from: {
    version: number;
    title: string;
    changeType: string;
    createdAt: string;
    lineCount: number;
  };
  to: {
    version: number;
    title: string;
    changeType: string;
    createdAt: string;
    lineCount: number;
  };
  diff: DiffLine[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  create: { label: "Created", icon: <SparklesIcon className="w-3 h-3" /> },
  update: { label: "Updated", icon: <RefreshCwIcon className="w-3 h-3" /> },
  scrape_update: { label: "Auto-scraped", icon: <RefreshCwIcon className="w-3 h-3" /> },
  manual_edit: { label: "Manual edit", icon: <UserIcon className="w-3 h-3" /> },
  ai_rewrite: { label: "AI rewrite", icon: <SparklesIcon className="w-3 h-3" /> },
  rollback: { label: "Rollback", icon: <HistoryIcon className="w-3 h-3" /> },
  current: { label: "Current", icon: <EyeIcon className="w-3 h-3" /> },
};

export default function DocumentationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Data states
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comparison states
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Rollback states
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [canRollback, setCanRollback] = useState(false);

  // Fetch document and versions
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch document details
      const docResponse = await fetch(`/api/dashboard/documentation/${encodeURIComponent(slug)}`);
      if (!docResponse.ok) {
        if (docResponse.status === 404) {
          throw new Error("Documentation not found");
        }
        throw new Error("Failed to fetch documentation");
      }
      const docData = await docResponse.json();
      setDoc(docData.documentation);
      setCurrentVersion(docData.documentation.version);
      setCanRollback(docData.userRole === "admin" || docData.userRole === "superadmin");

      // Fetch version history
      const versionsResponse = await fetch(
        `/api/dashboard/documentation/${encodeURIComponent(slug)}/versions?limit=50`
      );
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();

        // Add current version at the top if not already present
        const allVersions: VersionItem[] = [
          {
            id: null,
            version: docData.documentation.version,
            title: docData.documentation.title,
            description: docData.documentation.description,
            changeType: "current",
            changeSummary: "Current version",
            changedBy: null,
            changedByName: null,
            aiModel: null,
            aiConfidence: null,
            wordCount: docData.documentation.wordCount,
            createdAt: docData.documentation.updatedAt,
            isCurrent: true,
          },
          ...versionsData.versions,
        ];

        setVersions(allVersions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle version selection for comparison
  const toggleVersionSelection = (version: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version);
      }
      if (prev.length >= 2) {
        // Replace oldest selection - prev[1] is guaranteed to exist since length >= 2
        const second = prev[1] as number;
        return [second, version];
      }
      return [...prev, version];
    });
    setShowDiff(false);
    setDiffResult(null);
  };

  // Compare selected versions
  const compareVersions = async () => {
    if (selectedVersions.length !== 2) return;

    setIsComparing(true);
    try {
      const [from, to] = selectedVersions.sort((a, b) => a - b);
      const response = await fetch(
        `/api/dashboard/documentation/${encodeURIComponent(slug)}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromVersion: from, toVersion: to }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to compare versions");
      }

      const data = await response.json();
      setDiffResult(data);
      setShowDiff(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setIsComparing(false);
    }
  };

  // Handle rollback
  const handleRollback = async (version: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${version}?`)) return;

    setIsRollingBack(true);
    try {
      const response = await fetch(
        `/api/dashboard/documentation/${encodeURIComponent(slug)}/versions/${version}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: `Rolled back via dashboard` }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Rollback failed");
      }

      // Refresh data
      await fetchData();
      setShowDiff(false);
      setDiffResult(null);
      setSelectedVersions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setIsRollingBack(false);
    }
  };

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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/documentation"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Documentation
        </Link>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/documentation"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Documentation
      </Link>

      <PageHeader
        title={doc.title}
        description={doc.description || `Version ${doc.version} • ${doc.category}`}
      />

      {/* Document Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard
          icon={<GitBranchIcon className="w-4 h-4" />}
          label="Current Version"
          value={`v${doc.version}`}
        />
        <InfoCard
          icon={<FileTextIcon className="w-4 h-4" />}
          label="Word Count"
          value={doc.wordCount.toLocaleString()}
        />
        <InfoCard
          icon={<ClockIcon className="w-4 h-4" />}
          label="Last Updated"
          value={formatDate(doc.updatedAt)}
        />
        <InfoCard
          icon={<HistoryIcon className="w-4 h-4" />}
          label="Total Versions"
          value={versions.length.toString()}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version History Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-gray-400" />
              Version History
            </h2>
            {selectedVersions.length === 2 && (
              <button
                onClick={compareVersions}
                disabled={isComparing}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                  "hover:bg-blue-500/30 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-1.5"
                )}
              >
                <DiffIcon className="w-4 h-4" />
                {isComparing ? "Comparing..." : "Compare"}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Select two versions to compare changes
          </p>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden max-h-[600px] overflow-y-auto">
            {versions.map((version) => (
              <VersionRow
                key={version.version}
                version={version}
                isSelected={selectedVersions.includes(version.version)}
                isCurrent={version.isCurrent}
                onToggle={() => toggleVersionSelection(version.version)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>

        {/* Diff Viewer or Content Preview */}
        <div className="lg:col-span-2">
          {showDiff && diffResult ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden h-[600px]">
              <VersionDiffViewer
                from={diffResult.from}
                to={diffResult.to}
                diff={diffResult.diff}
                stats={diffResult.stats}
                onRollback={handleRollback}
                isRollingBack={isRollingBack}
                canRollback={canRollback && diffResult.from.version !== currentVersion}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <EyeIcon className="w-4 h-4 text-gray-400" />
                  Content Preview
                </h3>
                <Link
                  href={`/docs/${slug}`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Live Page →
                </Link>
              </div>
              <div className="p-4 max-h-[550px] overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {doc.content.slice(0, 3000)}
                  {doc.content.length > 3000 && (
                    <span className="text-gray-500">
                      {"\n\n"}... [{doc.content.length - 3000} more characters]
                    </span>
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="font-medium text-white mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/docs/${slug}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm",
              "bg-gray-800 text-gray-300 hover:text-white",
              "hover:bg-gray-700 transition-colors",
              "flex items-center gap-2"
            )}
          >
            <EyeIcon className="w-4 h-4" />
            View Live Page
          </Link>
          <Link
            href={`/dashboard/relationships?doc=${encodeURIComponent(slug)}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm",
              "bg-gray-800 text-gray-300 hover:text-white",
              "hover:bg-gray-700 transition-colors",
              "flex items-center gap-2"
            )}
          >
            <GitBranchIcon className="w-4 h-4" />
            View Relationships
          </Link>
        </div>
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

// Version Row Component
function VersionRow({
  version,
  isSelected,
  isCurrent,
  onToggle,
  formatDate,
}: {
  version: VersionItem;
  isSelected: boolean;
  isCurrent?: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}) {
  const defaultChangeType = { label: "Updated", icon: <RefreshCwIcon className="w-3 h-3" /> };
  const changeType = CHANGE_TYPE_LABELS[version.changeType] ?? defaultChangeType;

  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0",
        "cursor-pointer transition-all",
        isSelected
          ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/30"
          : "hover:bg-gray-800/50",
        isCurrent && "bg-green-500/5"
      )}
    >
      {/* Selection Checkbox */}
      <div
        className={cn(
          "w-5 h-5 rounded border flex items-center justify-center shrink-0",
          isSelected
            ? "bg-blue-500 border-blue-500"
            : "border-gray-600 hover:border-gray-500"
        )}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Version Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">v{version.version}</span>
          {isCurrent && (
            <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">
              Current
            </span>
          )}
          <span className={cn(
            "px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1",
            version.changeType === "ai_rewrite"
              ? "bg-violet-500/20 text-violet-400"
              : version.changeType === "rollback"
              ? "bg-red-500/20 text-red-400"
              : "bg-gray-700 text-gray-400"
          )}>
            {changeType.icon}
            {changeType.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <ClockIcon className="w-3 h-3" />
          {formatDate(version.createdAt)}
          {version.changedByName && (
            <>
              <span>•</span>
              <UserIcon className="w-3 h-3" />
              {version.changedByName}
            </>
          )}
        </div>
        {version.changeSummary && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {version.changeSummary}
          </p>
        )}
      </div>

      <ChevronRightIcon className="w-4 h-4 text-gray-600 shrink-0" />
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-40 bg-gray-800 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-[500px] bg-gray-800 rounded-xl animate-pulse" />
        <div className="lg:col-span-2 h-[500px] bg-gray-800 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
