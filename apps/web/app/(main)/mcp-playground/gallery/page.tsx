"use client";

/**
 * MCP Configuration Gallery Page
 *
 * Public gallery of approved MCP configurations.
 * Features:
 * - Search and filter
 * - Sort by stars, forks, views, recent
 * - Fork to your own configs
 * - Star favorite configs
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getGalleryConfigs,
  getPopularTags,
  toggleStar,
  hasStarred,
  forkConfig,
} from "@/lib/mcp/storage";
import type { MCPConfigWithAuthor, MCPConfigDifficulty } from "@/lib/mcp/schema";
import {
  MagnifyingGlassIcon,
  StarIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ServerStackIcon,
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type SortOption = "stars" | "forks" | "views" | "recent";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "stars", label: "Most Stars" },
  { value: "forks", label: "Most Forks" },
  { value: "views", label: "Most Views" },
  { value: "recent", label: "Most Recent" },
];

const DIFFICULTY_OPTIONS: { value: MCPConfigDifficulty | ""; label: string }[] = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Config card component
function ConfigCard({
  config,
  onStar,
  onFork,
  isStarred,
  starLoading,
  forkLoading,
}: {
  config: MCPConfigWithAuthor;
  onStar: () => void;
  onFork: () => void;
  isStarred: boolean;
  starLoading: boolean;
  forkLoading: boolean;
}) {
  const serverCount = config.server_count || Object.keys(config.config_json.mcpServers || {}).length;

  return (
    <div className="ui-bg-card border ui-border rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors group">
      {/* Header with author */}
      <div className="p-4 border-b ui-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/mcp-playground/gallery/${config.id}`}
              className="font-semibold ui-text-heading hover:text-blue-600 dark:hover:text-cyan-400 transition-colors line-clamp-1"
            >
              {config.name}
            </Link>
            <p className="text-sm ui-text-secondary line-clamp-2 mt-1">
              {config.description || "No description provided"}
            </p>
          </div>

          {/* Server count badge */}
          <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10">
            <ServerStackIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
              {serverCount}
            </span>
          </div>
        </div>

        {/* Tags */}
        {config.tags && config.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {config.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 ui-text-secondary"
              >
                {tag}
              </span>
            ))}
            {config.tags.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 ui-text-secondary">
                +{config.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats and actions */}
      <div className="p-4 flex items-center justify-between">
        {/* Author */}
        <div className="flex items-center gap-2 min-w-0">
          {config.author_avatar ? (
            <Image
              src={config.author_avatar}
              alt={config.author_name || "Author"}
              width={24}
              height={24}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shrink-0" />
          )}
          <span className="text-sm ui-text-secondary truncate">
            {config.author_name || "Anonymous"}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs ui-text-secondary">
            <StarIcon className="h-4 w-4" />
            {config.stars_count}
          </div>
          <div className="flex items-center gap-1 text-xs ui-text-secondary">
            <DocumentDuplicateIcon className="h-4 w-4" />
            {config.forks_count}
          </div>
          <div className="flex items-center gap-1 text-xs ui-text-secondary">
            <EyeIcon className="h-4 w-4" />
            {config.views_count}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={onStar}
          disabled={starLoading}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isStarred
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              : "ui-btn-secondary"
          )}
        >
          {starLoading ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : isStarred ? (
            <StarIconSolid className="h-4 w-4" />
          ) : (
            <StarIcon className="h-4 w-4" />
          )}
          {isStarred ? "Starred" : "Star"}
        </button>
        <button
          onClick={onFork}
          disabled={forkLoading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90 transition-opacity"
        >
          {forkLoading ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <DocumentDuplicateIcon className="h-4 w-4" />
          )}
          Fork
        </button>
        <Link
          href={`/mcp-playground/gallery/${config.id}`}
          className="p-2 rounded-lg ui-btn-secondary"
          title="View details"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function MCPGalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // State
  const [configs, setConfigs] = useState<MCPConfigWithAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "stars"
  );
  const [difficulty, setDifficulty] = useState<MCPConfigDifficulty | "">(
    (searchParams.get("difficulty") as MCPConfigDifficulty) || ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );

  // Popular tags
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);

  // Starred configs tracking
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [starLoading, setStarLoading] = useState<string | null>(null);
  const [forkLoading, setForkLoading] = useState<string | null>(null);

  // Show filters on mobile
  const [showFilters, setShowFilters] = useState(false);

  // Load popular tags
  useEffect(() => {
    getPopularTags(15).then(setPopularTags).catch(console.error);
  }, []);

  // Load configs
  const loadConfigs = useCallback(
    async (resetPage = false) => {
      setIsLoading(true);
      setError(null);

      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      try {
        const { configs: newConfigs, total: newTotal } = await getGalleryConfigs({
          search: search || undefined,
          sortBy,
          difficulty: difficulty || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          page: currentPage,
          limit: 12,
        });

        if (resetPage) {
          setConfigs(newConfigs);
        } else {
          setConfigs((prev) => [...prev, ...newConfigs]);
        }

        setTotal(newTotal);
        setHasMore(newConfigs.length === 12);

        // Check starred status for new configs
        if (isAuthenticated) {
          const starredChecks = await Promise.all(
            newConfigs.map(async (c) => ({
              id: c.id,
              starred: await hasStarred(c.id),
            }))
          );
          setStarredIds((prev) => {
            const newSet = new Set(prev);
            starredChecks.forEach(({ id, starred }) => {
              if (starred) newSet.add(id);
              else newSet.delete(id);
            });
            return newSet;
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load configurations");
      } finally {
        setIsLoading(false);
      }
    },
    [search, sortBy, difficulty, selectedTags, page, isAuthenticated]
  );

  // Load on filter change
  useEffect(() => {
    loadConfigs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, difficulty, selectedTags]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sortBy !== "stars") params.set("sort", sortBy);
    if (difficulty) params.set("difficulty", difficulty);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : "/mcp-playground/gallery";
    router.replace(newUrl, { scroll: false });
  }, [search, sortBy, difficulty, selectedTags, router]);

  // Handle star
  const handleStar = useCallback(
    async (configId: string) => {
      if (!isAuthenticated) {
        router.push("/sign-in?redirect=/mcp-playground/gallery");
        return;
      }

      setStarLoading(configId);
      try {
        const isNowStarred = await toggleStar(configId);
        setStarredIds((prev) => {
          const newSet = new Set(prev);
          if (isNowStarred) newSet.add(configId);
          else newSet.delete(configId);
          return newSet;
        });
        // Update local count
        setConfigs((prev) =>
          prev.map((c) =>
            c.id === configId
              ? { ...c, stars_count: c.stars_count + (isNowStarred ? 1 : -1) }
              : c
          )
        );
      } catch (err) {
        console.error("Failed to toggle star:", err);
      } finally {
        setStarLoading(null);
      }
    },
    [isAuthenticated, router]
  );

  // Handle fork
  const handleFork = useCallback(
    async (configId: string) => {
      if (!isAuthenticated) {
        router.push("/sign-in?redirect=/mcp-playground/gallery");
        return;
      }

      setForkLoading(configId);
      try {
        const newId = await forkConfig(configId);
        router.push(`/mcp-playground?config=${newId}`);
      } catch (err) {
        console.error("Failed to fork:", err);
        setError(err instanceof Error ? err.message : "Failed to fork");
      } finally {
        setForkLoading(null);
      }
    },
    [isAuthenticated, router]
  );

  // Toggle tag
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch("");
    setSortBy("stars");
    setDifficulty("");
    setSelectedTags([]);
  }, []);

  const hasActiveFilters = useMemo(
    () => search || sortBy !== "stars" || difficulty || selectedTags.length > 0,
    [search, sortBy, difficulty, selectedTags]
  );

  return (
    <div className="min-h-screen ui-bg-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/mcp-playground"
              className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 transition-colors"
            >
              <BeakerIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold ui-text-heading">MCP Gallery</h1>
              <p className="ui-text-secondary">
                {total} community configurations
              </p>
            </div>
          </div>
        </header>

        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          {/* Search bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ui-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search configurations..."
                className="ui-input w-full pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "lg:hidden px-4 py-2 rounded-lg ui-btn-secondary flex items-center gap-2",
                showFilters && "bg-blue-500/10 border-blue-500/50"
              )}
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          </div>

          {/* Filter row */}
          <div
            className={cn(
              "flex flex-wrap gap-3",
              !showFilters && "hidden lg:flex"
            )}
          >
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="ui-input pr-8 appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 ui-text-secondary pointer-events-none" />
            </div>

            {/* Difficulty */}
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as MCPConfigDifficulty | "")}
                className="ui-input pr-8 appearance-none cursor-pointer"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 ui-text-secondary pointer-events-none" />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-lg text-sm ui-btn-ghost text-red-600 dark:text-red-400"
              >
                <XMarkIcon className="h-4 w-4 inline mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Popular tags */}
          {popularTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs ui-text-secondary py-1">Popular:</span>
              {popularTags.slice(0, 10).map(({ tag }) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-full transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-gray-800 ui-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && configs.length === 0 && (
          <div className="py-12 text-center">
            <ArrowPathIcon className="h-8 w-8 mx-auto ui-text-secondary animate-spin" />
            <p className="mt-2 ui-text-secondary">Loading configurations...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && configs.length === 0 && (
          <div className="py-12 text-center">
            <ServerStackIcon className="h-12 w-12 mx-auto ui-text-secondary mb-3" />
            <h3 className="text-lg font-semibold ui-text-heading mb-1">
              No configurations found
            </h3>
            <p className="ui-text-secondary mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Be the first to publish a configuration!"}
            </p>
            <Link
              href="/mcp-playground"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium hover:opacity-90"
            >
              <BeakerIcon className="h-5 w-5" />
              Create Configuration
            </Link>
          </div>
        )}

        {/* Config grid */}
        {configs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => (
              <ConfigCard
                key={config.id}
                config={config}
                isStarred={starredIds.has(config.id)}
                starLoading={starLoading === config.id}
                forkLoading={forkLoading === config.id}
                onStar={() => handleStar(config.id)}
                onFork={() => handleFork(config.id)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && configs.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setPage((p) => p + 1);
                loadConfigs(false);
              }}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg ui-btn-secondary font-medium"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin inline" />
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
