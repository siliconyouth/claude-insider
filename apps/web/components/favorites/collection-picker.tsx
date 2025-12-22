"use client";

/**
 * Collection Picker Modal
 *
 * Modal to add a favorite to one or more collections.
 */

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { getCollections, createCollection, addToCollection, removeFromCollection, getCollectionItems } from "@/lib/favorites";
import type { CollectionWithCount, CollectionIcon, CollectionColor } from "@/types/favorites";
import { COLLECTION_COLORS, COLLECTION_COLOR_STYLES } from "@/types/favorites";

interface CollectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteId: string;
  resourceTitle?: string;
}

export function CollectionPicker({
  isOpen,
  onClose,
  favoriteId,
  resourceTitle,
}: CollectionPickerProps) {
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CollectionColor>("blue");
  const [newIcon, setNewIcon] = useState<CollectionIcon>("folder");
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch collections and check which contain this favorite
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const { collections: userCollections } = await getCollections();
        if (cancelled) return;

        setCollections(userCollections);

        // Check which collections contain this favorite
        const selectedSet = new Set<string>();
        for (const collection of userCollections) {
          try {
            const { items } = await getCollectionItems(collection.slug);
            if (items.some((item) => item.id === favoriteId)) {
              selectedSet.add(collection.id);
            }
          } catch {
            // Collection might be empty
          }
        }
        if (!cancelled) {
          setSelectedCollections(selectedSet);
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

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, favoriteId, toast]);

  const handleToggleCollection = useCallback(
    async (collection: CollectionWithCount) => {
      const wasSelected = selectedCollections.has(collection.id);

      // Optimistic update
      setSelectedCollections((prev) => {
        const next = new Set(prev);
        if (wasSelected) {
          next.delete(collection.id);
        } else {
          next.add(collection.id);
        }
        return next;
      });

      try {
        if (wasSelected) {
          await removeFromCollection(collection.slug, favoriteId);
          toast.info(`Removed from "${collection.name}"`);
        } else {
          await addToCollection(collection.slug, favoriteId);
          toast.success(`Added to "${collection.name}"`);
        }
      } catch {
        // Revert on error
        setSelectedCollections((prev) => {
          const next = new Set(prev);
          if (wasSelected) {
            next.add(collection.id);
          } else {
            next.delete(collection.id);
          }
          return next;
        });
        toast.error("Failed to update collection");
      }
    },
    [selectedCollections, favoriteId, toast]
  );

  const handleCreateCollection = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;

      setIsCreating(true);
      try {
        const result = await createCollection({
          name: newName.trim(),
          color: newColor,
          icon: newIcon,
        });

        // Add favorite to new collection
        await addToCollection(result.slug, favoriteId);

        // Refresh collections
        const { collections: userCollections } = await getCollections();
        setCollections(userCollections);
        setSelectedCollections((prev) => new Set(prev).add(result.collectionId));

        toast.success(`Created "${newName.trim()}" and added item`);
        setShowCreateForm(false);
        setNewName("");
        setNewColor("blue");
        setNewIcon("folder");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create collection");
      } finally {
        setIsCreating(false);
      }
    },
    [newName, newColor, newIcon, favoriteId, toast]
  );

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/20",
          "animate-scale-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#262626]">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add to Collection
            </h2>
            {resourceTitle && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[280px]">
                {resourceTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-[#262626]",
              "transition-colors"
            )}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#262626]"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#262626] animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Collections list */}
              <div className="space-y-2">
                {collections.map((collection) => {
                  const isSelected = selectedCollections.has(collection.id);
                  const colorStyles = COLLECTION_COLOR_STYLES[collection.color];

                  return (
                    <button
                      key={collection.id}
                      onClick={() => handleToggleCollection(collection)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg",
                        "border transition-all duration-200",
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-gray-200 dark:border-[#262626] hover:border-blue-500/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg",
                          colorStyles.bg,
                          colorStyles.text
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                        {collection.name}
                      </span>
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300 dark:border-gray-600"
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Create new collection */}
              {showCreateForm ? (
                <form onSubmit={handleCreateCollection} className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Collection name"
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm",
                      "bg-gray-50 dark:bg-[#1a1a1a]",
                      "border border-gray-200 dark:border-[#262626]",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "text-gray-900 dark:text-white",
                      "placeholder-gray-400"
                    )}
                    autoFocus
                    maxLength={100}
                  />

                  {/* Color picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Color:</span>
                    <div className="flex gap-1">
                      {COLLECTION_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-transform",
                            COLLECTION_COLOR_STYLES[color].bg,
                            newColor === color && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                          )}
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm",
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
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium",
                        "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                        "text-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-opacity"
                      )}
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className={cn(
                    "w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-lg",
                    "border border-dashed border-gray-300 dark:border-gray-600",
                    "text-gray-600 dark:text-gray-400",
                    "hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400",
                    "transition-colors"
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">New Collection</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-[#262626]">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-gray-100 dark:bg-[#1a1a1a]",
              "text-gray-900 dark:text-white",
              "hover:bg-gray-200 dark:hover:bg-[#262626]",
              "transition-colors"
            )}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
