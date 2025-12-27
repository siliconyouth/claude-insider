"use client";

/**
 * Resources Admin Management Page
 *
 * Admins can view resources, manage relationships,
 * and queue AI enhancement jobs.
 */

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { PageHeader } from "@/components/dashboard/shared";
import {
  FolderIcon,
  LinkIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  ExternalLinkIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";

interface ResourceItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  githubStars: number | null;
  githubLanguage: string | null;
  npmDownloads: number | null;
  pypiDownloads: number | null;
  viewsCount: number;
  favoritesCount: number;
  averageRating: number | null;
  aiSummary: string | null;
  aiAnalyzedAt: string | null;
  keyFeatures: string[];
  relatedDocsCount: number;
  relatedResourcesCount: number;
  docRelationshipCount: number;
  resourceRelationshipCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
  total: number;
  published: number;
  featured: number;
  enhanced: number;
}

interface ApiResponse {
  resources: ResourceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories: Record<string, CategoryStats>;
  stats: {
    total: number;
    enhanced: number;
    withSummary: number;
    withFeatures: number;
    withRelationships: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  official: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  tools: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "mcp-servers": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  rules: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  prompts: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  agents: "bg-green-500/20 text-green-400 border-green-500/30",
  tutorials: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sdks: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  showcases: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  community: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

export default function ResourcesAdminPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Record<string, CategoryStats>>({});
  const [stats, setStats] = useState<ApiResponse["stats"] | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [enhancementFilter, setEnhancementFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasRelationships, setHasRelationships] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_at");

  // Selected item for detail view
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sortBy,
      });

      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (enhancementFilter !== "all") params.set("enhancement", enhancementFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (hasRelationships !== "all") params.set("hasRelationships", hasRelationships);

      const response = await fetch(`/api/dashboard/resources-admin?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data: ApiResponse = await response.json();
      setResources(data.resources);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setCategories(data.categories);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryFilter, statusFilter, enhancementFilter, searchQuery, hasRelationships, sortBy]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter, enhancementFilter, searchQuery, hasRelationships, sortBy]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Manage resources, AI enhancements, and relationships"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<FolderIcon className="w-5 h-5" />}
          label="Total"
          value={stats?.total || 0}
          color="blue"
        />
        <StatCard
          icon={<SparklesIcon className="w-5 h-5" />}
          label="Enhanced"
          value={stats?.enhanced || 0}
          color="violet"
        />
        <StatCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="With Relationships"
          value={stats?.withRelationships || 0}
          color="cyan"
        />
        <StatCard
          icon={<CheckCircleIcon className="w-5 h-5" />}
          label="With Summary"
          value={stats?.withSummary || 0}
          color="green"
        />
        <StatCard
          icon={<StarIcon className="w-5 h-5" />}
          label="With Features"
          value={stats?.withFeatures || 0}
          color="amber"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
              "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
              "text-gray-900 dark:text-gray-200 placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
            "text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Categories</option>
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({categories[cat]?.total ?? 0})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
            "text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>

        {/* Enhancement Filter */}
        <select
          value={enhancementFilter}
          onChange={(e) => setEnhancementFilter(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
            "text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Enhancement</option>
          <option value="enhanced">Enhanced</option>
          <option value="pending">Pending</option>
        </select>

        {/* Relationships Filter */}
        <select
          value={hasRelationships}
          onChange={(e) => setHasRelationships(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
            "text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Relationships</option>
          <option value="true">Has Relationships</option>
          <option value="false">No Relationships</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
            "text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="updated_at">Recently Updated</option>
          <option value="stars">GitHub Stars</option>
          <option value="views">Most Views</option>
          <option value="rating">Highest Rated</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {/* Resources List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-500">No resources found</div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-600 dark:text-gray-500 uppercase bg-gray-50 dark:bg-transparent">
              <div className="col-span-3">Resource</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Stats</div>
              <div className="col-span-2">Relationships</div>
              <div className="col-span-1">Enhanced</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {resources.map((resource) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  isSelected={selectedResource?.id === resource.id}
                  onSelect={() => setSelectedResource(resource)}
                />
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
              "p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={cn(
              "p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CLI Command Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-5 h-5 text-violet-500 dark:text-violet-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-200">AI Operations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Run these commands in Claude Code to enhance resources and analyze relationships:
            </p>
            <div className="mt-3 space-y-2">
              <code className="block text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-cyan-600 dark:text-cyan-400 font-mono">
                node scripts/enhance-resources.mjs --all
              </code>
              <code className="block text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-cyan-600 dark:text-cyan-400 font-mono">
                node scripts/analyze-relationships.mjs --type=resource --id=&lt;uuid&gt;
              </code>
              <code className="block text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-cyan-600 dark:text-cyan-400 font-mono">
                node scripts/data-quality-review.mjs
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
  color: "blue" | "violet" | "green" | "cyan" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    green: "bg-green-500/10 text-green-400 border-green-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
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

// Resource Row Component
function ResourceRow({
  resource,
  isSelected,
  onSelect,
}: {
  resource: ResourceItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const categoryColor =
    CATEGORY_COLORS[resource.category] || "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";

  const totalRelationships = resource.docRelationshipCount + resource.resourceRelationshipCount;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3",
        "hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer transition-colors",
        isSelected && "bg-blue-50 dark:bg-gray-800/70 ring-1 ring-blue-500/50"
      )}
    >
      {/* Title & Description */}
      <div className="col-span-1 md:col-span-3">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="font-medium text-gray-900 dark:text-gray-200 truncate">{resource.title}</span>
          {resource.isFeatured && (
            <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-500 mt-1 truncate md:pl-6">
          {resource.description?.substring(0, 60) || resource.slug}
        </p>
      </div>

      {/* Category */}
      <div className="col-span-1 md:col-span-2 flex items-center">
        <span
          className={cn(
            "px-2 py-1 text-xs rounded border",
            categoryColor
          )}
        >
          {resource.category}
        </span>
      </div>

      {/* Stats */}
      <div className="col-span-1 md:col-span-2 flex items-center gap-3">
        {resource.githubStars !== null && resource.githubStars > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
            <span>{formatNumber(resource.githubStars)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <EyeIcon className="w-3.5 h-3.5" />
          <span>{formatNumber(resource.viewsCount)}</span>
        </div>
      </div>

      {/* Relationships */}
      <div className="col-span-1 md:col-span-2 flex items-center gap-1">
        <LinkIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span
          className={cn(
            "text-sm",
            totalRelationships > 0 ? "text-green-600 dark:text-green-400" : "text-gray-500"
          )}
        >
          {resource.docRelationshipCount} docs, {resource.resourceRelationshipCount} res
        </span>
      </div>

      {/* Enhanced */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        {resource.aiAnalyzedAt ? (
          <div className="flex items-center gap-1">
            <SparklesIcon className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <span className="text-[10px] text-gray-600 dark:text-gray-500">
              {resource.keyFeatures.length} feat
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-600">Pending</span>
        )}
      </div>

      {/* Status */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        {resource.isPublished ? (
          <CheckCircleIcon className="w-4 h-4 text-green-500 dark:text-green-400" />
        ) : (
          <XCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* Actions */}
      <div className="col-span-1 md:col-span-1 flex items-center gap-1">
        <Link
          href={`/resources/${resource.slug}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "text-gray-500 hover:text-blue-600 dark:hover:text-blue-400",
            "hover:bg-blue-50 dark:hover:bg-blue-500/10"
          )}
          title="View resource"
        >
          <ExternalLinkIcon className="w-4 h-4" />
        </Link>
        <Link
          href={`/admin/collections/resources/${resource.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            "text-gray-500 hover:text-violet-600 dark:hover:text-violet-400",
            "hover:bg-violet-50 dark:hover:bg-violet-500/10"
          )}
          title="Edit in admin"
        >
          <PencilIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
