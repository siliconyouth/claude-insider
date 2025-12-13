"use client";

/**
 * Collection Detail Page
 *
 * Shows items in a specific collection with management options.
 */

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/design-system";
import { getCollection, getCollectionItems, removeFromCollection, updateCollection, deleteCollection } from "@/lib/favorites";
import { useToast } from "@/components/toast";
import type { CollectionWithCount, FavoriteWithDetails, CollectionColor, CollectionIcon } from "@/types/favorites";
import { COLLECTION_COLORS, COLLECTION_ICONS, COLLECTION_COLOR_STYLES } from "@/types/favorites";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CollectionDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionWithCount | null>(null);
  const [items, setItems] = useState<(FavoriteWithDetails & { itemId: string; position: number; addedAt: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState<CollectionColor>("blue");
  const [editIcon, setEditIcon] = useState<CollectionIcon>("folder");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Fetch collection and items
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [colResult, itemsResult] = await Promise.all([
          getCollection(slug),
          getCollectionItems(slug),
        ]);

        if (!cancelled) {
          setCollection(colResult.collection);
          setItems(itemsResult.items);

          // Set edit form values
          setEditName(colResult.collection.name);
          setEditDescription(colResult.collection.description || "");
          setEditColor(colResult.collection.color);
          setEditIcon(colResult.collection.icon);
          setEditIsPublic(colResult.collection.isPublic);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Collection not found");
          router.push("/favorites/collections");
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
  }, [slug, router, toast]);

  const handleRemoveItem = useCallback(
    async (item: FavoriteWithDetails & { itemId: string }) => {
      // Optimistic update
      setItems((prev) => prev.filter((i) => i.id !== item.id));

      try {
        await removeFromCollection(slug, item.id);
        toast.success("Removed from collection");
      } catch {
        // Refresh items on error
        const { items: refreshedItems } = await getCollectionItems(slug);
        setItems(refreshedItems);
        toast.error("Failed to remove item");
      }
    },
    [slug, toast]
  );

  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editName.trim()) return;

      setIsSaving(true);
      try {
        const result = await updateCollection(slug, {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          color: editColor,
          icon: editIcon,
          isPublic: editIsPublic,
        });

        toast.success("Collection updated");
        setIsEditing(false);

        // Redirect if slug changed
        if (result.slug !== slug) {
          router.push(`/favorites/collections/${result.slug}`);
        } else {
          // Refresh collection data
          const { collection: updated } = await getCollection(slug);
          setCollection(updated);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update collection");
      } finally {
        setIsSaving(false);
      }
    },
    [slug, editName, editDescription, editColor, editIcon, editIsPublic, router, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!collection) return;
    if (!confirm(`Delete "${collection.name}"? This cannot be undone.`)) return;

    try {
      await deleteCollection(slug);
      toast.success(`Deleted "${collection.name}"`);
      router.push("/favorites/collections");
    } catch {
      toast.error("Failed to delete collection");
    }
  }, [collection, slug, router, toast]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded bg-gray-200 dark:bg-[#262626] animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
        </div>
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
      </div>
    );
  }

  if (!collection) return null;

  const colorStyles = COLLECTION_COLOR_STYLES[collection.color];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <Link
            href="/favorites/collections"
            className={cn(
              "p-2 rounded-lg mt-1",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex-1 space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={cn(
                  "w-full text-2xl font-bold px-3 py-2 rounded-lg",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-gray-900 dark:text-white"
                )}
                maxLength={100}
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className={cn(
                  "w-full px-3 py-2 rounded-lg resize-none text-sm",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400"
                )}
                maxLength={500}
              />

              <div className="flex flex-wrap gap-4">
                {/* Color picker */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Color:</span>
                  <div className="flex gap-1">
                    {COLLECTION_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform",
                          COLLECTION_COLOR_STYLES[color].bg,
                          editColor === color && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                        )}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Public toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsPublic(!editIsPublic)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      editIsPublic ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    )}
                    role="switch"
                    aria-checked={editIsPublic}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        editIsPublic && "translate-x-5"
                      )}
                    />
                  </button>
                  <span className="text-sm text-gray-500">Public</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-600 dark:text-gray-400",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || isSaving}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium",
                    "bg-blue-600 text-white",
                    "disabled:opacity-50"
                  )}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl",
                    colorStyles.bg,
                    colorStyles.text
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {collection.name}
                </h1>
                {collection.isPublic && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    Public
                  </span>
                )}
              </div>
              {collection.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400 ml-[52px]">
                  {collection.description}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500 ml-[52px]">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "p-2 rounded-lg",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "transition-colors"
              )}
              title="Edit collection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                "p-2 rounded-lg",
                "text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "transition-colors"
              )}
              title="Delete collection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            This collection is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add items from your favorites!
          </p>
          <Link
            href="/favorites"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-transform"
            )}
          >
            Go to Favorites
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.itemId}
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
                  item.resourceType === "resource"
                    ? "bg-violet-900/20 text-violet-400"
                    : "bg-cyan-900/20 text-cyan-400"
                )}
              >
                {item.resourceType === "resource" ? (
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
                    item.resourceType === "resource"
                      ? `/resources?highlight=${item.resourceId}`
                      : `/docs/${item.resourceId}`
                  }
                  className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 truncate block"
                >
                  {item.title || item.resourceId}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="capitalize">{item.resourceType}</span>
                  <span>•</span>
                  <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveItem(item)}
                className={cn(
                  "p-2 rounded-lg",
                  "text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                  "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                  "opacity-0 group-hover:opacity-100",
                  "transition-all duration-200"
                )}
                title="Remove from collection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
