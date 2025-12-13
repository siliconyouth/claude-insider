"use client";

/**
 * FAQ Analytics Dashboard
 *
 * Admin view showing:
 * - Query statistics
 * - Popular questions
 * - Category breakdown
 * - FAQ performance metrics
 */

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/design-system";
import {
  getTrackedQueries,
  getCachedFAQs,
  getFAQStats,
  FAQ_CATEGORIES,
} from "@/lib/faq-generator";

export default function FAQAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"queries" | "faqs" | "categories">("queries");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load data synchronously - these are localStorage reads
  // refreshKey is used to invalidate cache and reload data periodically
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queries = useMemo(() => getTrackedQueries(), [refreshKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const faqs = useMemo(() => getCachedFAQs(), [refreshKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => getFAQStats(), [refreshKey]);

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Sort queries by count
  const sortedQueries = [...queries].sort((a, b) => b.count - a.count);
  const sortedFaqs = [...faqs].sort((a, b) => b.queryCount - a.queryCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">FAQ Analytics</h1>
        <p className="mt-1 text-gray-400">Track popular queries and FAQ performance</p>
      </div>

      {/* Stats Overview */}
      {stats && stats.topCategories && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Queries"
            value={stats.totalQueries}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="violet"
          />
          <StatCard
            label="Unique Questions"
            value={stats.uniqueQueries}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            }
            color="blue"
          />
          <StatCard
            label="Generated FAQs"
            value={stats.generatedFAQs}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            color="cyan"
          />
          <StatCard
            label="Categories"
            value={stats.topCategories.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            }
            color="emerald"
          />
        </div>
      )}

      {/* Top Categories Chart */}
      {stats && stats.topCategories.length > 0 && (
        <div className="bg-[#111111] rounded-xl border border-[#262626] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Categories</h2>
          <div className="space-y-3">
            {stats.topCategories.map((cat, i) => {
              const maxCount = stats.topCategories[0]?.count ?? 1;
              const percentage = (cat.count / maxCount) * 100;
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 w-32 truncate">
                    {FAQ_CATEGORIES[cat.category as keyof typeof FAQ_CATEGORIES] || cat.category}
                  </span>
                  <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        i === 0 && "bg-gradient-to-r from-violet-500 to-blue-500",
                        i === 1 && "bg-blue-500",
                        i === 2 && "bg-cyan-500",
                        i === 3 && "bg-emerald-500",
                        i >= 4 && "bg-gray-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-12 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#262626]">
        <div className="flex gap-4">
          {(["queries", "faqs", "categories"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-violet-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              )}
            >
              {tab === "queries" && "Popular Queries"}
              {tab === "faqs" && "FAQ Performance"}
              {tab === "categories" && "By Category"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#111111] rounded-xl border border-[#262626] overflow-hidden">
        {activeTab === "queries" && (
          <div className="divide-y divide-[#262626]">
            {sortedQueries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No queries tracked yet. Queries are stored in browser localStorage.
              </div>
            ) : (
              sortedQueries.slice(0, 20).map((query, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <span
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      i === 0 && "bg-yellow-500/20 text-yellow-400",
                      i === 1 && "bg-gray-500/20 text-gray-300",
                      i === 2 && "bg-amber-700/20 text-amber-600",
                      i > 2 && "bg-gray-800 text-gray-500"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{query.query}</p>
                    <p className="text-xs text-gray-500">
                      Category: {FAQ_CATEGORIES[query.category as keyof typeof FAQ_CATEGORIES] || query.category || "general"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{query.count}</span>
                    <p className="text-xs text-gray-500">times</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="divide-y divide-[#262626]">
            {sortedFaqs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No FAQs generated yet. FAQs are created from popular queries.
              </div>
            ) : (
              sortedFaqs.map((faq) => (
                <div key={faq.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{faq.question}</p>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{faq.answer}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          Category: {FAQ_CATEGORIES[faq.category as keyof typeof FAQ_CATEGORIES] || faq.category}
                        </span>
                        <span className="text-xs text-gray-500">Asked {faq.queryCount} times</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <ThumbUpIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{faq.helpful}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">helpful</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-red-400">
                          <ThumbDownIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{faq.notHelpful}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">not helpful</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="divide-y divide-[#262626]">
            {Object.entries(FAQ_CATEGORIES).map(([key, label]) => {
              const categoryQueries = queries.filter((q) => q.category === key);
              const categoryFaqs = faqs.filter((f) => f.category === key);
              const totalCount = categoryQueries.reduce((sum, q) => sum + q.count, 0);

              return (
                <div key={key} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-xs text-gray-500">
                      {categoryQueries.length} queries, {categoryFaqs.length} FAQs
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{totalCount}</span>
                    <p className="text-xs text-gray-500">total asks</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note about localStorage */}
      <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/20">
        <p className="text-sm text-violet-400">
          <strong>Note:</strong> FAQ analytics data is stored in your browser&apos;s localStorage. This data is
          specific to your browser and won&apos;t sync across devices. For production use, consider implementing
          server-side analytics.
        </p>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "violet" | "blue" | "cyan" | "emerald";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = {
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/30",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className={cn("bg-gradient-to-br rounded-xl p-4 border", colors[color])}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-black/20">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Icons
function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
      />
    </svg>
  );
}
