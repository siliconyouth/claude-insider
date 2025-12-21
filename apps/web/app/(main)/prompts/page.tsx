"use client";

/**
 * Prompts Library Page
 *
 * Browse, search, and discover prompt templates for Claude AI.
 * Features:
 * - Category filtering
 * - Search with tags
 * - Sort by popularity, recent, rating
 * - Save/unsave prompts
 * - View prompt details
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PromptCard, PromptCardSkeleton, type Prompt } from "@/components/prompts/prompt-card";
import { cn } from "@/lib/design-system";
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  SparklesIcon,
  BookmarkIcon,
  TrendingUpIcon,
  ClockIcon,
  StarIcon,
  XIcon,
  CodeIcon,
  PencilIcon,
  BarChartIcon,
  LightbulbIcon,
  ZapIcon,
  BookOpenIcon,
  MessageSquareIcon,
  BriefcaseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coding: <CodeIcon className="w-4 h-4" />,
  writing: <PencilIcon className="w-4 h-4" />,
  analysis: <BarChartIcon className="w-4 h-4" />,
  creative: <LightbulbIcon className="w-4 h-4" />,
  productivity: <ZapIcon className="w-4 h-4" />,
  learning: <BookOpenIcon className="w-4 h-4" />,
  conversation: <MessageSquareIcon className="w-4 h-4" />,
  business: <BriefcaseIcon className="w-4 h-4" />,
};

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  promptCount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortOption = "popular" | "recent" | "top-rated" | "most-used";

function PromptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState<SortOption>((searchParams.get("sort") as SortOption) || "popular");
  const [filter, setFilter] = useState(searchParams.get("filter") || ""); // featured, saved, mine
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const [showFilters, setShowFilters] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => setIsAuthenticated(!!data?.user))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("sort", sort);

      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (filter === "featured") params.set("featured", "true");
      if (filter === "saved") params.set("saved", "true");
      if (filter === "mine") params.set("mine", "true");
      if (filter === "system") params.set("system", "true");

      const response = await fetch(`/api/prompts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch prompts");

      const data = await response.json();
      setPrompts(data.prompts);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, sort, search, category, filter]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sort !== "popular") params.set("sort", sort);
    if (filter) params.set("filter", filter);
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    router.replace(`/prompts${query ? `?${query}` : ""}`, { scroll: false });
  }, [search, category, sort, filter, page, router]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPrompts();
  };

  // Handle save/unsave
  const handleSave = async (promptId: string) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/prompts");
      return;
    }

    const response = await fetch(`/api/prompts/${promptId}/save`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to save prompt");
    }
  };

  // Handle copy
  const handleCopy = () => {
    // Could show a toast here
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: "popular", label: "Popular", icon: <TrendingUpIcon className="w-4 h-4" /> },
    { value: "recent", label: "Recent", icon: <ClockIcon className="w-4 h-4" /> },
    { value: "top-rated", label: "Top Rated", icon: <StarIcon className="w-4 h-4" /> },
    { value: "most-used", label: "Most Used", icon: <SparklesIcon className="w-4 h-4" /> },
  ];

  const filterOptions = [
    { value: "", label: "All Prompts" },
    { value: "featured", label: "Featured" },
    { value: "system", label: "Official" },
    ...(isAuthenticated ? [
      { value: "saved", label: "Saved" },
      { value: "mine", label: "My Prompts" },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header activePage="prompts" />

      <main id="main-content" className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-sm mb-4">
              <SparklesIcon className="w-4 h-4" />
              Prompt Library
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Prompt Templates
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover, save, and use curated prompts to get the most out of Claude AI.
              Browse by category or create your own.
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search prompts..."
                  className={cn(
                    "w-full pl-12 pr-4 py-3 rounded-xl",
                    "bg-gray-100 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder-gray-500 dark:placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  )}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300"
              )}
            >
              <FilterIcon className="w-5 h-5" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="hidden md:flex items-center gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setSort(option.value); setPage(1); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    sort === option.value
                      ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Create Button */}
            {isAuthenticated && (
              <button
                onClick={() => router.push("/prompts/new")}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-medium",
                  "hover:shadow-lg hover:-translate-y-0.5 transition-all"
                )}
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}
          </div>

          {/* Filters Panel */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8",
            !showFilters && "md:block hidden",
            showFilters && "block"
          )}>
            {/* Category Sidebar */}
            <div className="md:col-span-1">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Categories
              </h3>
              <nav className="space-y-1">
                <button
                  onClick={() => { setCategory(""); setPage(1); }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors",
                    !category
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <span>All Categories</span>
                  <span className="text-gray-400">{pagination?.total || 0}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => { setCategory(cat.slug); setPage(1); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors",
                      category === cat.slug
                        ? "bg-blue-500/10 text-blue-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {CATEGORY_ICONS[cat.slug] || <SparklesIcon className="w-4 h-4" />}
                      {cat.name}
                    </span>
                    <span className="text-gray-400">{cat.promptCount}</span>
                  </button>
                ))}
              </nav>

              {/* Filter Options */}
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 mt-6">
                Filter
              </h3>
              <div className="space-y-1">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setPage(1); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                      filter === opt.value
                        ? "bg-blue-500/10 text-blue-500"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {opt.value === "saved" && <BookmarkIcon className="w-4 h-4" />}
                    {opt.value === "featured" && <SparklesIcon className="w-4 h-4" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompts Grid */}
            <div className="md:col-span-3">
              {/* Mobile Sort */}
              <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-4">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSort(option.value); setPage(1); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                      sort === option.value
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                        : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Results Header */}
              {pagination && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {pagination.total} {pagination.total === 1 ? "prompt" : "prompts"} found
                  {search && ` for "${search}"`}
                  {category && ` in ${categories.find(c => c.slug === category)?.name || category}`}
                </p>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <PromptCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={fetchPrompts}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    Try Again
                  </button>
                </div>
              ) : prompts.length === 0 ? (
                <div className="text-center py-12">
                  <SparklesIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No prompts found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {search
                      ? `No results for "${search}". Try adjusting your search.`
                      : "No prompts in this category yet."}
                  </p>
                  {isAuthenticated && (
                    <button
                      onClick={() => router.push("/prompts/new")}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                        "bg-blue-500/10 text-blue-500 border border-blue-500/30",
                        "hover:bg-blue-500/20 transition-colors"
                      )}
                    >
                      <PlusIcon className="w-4 h-4" />
                      Create the first one
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Prompts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {prompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onSave={handleSave}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={cn(
                          "p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-colors"
                        )}
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                        disabled={page === pagination.totalPages}
                        className={cn(
                          "p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-colors"
                        )}
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Loading fallback
function PromptsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="prompts" />
      <main id="main-content" className="pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-6 w-32 mx-auto bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse mb-4" />
            <div className="h-12 w-80 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
            <div className="h-6 w-96 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-12 w-full max-w-xl bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="hidden md:block space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <PromptCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={<PromptsLoading />}>
      <PromptsContent />
    </Suspense>
  );
}
