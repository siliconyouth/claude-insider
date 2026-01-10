"use client";

/**
 * My Prompts Page
 *
 * Shows user's saved prompt fills - customized versions of prompts
 * that they've created using the Interactive Prompt Builder.
 *
 * Features:
 * - List of saved fills
 * - Quick re-use with AI
 * - Toggle favorites
 * - Share/unshare fills
 * - Delete fills
 * - Filter by prompt or search
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import {
  SparklesIcon,
  StarIcon,
  ShareIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  Loader2Icon,
  SearchIcon,
  BookmarkIcon,
  PlusIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { openAIAssistant, type AIContext } from "@/components/unified-chat/unified-chat-provider";

interface PromptFill {
  id: string;
  prompt_id: string;
  title: string;
  variable_values: Record<string, string>;
  final_content: string;
  is_favorite: boolean;
  share_token: string | null;
  is_public: boolean;
  star_count: number;
  created_at: string;
  updated_at: string;
  prompt_title: string;
  prompt_slug: string;
  category_name: string | null;
  category_slug: string | null;
}

export default function MyPromptsPage() {
  const router = useRouter();

  const [fills, setFills] = useState<PromptFill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch fills
  const fetchFills = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/prompts/builder/fills?limit=100");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?redirect=/prompts/my-prompts");
          return;
        }
        setError(data.error || "Failed to load your prompts");
        return;
      }

      setFills(data.fills || []);
    } catch {
      setError("Failed to load your prompts");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFills();
  }, [fetchFills]);

  // Filter fills by search
  const filteredFills = fills.filter((fill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      fill.title.toLowerCase().includes(query) ||
      fill.prompt_title.toLowerCase().includes(query) ||
      fill.final_content.toLowerCase().includes(query)
    );
  });

  // Copy to clipboard
  const handleCopy = useCallback(async (fill: PromptFill) => {
    try {
      await navigator.clipboard.writeText(fill.final_content);
      setCopiedId(fill.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Failed to copy
    }
  }, []);

  // Use with AI
  const handleUseWithAI = useCallback((fill: PromptFill) => {
    const context: AIContext = {
      page: {
        path: `/prompts/my-prompts`,
        title: fill.title,
        category: fill.category_slug || "prompts",
        section: "My Prompts",
      },
      content: {
        type: "prompt",
        title: fill.title,
        text: fill.final_content,
        metadata: {
          fillId: fill.id,
          promptId: fill.prompt_id,
          promptSlug: fill.prompt_slug,
        },
      },
    };

    openAIAssistant({
      context,
      question: fill.final_content,
    });
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback(async (fill: PromptFill) => {
    setUpdatingId(fill.id);
    try {
      const response = await fetch(`/api/prompts/builder/fills/${fill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !fill.is_favorite }),
      });

      if (response.ok) {
        setFills((prev) =>
          prev.map((f) =>
            f.id === fill.id ? { ...f, is_favorite: !f.is_favorite } : f
          )
        );
      }
    } catch {
      // Failed
    } finally {
      setUpdatingId(null);
    }
  }, []);

  // Toggle share
  const handleToggleShare = useCallback(async (fill: PromptFill) => {
    setUpdatingId(fill.id);
    try {
      const response = await fetch(`/api/prompts/builder/fills/${fill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !fill.is_public }),
      });

      if (response.ok) {
        const data = await response.json();
        setFills((prev) =>
          prev.map((f) =>
            f.id === fill.id
              ? { ...f, is_public: !f.is_public, share_token: data.fill.share_token }
              : f
          )
        );
      }
    } catch {
      // Failed
    } finally {
      setUpdatingId(null);
    }
  }, []);

  // Delete fill
  const handleDelete = useCallback(async (fill: PromptFill) => {
    if (!confirm("Are you sure you want to delete this saved prompt?")) return;

    setDeletingId(fill.id);
    try {
      const response = await fetch(`/api/prompts/builder/fills/${fill.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFills((prev) => prev.filter((f) => f.id !== fill.id));
      }
    } catch {
      // Failed
    } finally {
      setDeletingId(null);
    }
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 text-blue-500 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => fetchFills()}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "text-white shadow-lg shadow-blue-500/25",
                "transition-all duration-200"
              )}
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Prompts
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Your saved and customized prompts
              </p>
            </div>

            <Link
              href="/prompts"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "text-white shadow-lg shadow-blue-500/25",
                "transition-all duration-200"
              )}
            >
              <PlusIcon className="w-4 h-4" />
              Create New
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your prompts..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              )}
            />
          </div>

          {/* Empty state */}
          {filteredFills.length === 0 && (
            <div className="text-center py-16">
              <BookmarkIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? "No matching prompts" : "No saved prompts yet"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first custom prompt from the prompt library"}
              </p>
              {!searchQuery && (
                <Link
                  href="/prompts"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                    "text-white shadow-lg shadow-blue-500/25",
                    "transition-all duration-200"
                  )}
                >
                  Browse Prompts
                </Link>
              )}
            </div>
          )}

          {/* Fills grid */}
          {filteredFills.length > 0 && (
            <div className="grid gap-4">
              {filteredFills.map((fill) => (
                <div
                  key={fill.id}
                  className={cn(
                    "rounded-xl p-5",
                    "bg-gray-50 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]",
                    "hover:border-blue-500/30 dark:hover:border-blue-500/30",
                    "transition-colors"
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {fill.title}
                        </h3>
                        {fill.is_favorite && (
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {fill.is_public && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs",
                              "bg-blue-100 dark:bg-blue-500/20",
                              "text-blue-700 dark:text-blue-300"
                            )}
                          >
                            Shared
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <Link
                          href={`/prompts/${fill.prompt_slug}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                        >
                          {fill.prompt_title}
                          <ExternalLinkIcon className="w-3 h-3" />
                        </Link>
                        <span>•</span>
                        <span>{formatDate(fill.updated_at)}</span>
                        {fill.category_name && (
                          <>
                            <span>•</span>
                            <span>{fill.category_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFavorite(fill)}
                        disabled={updatingId === fill.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          fill.is_favorite
                            ? "text-yellow-500 hover:bg-yellow-500/10"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        title={fill.is_favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <StarIcon
                          className={cn("w-4 h-4", fill.is_favorite && "fill-current")}
                        />
                      </button>

                      <button
                        onClick={() => handleToggleShare(fill)}
                        disabled={updatingId === fill.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          fill.is_public
                            ? "text-blue-500 hover:bg-blue-500/10"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        title={fill.is_public ? "Make private" : "Share publicly"}
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCopy(fill)}
                        className={cn(
                          "p-2 rounded-lg text-gray-400",
                          "hover:text-gray-600 dark:hover:text-gray-200",
                          "hover:bg-gray-100 dark:hover:bg-gray-800",
                          "transition-colors"
                        )}
                        title="Copy to clipboard"
                      >
                        {copiedId === fill.id ? (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <CopyIcon className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(fill)}
                        disabled={deletingId === fill.id}
                        className={cn(
                          "p-2 rounded-lg text-gray-400",
                          "hover:text-red-500 hover:bg-red-500/10",
                          "transition-colors",
                          "disabled:opacity-50"
                        )}
                        title="Delete"
                      >
                        {deletingId === fill.id ? (
                          <Loader2Icon className="w-4 h-4 animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div
                    className={cn(
                      "text-sm text-gray-600 dark:text-gray-400",
                      "line-clamp-2 mb-4"
                    )}
                  >
                    {fill.final_content.slice(0, 200)}
                    {fill.final_content.length > 200 && "..."}
                  </div>

                  {/* Use with AI button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUseWithAI(fill)}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                        "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                        "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                        "text-white shadow-lg shadow-blue-500/25",
                        "transition-all duration-200"
                      )}
                    >
                      <SparklesIcon className="w-4 h-4" />
                      Use with AI
                    </button>

                    {fill.is_public && fill.share_token && (
                      <Link
                        href={`/prompts/shared/${fill.share_token}`}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                          "text-gray-600 dark:text-gray-400",
                          "hover:bg-gray-100 dark:hover:bg-gray-800",
                          "transition-colors"
                        )}
                      >
                        View public link
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
