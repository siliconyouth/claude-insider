"use client";

/**
 * Reading Lists Page
 *
 * Display user's reading lists with create/edit functionality.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { getReadingLists, deleteReadingList, getReadingStats } from "@/app/actions/reading-lists";
import { ReadingListCard } from "@/components/reading-lists/reading-list-card";
import { ReadingListForm } from "@/components/reading-lists/reading-list-form";
import { ViewHistory } from "@/components/reading-lists/view-history";
import type { ReadingList } from "@/app/actions/reading-lists";

export default function ReadingListsPage() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [stats, setStats] = useState<{
    totalLists: number;
    totalItems: number;
    itemsRead: number;
    itemsReading: number;
    itemsUnread: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState<ReadingList | null>(null);
  const [activeTab, setActiveTab] = useState<"lists" | "history">("lists");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [listsResult, statsResult] = await Promise.all([
      getReadingLists(),
      getReadingStats(),
    ]);

    if (listsResult.lists) {
      setLists(listsResult.lists);
    }
    if (statsResult.stats) {
      setStats(statsResult.stats);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleDelete = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list? All items will be removed.")) {
      return;
    }

    const result = await deleteReadingList(listId);
    if (!result.error) {
      setLists((prev) => prev.filter((l) => l.id !== listId));
    }
  };

  const handleCreateSuccess = (list: ReadingList) => {
    setLists((prev) => [...prev, list]);
    setShowCreateForm(false);
  };

  const handleEditSuccess = (list: ReadingList) => {
    setLists((prev) => prev.map((l) => (l.id === list.id ? list : l)));
    setEditingList(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reading Lists
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Organize and track what you want to read
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "hover:shadow-lg hover:shadow-blue-500/25",
              "transition-all duration-200"
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New List
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLists}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lists</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Items</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.itemsRead}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.itemsReading}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Reading</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-gray-100 dark:bg-[#111111] rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("lists")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "lists"
                ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Lists
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "history"
                ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            History
          </button>
        </div>

        {/* Content */}
        {activeTab === "lists" ? (
          <>
            {/* Create Form Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Create Reading List
                  </h2>
                  <ReadingListForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateForm(false)}
                  />
                </div>
              </div>
            )}

            {/* Edit Form Modal */}
            {editingList && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Edit Reading List
                  </h2>
                  <ReadingListForm
                    list={editingList}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditingList(null)}
                  />
                </div>
              </div>
            )}

            {/* Lists */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl p-5 bg-gray-100 dark:bg-[#111111] h-36" />
                ))}
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
                <p className="text-xl font-medium text-gray-900 dark:text-white">No reading lists yet</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">
                  Create your first list to start organizing what you want to read
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                    "text-sm font-semibold text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600"
                  )}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Your First List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lists.map((list) => (
                  <ReadingListCard
                    key={list.id}
                    list={list}
                    onEdit={setEditingList}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ViewHistory limit={30} />
        )}
      </div>
    </div>
  );
}
