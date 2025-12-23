"use client";

/**
 * Documentation Management Page
 *
 * Admins can view documentation pages, manage relationships,
 * and queue AI analysis jobs.
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/design-system";
import { PageHeader } from "@/components/dashboard/shared";
import {
  FileTextIcon,
  LinkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface DocumentationItem {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  version: number;
  scrapeStatus: string | null;
  relationshipCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
  total: number;
  published: number;
  featured: number;
}

interface ApiResponse {
  documentation: DocumentationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories: Record<string, CategoryStats>;
  stats: {
    totalDocResourceRelationships: number;
    docsWithRelationships: number;
    avgConfidence: number;
  } | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "getting-started": "bg-green-500/20 text-green-400 border-green-500/30",
  configuration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "tips-and-tricks": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  api: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  integrations: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  tutorials: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  examples: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function DocumentationPage() {
  const router = useRouter();
  const [documentation, setDocumentation] = useState<DocumentationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Record<string, CategoryStats>>({});
  const [stats, setStats] = useState<ApiResponse["stats"]>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasRelationships, setHasRelationships] = useState<string>("all");

  // Navigate to detail page
  const handleDocClick = (slug: string) => {
    router.push(`/dashboard/documentation/${encodeURIComponent(slug)}`);
  };

  // Fetch documentation
  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (hasRelationships !== "all") params.set("hasRelationships", hasRelationships);

      const response = await fetch(`/api/dashboard/documentation?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch documentation");
      }

      const data: ApiResponse = await response.json();
      setDocumentation(data.documentation);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setCategories(data.categories);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryFilter, statusFilter, searchQuery, hasRelationships]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter, searchQuery, hasRelationships]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="Manage documentation pages and their resource relationships"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileTextIcon className="w-5 h-5" />}
          label="Total Docs"
          value={total}
          color="blue"
        />
        <StatCard
          icon={<LinkIcon className="w-5 h-5" />}
          label="Relationships"
          value={stats?.totalDocResourceRelationships || 0}
          color="violet"
        />
        <StatCard
          icon={<CheckCircleIcon className="w-5 h-5" />}
          label="With Relationships"
          value={stats?.docsWithRelationships || 0}
          color="green"
        />
        <StatCard
          icon={<SparklesIcon className="w-5 h-5" />}
          label="Avg Confidence"
          value={`${Math.round((stats?.avgConfidence || 0) * 100)}%`}
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
            placeholder="Search documentation..."
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

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-gray-900 border border-gray-800",
            "text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            "bg-gray-900 border border-gray-800",
            "text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>

        {/* Relationships Filter */}
        <select
          value={hasRelationships}
          onChange={(e) => setHasRelationships(e.target.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            "bg-gray-900 border border-gray-800",
            "text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">All Relationships</option>
          <option value="true">Has Relationships</option>
          <option value="false">No Relationships</option>
        </select>
      </div>

      {/* Documentation List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : documentation.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documentation found</div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Relationships</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Updated</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-800">
              {documentation.map((doc) => (
                <DocRow
                  key={doc.slug}
                  doc={doc}
                  onClick={() => handleDocClick(doc.slug)}
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
              "p-2 rounded-lg text-gray-400 hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
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
            <h3 className="font-medium text-gray-200">AI Operations</h3>
            <p className="text-sm text-gray-400 mt-1">
              Run these commands in Claude Code to analyze relationships and enhance content:
            </p>
            <div className="mt-3 space-y-2">
              <code className="block text-xs bg-gray-800 px-3 py-2 rounded text-cyan-400 font-mono">
                node scripts/analyze-relationships.mjs --all
              </code>
              <code className="block text-xs bg-gray-800 px-3 py-2 rounded text-cyan-400 font-mono">
                node scripts/rewrite-docs.mjs --slug=&lt;slug&gt;
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

// Documentation Row Component
function DocRow({
  doc,
  onClick,
}: {
  doc: DocumentationItem;
  onClick: () => void;
}) {
  const categoryColor =
    CATEGORY_COLORS[doc.category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <div
      onClick={onClick}
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3",
        "hover:bg-gray-800/50 cursor-pointer transition-colors",
        "group"
      )}
    >
      {/* Title & Description */}
      <div className="col-span-1 md:col-span-5">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="font-medium text-gray-200 truncate">{doc.title}</span>
          {doc.isFeatured && (
            <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate md:pl-6">
          {doc.description || doc.slug}
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
          {doc.category}
        </span>
      </div>

      {/* Relationships */}
      <div className="col-span-1 md:col-span-2 flex items-center gap-1">
        <LinkIcon className="w-4 h-4 text-gray-500" />
        <span
          className={cn(
            "text-sm",
            doc.relationshipCount > 0 ? "text-green-400" : "text-gray-500"
          )}
        >
          {doc.relationshipCount} resources
        </span>
      </div>

      {/* Status */}
      <div className="col-span-1 md:col-span-1 flex items-center">
        {doc.isPublished ? (
          <CheckCircleIcon className="w-4 h-4 text-green-400" />
        ) : (
          <XCircleIcon className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Updated + Version */}
      <div className="col-span-1 md:col-span-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ClockIcon className="w-3 h-3" />
          {new Date(doc.updatedAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">v{doc.version}</span>
          <ExternalLinkIcon className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
