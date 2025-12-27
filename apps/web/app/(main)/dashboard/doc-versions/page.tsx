"use client";

/**
 * Dashboard Doc Versions Admin Page
 *
 * View and manage documentation version history.
 * Admins can view version diffs and rollback documents.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  PageHeader,
  EmptyState,
  FilterBar,
  StatCard,
  StatGrid,
} from "@/components/dashboard/shared";

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  currentVersion: number;
  versionCount: number;
  lastChangedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

interface Version {
  id: string;
  version: number;
  title: string;
  changeType: string;
  changeSummary: string | null;
  changedByName: string | null;
  wordCount: number;
  createdAt: string;
}

interface Stats {
  totalDocs: number;
  totalVersions: number;
  totalHistoryEntries: number;
  lastUpdate: string | null;
}

export default function DocVersionsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Version history modal state
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);

      const response = await fetch(`/api/dashboard/doc-versions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocs(data.docs);
        setCategories(data.categories);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch docs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const fetchVersions = async (doc: Doc) => {
    setSelectedDoc(doc);
    setLoadingVersions(true);
    try {
      const response = await fetch(
        `/api/dashboard/documentation/${encodeURIComponent(doc.slug)}/versions?limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation Versions"
        description="View and manage version history for all documentation"
      />

      {/* Stats */}
      {stats && (
        <StatGrid>
          <StatCard
            label="Total Documents"
            value={stats.totalDocs}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Current Versions"
            value={stats.totalVersions}
            variant="info"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="History Entries"
            value={stats.totalHistoryEntries}
            variant="warning"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Last Update"
            value={stats.lastUpdate ? formatRelativeTime(stats.lastUpdate) : "—"}
            variant="success"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
          searchPlaceholder="Search documents..."
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
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
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
        ) : docs.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            message="No documents found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Versions
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {docs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/docs/${doc.slug}`}
                          className="text-sm font-medium text-white hover:text-cyan-400 transition-colors"
                        >
                          {doc.title}
                        </Link>
                        <p className="text-xs text-gray-500 truncate max-w-[300px]">
                          {doc.description || doc.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {doc.category ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-800 text-gray-300">
                          {doc.category}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-cyan-400">
                        v{doc.currentVersion}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">
                        {doc.versionCount} {doc.versionCount === 1 ? "version" : "versions"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white">
                          {formatRelativeTime(doc.updatedAt)}
                        </p>
                        {doc.lastChangedBy && (
                          <p className="text-xs text-gray-500">
                            by {doc.lastChangedBy}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchVersions(doc)}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium",
                            "bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                          )}
                          title="View version history"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          History
                        </button>
                        <Link
                          href={`/dashboard/documentation?highlight=${doc.slug}`}
                          className={cn(
                            "p-1.5 rounded-lg",
                            "bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                          )}
                          title="Edit document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
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

      {/* Version History Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ui-bg-modal border ui-border shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b ui-border ui-bg-modal">
              <div>
                <h3 className="text-lg font-semibold ui-text-heading">
                  Version History
                </h3>
                <p className="text-sm ui-text-secondary">{selectedDoc.title}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg ui-btn-ghost"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {loadingVersions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No version history available.
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((v, index) => (
                    <div
                      key={v.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        index === 0
                          ? "border-cyan-500/30 bg-cyan-900/10"
                          : "border-gray-800 bg-gray-800/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold text-white">
                              v{v.version}
                            </span>
                            {index === 0 && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-900/30 text-cyan-400">
                                Current
                              </span>
                            )}
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-xs font-medium",
                                v.changeType === "create"
                                  ? "bg-emerald-900/30 text-emerald-400"
                                  : v.changeType === "major"
                                  ? "bg-violet-900/30 text-violet-400"
                                  : v.changeType === "minor"
                                  ? "bg-blue-900/30 text-blue-400"
                                  : "bg-gray-800 text-gray-400"
                              )}
                            >
                              {v.changeType}
                            </span>
                          </div>
                          {v.changeSummary && (
                            <p className="text-sm text-gray-300 mt-1">
                              {v.changeSummary}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(v.createdAt)}
                            {v.changedByName && ` • by ${v.changedByName}`}
                            {v.wordCount > 0 && ` • ${v.wordCount} words`}
                          </p>
                        </div>
                        {index > 0 && (
                          <Link
                            href={`/dashboard/documentation/${encodeURIComponent(selectedDoc.slug)}/diff?from=${v.version}&to=${versions[0]?.version || selectedDoc.currentVersion}`}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded text-xs",
                              "bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                            )}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Compare
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t border-gray-800 bg-gray-900">
              <Link
                href={`/docs/${selectedDoc.slug}`}
                className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                View Document
              </Link>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
