"use client";

/**
 * Favorites Page
 *
 * Lists all user favorites with filtering and collection management.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getFavorites, removeFavorite, getCollections } from "@/lib/favorites";
import { CollectionCard, CollectionCardSkeleton } from "@/components/favorites";
import { CollectionPicker } from "@/components/favorites/collection-picker";
import { useToast } from "@/components/toast";
import type { FavoriteWithDetails, CollectionWithCount, FavoriteResourceType } from "@/types/favorites";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FavoriteResourceType | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteWithDetails | null>(null);
  const toast = useToast();

  // Fetch favorites and collections
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [favResult, colResult] = await Promise.all([
          getFavorites({
            resourceType: filter === "all" ? undefined : filter,
            page,
            limit: 20,
          }),
          getCollections(),
        ]);

        if (!cancelled) {
          setFavorites(favResult.items);
          setTotalPages(favResult.totalPages);
          setTotal(favResult.total);
          setCollections(colResult.collections);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load favorites");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [filter, page, toast]);

  const handleRemoveFavorite = useCallback(
    async (favorite: FavoriteWithDetails) => {
      // Optimistic update
      setFavorites((prev) => prev.filter((f) => f.id !== favorite.id));
      setTotal((prev) => prev - 1);

      try {
        await removeFavorite(favorite.id);
        toast.success("Removed from favorites");
      } catch {
        // Revert on error
        setFavorites((prev) => [...prev, favorite].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setTotal((prev) => prev + 1);
        toast.error("Failed to remove favorite");
      }
    },
    [toast]
  );

  const handleOpenPicker = useCallback((favorite: FavoriteWithDetails) => {
    setSelectedFavorite(favorite);
    setPickerOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Favorites
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Your saved resources and documentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/favorites/collections"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400",
              "transition-colors"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Collections
          </Link>
        </div>
      </div>

      {/* Collections preview */}
      {collections.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Collections
            </h2>
            <Link
              href="/favorites/collections"
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? [...Array(3)].map((_, i) => <CollectionCardSkeleton key={i} />)
              : collections.slice(0, 3).map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
        {(["all", "resource", "doc"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            {f === "all" ? "All" : f === "resource" ? "Resources" : "Docs"}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {total} {total === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Favorites list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#262626] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start exploring and save your favorite resources!
          </p>
          <Link
            href="/resources"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-transform"
            )}
          >
            Browse Resources
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-xl",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/50",
                  "transition-all duration-200"
                )}
              >
                {/* Type badge */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    favorite.resourceType === "resource"
                      ? "bg-violet-900/20 text-violet-400"
                      : "bg-cyan-900/20 text-cyan-400"
                  )}
                >
                  {favorite.resourceType === "resource" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={
                      favorite.resourceType === "resource"
                        ? `/resources?highlight=${favorite.resourceId}`
                        : `/docs/${favorite.resourceId}`
                    }
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 truncate block"
                  >
                    {favorite.title || favorite.resourceId}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="capitalize">{favorite.resourceType}</span>
                    <span>•</span>
                    <span>
                      {new Date(favorite.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenPicker(favorite)}
                    className={cn(
                      "p-2 rounded-lg",
                      "text-gray-400 hover:text-blue-500 dark:hover:text-blue-400",
                      "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                      "transition-colors"
                    )}
                    title="Add to collection"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveFavorite(favorite)}
                    className={cn(
                      "p-2 rounded-lg",
                      "text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                      "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                      "transition-colors"
                    )}
                    title="Remove from favorites"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  "border border-gray-200 dark:border-[#262626]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:border-blue-500/50 transition-colors"
                )}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  "border border-gray-200 dark:border-[#262626]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:border-blue-500/50 transition-colors"
                )}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

          {/* Collection picker modal */}
          {selectedFavorite && (
            <CollectionPicker
              isOpen={pickerOpen}
              onClose={() => {
                setPickerOpen(false);
                setSelectedFavorite(null);
              }}
              favoriteId={selectedFavorite.id}
              resourceTitle={selectedFavorite.title}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
