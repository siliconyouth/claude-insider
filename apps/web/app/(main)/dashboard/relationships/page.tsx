"use client";

/**
 * Relationships Overview Page
 *
 * Manage all relationships between documentation and resources.
 * View AI-generated and manual relationships with confidence scores.
 */

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { PageHeader } from "@/components/dashboard/shared";
import {
  LinkIcon,
  FileTextIcon,
  FolderIcon,
  SparklesIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  ArrowRightIcon,
} from "lucide-react";

interface DocResourceRelationship {
  id: string;
  docSlug: string;
  docTitle: string;
  docCategory: string;
  resourceId: string;
  resourceSlug: string;
  resourceTitle: string;
  resourceCategory: string;
  relationshipType: string;
  confidenceScore: number;
  aiReasoning: string | null;
  isManual: boolean;
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
}

interface ResourceResourceRelationship {
  id: string;
  sourceResourceId: string;
  sourceSlug: string;
  sourceTitle: string;
  sourceCategory: string;
  targetResourceId: string;
  targetSlug: string;
  targetTitle: string;
  targetCategory: string;
  relationshipType: string;
  confidenceScore: number;
  aiReasoning: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DocResourceStats {
  total: number;
  manual: number;
  aiGenerated: number;
  avgConfidence: number;
  uniqueDocs: number;
  uniqueResources: number;
}

interface ResourceResourceStats {
  total: number;
  manual: number;
  aiGenerated: number;
  avgConfidence: number;
}

interface DocResourceApiResponse {
  type: "doc_resource";
  relationships: DocResourceRelationship[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: DocResourceStats;
  typeCounts: Record<string, number>;
}

interface ResourceResourceApiResponse {
  type: "resource_resource";
  relationships: ResourceResourceRelationship[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ResourceResourceStats;
  typeCounts: Record<string, number>;
}

const RELATIONSHIP_TYPE_COLORS: Record<string, string> = {
  required: "bg-red-500/20 text-red-400 border-red-500/30",
  recommended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  related: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  example: "bg-green-500/20 text-green-400 border-green-500/30",
  alternative: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  complement: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  similar: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function RelationshipsPage() {
  const [activeTab, setActiveTab] = useState<"doc_resource" | "resource_resource">("doc_resource");
  const [docResourceRels, setDocResourceRels] = useState<DocResourceRelationship[]>([]);
  const [resResourceRels, setResResourceRels] = useState<ResourceResourceRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [docResStats, setDocResStats] = useState<DocResourceStats | null>(null);
  const [resResStats, setResResStats] = useState<ResourceResourceStats | null>(null);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<string>("all");
  const [isManualFilter, setIsManualFilter] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState<string>("");

  // Fetch relationships
  const fetchRelationships = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "30",
        type: activeTab,
      });

      if (searchQuery) params.set("search", searchQuery);
      if (relationshipTypeFilter !== "all") params.set("relationshipType", relationshipTypeFilter);
      if (isManualFilter !== "all") params.set("isManual", isManualFilter);
      if (minConfidence) params.set("minConfidence", minConfidence);

      const response = await fetch(`/api/dashboard/relationships?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch relationships");
      }

      const data = await response.json();

      if (activeTab === "doc_resource") {
        const typedData = data as DocResourceApiResponse;
        setDocResourceRels(typedData.relationships);
        setDocResStats(typedData.stats);
        setTotalPages(typedData.pagination.totalPages);
        setTotal(typedData.pagination.total);
        setTypeCounts(typedData.typeCounts);
      } else {
        const typedData = data as ResourceResourceApiResponse;
        setResResourceRels(typedData.relationships);
        setResResStats(typedData.stats);
        setTotalPages(typedData.pagination.totalPages);
        setTotal(typedData.pagination.total);
        setTypeCounts(typedData.typeCounts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, searchQuery, relationshipTypeFilter, isManualFilter, minConfidence]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, relationshipTypeFilter, isManualFilter, minConfidence]);

  const currentStats = activeTab === "doc_resource" ? docResStats : resResStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relationships"
        description="Manage connections between documentation and resources"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab("doc_resource")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "doc_resource"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
          )}
        >
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-4 h-4" />
            <ArrowRightIcon className="w-3 h-3" />
            <FolderIcon className="w-4 h-4" />
            <span>Doc → Resource</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("resource_resource")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "resource_resource"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
          )}
        >
          <div className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4" />
            <ArrowRightIcon className="w-3 h-3" />
            <FolderIcon className="w-4 h-4" />
            <span>Resource → Resource</span>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="Total"
          value={currentStats?.total || 0}
          color="blue"
        />
        <StatCard
          icon={<SparklesIcon className="w-5 h-5" />}
          label="AI Generated"
          value={currentStats?.aiGenerated || 0}
          color="violet"
        />
        <StatCard
          icon={<UserIcon className="w-5 h-5" />}
          label="Manual"
          value={currentStats?.manual || 0}
          color="green"
        />
        <StatCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="Avg Confidence"
          value={`${Math.round((currentStats?.avgConfidence || 0) * 100)}%`}
          color="cyan"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
              "bg-gray-900 border border-gray-800",
              "text-gray-200 placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          />
        </div>

        {/* Relationship Type Filter */}
        <select
          value={relationshipTypeFilter}
          onChange={(e) => setRelationshipTypeFilter(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-gray-900 border border-gray-800",
            "text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Types</option>
          {Object.keys(typeCounts).map((type) => (
            <option key={type} value={type}>
              {type} ({typeCounts[type]})
            </option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          value={isManualFilter}
          onChange={(e) => setIsManualFilter(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-gray-900 border border-gray-800",
            "text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Sources</option>
          <option value="true">Manual Only</option>
          <option value="false">AI Generated</option>
        </select>

        {/* Confidence Filter */}
        <select
          value={minConfidence}
          onChange={(e) => setMinConfidence(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-gray-900 border border-gray-800",
            "text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="">Any Confidence</option>
          <option value="0.9">90%+</option>
          <option value="0.8">80%+</option>
          <option value="0.7">70%+</option>
          <option value="0.6">60%+</option>
        </select>
      </div>

      {/* Relationships List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (activeTab === "doc_resource" ? docResourceRels : resResourceRels).length === 0 ? (
          <div className="p-8 text-center text-gray-500">No relationships found</div>
        ) : activeTab === "doc_resource" ? (
          <>
            {/* Doc-Resource Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-4">Documentation</div>
              <div className="col-span-4">Resource</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Confidence</div>
              <div className="col-span-1">Source</div>
            </div>

            {/* Doc-Resource Body */}
            <div className="divide-y divide-gray-800">
              {docResourceRels.map((rel) => (
                <DocResourceRow key={rel.id} relationship={rel} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Resource-Resource Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-4">Source Resource</div>
              <div className="col-span-4">Target Resource</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Confidence</div>
              <div className="col-span-1">Source</div>
            </div>

            {/* Resource-Resource Body */}
            <div className="divide-y divide-gray-800">
              {resResourceRels.map((rel) => (
                <ResourceResourceRow key={rel.id} relationship={rel} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={cn(
              "p-2 rounded-lg text-gray-400 hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={cn(
              "p-2 rounded-lg text-gray-400 hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CLI Command Info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-5 h-5 text-violet-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-200">AI Relationship Analysis</h3>
            <p className="text-sm text-gray-400 mt-1">
              Run these commands in Claude Code to analyze and discover new relationships:
            </p>
            <div className="mt-3 space-y-2">
              <code className="block text-xs bg-gray-800 px-3 py-2 rounded text-cyan-400 font-mono">
                node scripts/analyze-relationships.mjs --all
              </code>
              <code className="block text-xs bg-gray-800 px-3 py-2 rounded text-cyan-400 font-mono">
                node scripts/analyze-relationships.mjs --type=resource --pending
              </code>
              <code className="block text-xs bg-gray-800 px-3 py-2 rounded text-cyan-400 font-mono">
                node scripts/analyze-relationships.mjs --slug=api/tool-use
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "blue" | "violet" | "green" | "cyan";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    green: "bg-green-500/10 text-green-400 border-green-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        "bg-gray-900/50",
        colorClasses[color]
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// Doc-Resource Row Component
function DocResourceRow({ relationship }: { relationship: DocResourceRelationship }) {
  const typeColor =
    RELATIONSHIP_TYPE_COLORS[relationship.relationshipType] ||
    "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors">
      {/* Documentation */}
      <div className="col-span-1 md:col-span-4">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium text-gray-200 truncate">{relationship.docTitle}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 md:pl-6 truncate">
          {relationship.docCategory} / {relationship.docSlug}
        </p>
      </div>

      {/* Resource */}
      <div className="col-span-1 md:col-span-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="font-medium text-gray-200 truncate">{relationship.resourceTitle}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 md:pl-6 truncate">
          {relationship.resourceCategory} / {relationship.resourceSlug}
        </p>
      </div>

      {/* Type */}
      <div className="col-span-1 md:col-span-2 flex items-center">
        <span className={cn("px-2 py-1 text-xs rounded border", typeColor)}>
          {relationship.relationshipType}
        </span>
      </div>

      {/* Confidence */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        <ConfidenceBadge score={relationship.confidenceScore} />
      </div>

      {/* Source */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        {relationship.isManual ? (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <UserIcon className="w-3 h-3" />
            Manual
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-violet-400">
            <SparklesIcon className="w-3 h-3" />
            AI
          </span>
        )}
      </div>
    </div>
  );
}

// Resource-Resource Row Component
function ResourceResourceRow({ relationship }: { relationship: ResourceResourceRelationship }) {
  const typeColor =
    RELATIONSHIP_TYPE_COLORS[relationship.relationshipType] ||
    "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors">
      {/* Source Resource */}
      <div className="col-span-1 md:col-span-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium text-gray-200 truncate">{relationship.sourceTitle}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 md:pl-6 truncate">
          {relationship.sourceCategory} / {relationship.sourceSlug}
        </p>
      </div>

      {/* Target Resource */}
      <div className="col-span-1 md:col-span-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="font-medium text-gray-200 truncate">{relationship.targetTitle}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 md:pl-6 truncate">
          {relationship.targetCategory} / {relationship.targetSlug}
        </p>
      </div>

      {/* Type */}
      <div className="col-span-1 md:col-span-2 flex items-center">
        <span className={cn("px-2 py-1 text-xs rounded border", typeColor)}>
          {relationship.relationshipType}
        </span>
      </div>

      {/* Confidence */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        <ConfidenceBadge score={relationship.confidenceScore} />
      </div>

      {/* Source */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        {relationship.isManual ? (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <UserIcon className="w-3 h-3" />
            Manual
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-violet-400">
            <SparklesIcon className="w-3 h-3" />
            AI
          </span>
        )}
      </div>
    </div>
  );
}

// Confidence Badge Component
function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 90
      ? "text-green-400"
      : percentage >= 70
        ? "text-yellow-400"
        : percentage >= 50
          ? "text-orange-400"
          : "text-red-400";

  return <span className={cn("text-sm font-medium", color)}>{percentage}%</span>;
}
