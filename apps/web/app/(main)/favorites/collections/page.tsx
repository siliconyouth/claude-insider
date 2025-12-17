"use client";

/**
 * Collections List Page
 *
 * Lists all user collections with create functionality.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getCollections, createCollection, deleteCollection } from "@/lib/favorites";
import { CollectionCard, CollectionCardSkeleton } from "@/components/favorites";
import { useToast } from "@/components/toast";
import type { CollectionWithCount, CollectionColor, CollectionIcon } from "@/types/favorites";
import { COLLECTION_COLORS, COLLECTION_ICONS, COLLECTION_COLOR_STYLES } from "@/types/favorites";
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState<CollectionColor>("blue");
  const [newIcon, setNewIcon] = useState<CollectionIcon>("folder");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const toast = useToast();

  // Fetch collections
  useEffect(() => {
    let cancelled = false;

    async function fetchCollections() {
      setIsLoading(true);
      try {
        const { collections: result } = await getCollections();
        if (!cancelled) {
          setCollections(result);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load collections");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCollections();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;

      setIsCreating(true);
      try {
        await createCollection({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          color: newColor,
          icon: newIcon,
          isPublic: newIsPublic,
        });

        // Refresh collections
        const { collections: result } = await getCollections();
        setCollections(result);

        toast.success(`Created "${newName.trim()}"`);
        setShowCreateForm(false);
        setNewName("");
        setNewDescription("");
        setNewColor("blue");
        setNewIcon("folder");
        setNewIsPublic(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create collection");
      } finally {
        setIsCreating(false);
      }
    },
    [newName, newDescription, newColor, newIcon, newIsPublic, toast]
  );

  const handleDelete = useCallback(
    async (collection: CollectionWithCount) => {
      if (!confirm(`Delete "${collection.name}"? This cannot be undone.`)) return;

      // Optimistic update
      setCollections((prev) => prev.filter((c) => c.id !== collection.id));

      try {
        await deleteCollection(collection.slug);
        toast.success(`Deleted "${collection.name}"`);
      } catch {
        // Revert on error
        const { collections: result } = await getCollections();
        setCollections(result);
        toast.error("Failed to delete collection");
      }
    },
    [toast]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      <Header />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/favorites"
            className={cn(
              "p-2 rounded-lg",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Collections
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Organize your favorites into groups
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-lg shadow-blue-500/25",
            "hover:-translate-y-0.5 transition-transform"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Collection
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className={cn(
          "mb-8 p-6 rounded-xl",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create Collection
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Collection"
                className={cn(
                  "w-full px-4 py-2 rounded-lg",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400"
                )}
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What's this collection about?"
                rows={2}
                className={cn(
                  "w-full px-4 py-2 rounded-lg resize-none",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400"
                )}
                maxLength={500}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        COLLECTION_COLOR_STYLES[color].bg,
                        newColor === color && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                      )}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <div className="flex gap-2">
                  {COLLECTION_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "border transition-all",
                        newIcon === icon
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                          : "border-gray-200 dark:border-[#262626] text-gray-500 dark:text-gray-400 hover:border-blue-500/50"
                      )}
                      aria-label={icon}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon === "folder" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />}
                        {icon === "star" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
                        {icon === "bookmark" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />}
                        {icon === "heart" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                        {icon === "code" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />}
                        {icon === "book" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                        {icon === "lightbulb" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />}
                        {icon === "zap" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewIsPublic(!newIsPublic)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  newIsPublic ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                )}
                role="switch"
                aria-checked={newIsPublic}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                    newIsPublic && "translate-x-5"
                  )}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Make this collection public
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                  "transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || isCreating}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-opacity"
                )}
              >
                {isCreating ? "Creating..." : "Create Collection"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CollectionCardSkeleton key={i} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No collections yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first collection to organize favorites!
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-transform"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div key={collection.id} className="relative group">
              <CollectionCard collection={collection} />
              <button
                onClick={() => handleDelete(collection)}
                className={cn(
                  "absolute top-2 right-2 p-2 rounded-lg",
                  "bg-white/80 dark:bg-[#111111]/80 backdrop-blur-sm",
                  "text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                  "border border-gray-200 dark:border-[#262626]",
                  "opacity-0 group-hover:opacity-100",
                  "transition-all duration-200",
                  "hover:scale-105"
                )}
                title="Delete collection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
