"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { cn } from "@/lib/design-system";
import { createCollection, type Collection } from "@/app/actions/collections";
import { useToast } from "@/components/toast";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  inCollections: string[];
  isLoading: boolean;
  onToggle: (collectionId: string) => void;
  onCollectionCreated: (collection: Collection) => void;
}

export function CollectionModal({
  isOpen,
  onClose,
  collections,
  inCollections,
  isLoading,
  onToggle,
  onCollectionCreated,
}: CollectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    startTransition(async () => {
      const result = await createCollection(newName, newDescription, isPublic);

      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Collection created");
        onCollectionCreated(result.data);
        setShowCreateForm(false);
        setNewName("");
        setNewDescription("");
        setIsPublic(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-md",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-xl shadow-2xl",
          "max-h-[90vh] overflow-hidden flex flex-col",
          "animate-scale-in"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#262626]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {showCreateForm ? "Create Collection" : "Save to Collection"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {showCreateForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Awesome Collection"
                  autoFocus
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "bg-white dark:bg-[#0a0a0a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What's this collection about?"
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg resize-none",
                    "bg-white dark:bg-[#0a0a0a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                  )}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Make this collection public
                </span>
              </label>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] animate-pulse" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No collections yet
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-600 dark:text-cyan-400 hover:underline text-sm"
              >
                Create your first collection
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => {
                const isIn = inCollections.includes(collection.id);
                return (
                  <button
                    key={collection.id}
                    onClick={() => onToggle(collection.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg",
                      "text-left transition-colors",
                      isIn
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                        isIn
                          ? "bg-blue-600 text-white"
                          : "border-2 border-gray-300 dark:border-gray-600"
                      )}
                    >
                      {isIn && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {collection.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {collection.item_count} item{collection.item_count !== 1 ? "s" : ""}
                        {collection.is_public && " • Public"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-[#262626]">
          {showCreateForm ? (
            <>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending || !newName.trim()}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-sm",
                  "hover:shadow-md",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Collection
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
