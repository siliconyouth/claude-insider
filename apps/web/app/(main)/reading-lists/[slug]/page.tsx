"use client";

/**
 * Reading List Detail Page
 *
 * Display items in a reading list with progress tracking.
 */

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getReadingListBySlug } from "@/app/actions/reading-lists";
import { ReadingListItemCard } from "@/components/reading-lists/reading-list-item-card";
import type { ReadingList, ReadingListItem } from "@/app/actions/reading-lists";

export default function ReadingListDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [list, setList] = useState<ReadingList | null>(null);
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "reading" | "completed">("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await getReadingListBySlug(slug);
    if (result.list) {
      setList(result.list);
      setItems(result.items || []);
    }
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemove = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (list) {
      setList({ ...list, item_count: list.item_count - 1 });
    }
  };

  const handleStatusChange = (itemId: string, status: "unread" | "reading" | "completed") => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status } : i))
    );
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const stats = {
    total: items.length,
    unread: items.filter((i) => i.status === "unread").length,
    reading: items.filter((i) => i.status === "reading").length,
    completed: items.filter((i) => i.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
            <div className="space-y-3 mt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">List not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            This reading list doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/reading-lists"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-cyan-400 hover:underline"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to lists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href="/reading-lists"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Reading Lists
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${list.color}20` }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={list.color}
              strokeWidth={1.5}
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {list.description}
              </p>
            )}
            {list.is_public && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-cyan-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                Public list
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "p-3 rounded-xl border transition-all text-left",
              filter === "all"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]"
            )}
          >
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "p-3 rounded-xl border transition-all text-left",
              filter === "unread"
                ? "border-gray-500 bg-gray-100 dark:bg-gray-800"
                : "border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]"
            )}
          >
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{stats.unread}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unread</p>
          </button>
          <button
            onClick={() => setFilter("reading")}
            className={cn(
              "p-3 rounded-xl border transition-all text-left",
              filter === "reading"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]"
            )}
          >
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.reading}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reading</p>
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={cn(
              "p-3 rounded-xl border transition-all text-left",
              filter === "completed"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]"
            )}
          >
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Done</p>
          </button>
        </div>

        {/* Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "all"
                ? "No items in this list yet"
                : `No ${filter} items`}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-2 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Show all items
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <ReadingListItemCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
