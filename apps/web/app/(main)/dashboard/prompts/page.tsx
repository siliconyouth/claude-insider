"use client";

/**
 * Dashboard Prompts Admin Page
 *
 * Manage all prompts including system and user prompts.
 * Admins can feature, edit, and delete prompts.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
  FilterBar,
  StatCard,
  StatGrid,
} from "@/components/dashboard/shared";
import { MODERATION_STATUS } from "@/lib/dashboard/status-config";

interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: {
    id: string;
    slug: string;
    name: string;
    icon: string;
  } | null;
  tags: string[];
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
  visibility: string;
  status: string;
  isFeatured: boolean;
  isSystem: boolean;
  useCount: number;
  saveCount: number;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

interface Stats {
  activeCount: number;
  systemCount: number;
  featuredCount: number;
  publicCount: number;
  privateCount: number;
  totalUses: number;
}

export default function PromptsAdminPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (typeFilter) params.set("type", typeFilter);

      const response = await fetch(`/api/dashboard/prompts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts);
        setCategories(data.categories);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleToggleFeatured = async (prompt: Prompt) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/dashboard/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !prompt.isFeatured }),
      });
      if (response.ok) {
        fetchPrompts();
      }
    } catch (error) {
      console.error("Failed to toggle featured:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (prompt: Prompt) => {
    if (!confirm(`Are you sure you want to delete "${prompt.title}"?`)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/dashboard/prompts/${prompt.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchPrompts();
        setSelectedPrompt(null);
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts Management"
        description="Manage system and user prompts"
      />

      {/* Stats */}
      {stats && (
        <StatGrid>
          <StatCard
            label="Active Prompts"
            value={stats.activeCount}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="System Prompts"
            value={stats.systemCount}
            variant="info"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />
          <StatCard
            label="Featured"
            value={stats.featuredCount}
            variant="warning"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <StatCard
            label="Total Uses"
            value={stats.totalUses.toLocaleString()}
            variant="success"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </StatGrid>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search prompts..."
          className="flex-1 min-w-[200px]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            "bg-gray-900/50 border border-gray-700",
            "text-gray-300 focus:border-blue-500 focus:outline-none"
          )}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            "bg-gray-900/50 border border-gray-700",
            "text-gray-300 focus:border-blue-500 focus:outline-none"
          )}
        >
          <option value="">All Types</option>
          <option value="system">System Prompts</option>
          <option value="user">User Prompts</option>
        </select>
        <Link
          href="/prompts/new"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-lg shadow-blue-500/25",
            "hover:-translate-y-0.5 transition-all"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Prompt
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            message="No prompts found"
            description="Try adjusting your filters or create a new prompt."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {prompts.map((prompt) => (
                  <tr
                    key={prompt.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/prompts/${prompt.slug}`}
                              className="text-sm font-medium text-white hover:text-cyan-400 transition-colors"
                            >
                              {prompt.title}
                            </Link>
                            {prompt.isSystem && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-900/30 text-violet-400">
                                System
                              </span>
                            )}
                            {prompt.isFeatured && (
                              <span className="text-yellow-400">⭐</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate max-w-[300px]">
                            {prompt.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {prompt.category ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-800 text-gray-300">
                          <span>{prompt.category.icon}</span>
                          {prompt.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {prompt.author ? (
                        <div>
                          <p className="text-sm text-white">{prompt.author.name}</p>
                          <p className="text-xs text-gray-500">{prompt.author.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span title="Uses">🔄 {prompt.useCount}</span>
                        <span title="Saves">💾 {prompt.saveCount}</span>
                        {prompt.ratingCount > 0 && (
                          <span title="Rating">
                            ⭐ {prompt.avgRating.toFixed(1)} ({prompt.ratingCount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          style={
                            prompt.status === "active"
                              ? MODERATION_STATUS.approved
                              : prompt.status === "deleted"
                              ? { ...MODERATION_STATUS.rejected, label: "Deleted" }
                              : { ...MODERATION_STATUS.pending, label: prompt.status }
                          }
                        />
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            prompt.visibility === "public"
                              ? "bg-emerald-900/30 text-emerald-400"
                              : prompt.visibility === "private"
                              ? "bg-gray-800 text-gray-400"
                              : "bg-yellow-900/30 text-yellow-400"
                          )}
                        >
                          {prompt.visibility}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFeatured(prompt)}
                          disabled={isUpdating}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            prompt.isFeatured
                              ? "bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          )}
                          title={prompt.isFeatured ? "Unfeature" : "Feature"}
                        >
                          <svg className="w-4 h-4" fill={prompt.isFeatured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedPrompt(prompt)}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                          title="View details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(prompt)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm",
                  page === 1
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                )}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm",
                  page === totalPages
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPrompt(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-gray-900 border border-gray-700 shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
              <h3 className="text-lg font-semibold text-white">
                {selectedPrompt.title}
              </h3>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">
                  Content
                </label>
                <pre className="mt-1 p-3 rounded-lg bg-gray-800 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                  {selectedPrompt.content}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-white">
                    {selectedPrompt.category
                      ? `${selectedPrompt.category.icon} ${selectedPrompt.category.name}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Visibility
                  </label>
                  <p className="mt-1 text-sm text-white capitalize">
                    {selectedPrompt.visibility}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Created
                  </label>
                  <p className="mt-1 text-sm text-white">
                    {new Date(selectedPrompt.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Updated
                  </label>
                  <p className="mt-1 text-sm text-white">
                    {new Date(selectedPrompt.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedPrompt.tags.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Tags
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedPrompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t border-gray-800 bg-gray-900">
              <Link
                href={`/prompts/${selectedPrompt.slug}`}
                className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                View Public Page
              </Link>
              <button
                onClick={() => {
                  handleDelete(selectedPrompt);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
