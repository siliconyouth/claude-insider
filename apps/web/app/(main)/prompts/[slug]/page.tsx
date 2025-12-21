"use client";

/**
 * Prompt Detail Page
 *
 * Shows full prompt details with:
 * - Content with variable highlighting
 * - Copy to clipboard
 * - Save/unsave
 * - Rate prompt
 * - Author info
 * - Related prompts (future)
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  BookmarkIcon,
  StarIcon,
  SparklesIcon,
  UserIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  PlayIcon,
  CodeIcon,
  PencilIcon,
  BarChartIcon,
  LightbulbIcon,
  ZapIcon,
  BookOpenIcon,
  MessageSquareIcon,
  BriefcaseIcon,
} from "lucide-react";

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coding: <CodeIcon className="w-5 h-5" />,
  writing: <PencilIcon className="w-5 h-5" />,
  analysis: <BarChartIcon className="w-5 h-5" />,
  creative: <LightbulbIcon className="w-5 h-5" />,
  productivity: <ZapIcon className="w-5 h-5" />,
  learning: <BookOpenIcon className="w-5 h-5" />,
  conversation: <MessageSquareIcon className="w-5 h-5" />,
  business: <BriefcaseIcon className="w-5 h-5" />,
};

interface PromptVariable {
  name: string;
  description?: string;
  default?: string;
}

interface PromptDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: {
    id: string;
    slug: string;
    name: string;
    icon: string | null;
  } | null;
  tags: string[];
  variables: PromptVariable[];
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  visibility: string;
  isFeatured: boolean;
  isSystem: boolean;
  useCount: number;
  saveCount: number;
  avgRating: number;
  ratingCount: number;
  isSaved: boolean;
  userRating: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Fetch prompt
  useEffect(() => {
    async function fetchPrompt() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/prompts/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Prompt not found");
          } else {
            throw new Error("Failed to fetch prompt");
          }
          return;
        }

        const data = await response.json();
        setPrompt(data.prompt);
        setCanEdit(data.canEdit);
        setIsSaved(data.prompt.isSaved);
        setSaveCount(data.prompt.saveCount);
        setUserRating(data.prompt.userRating);
        setAvgRating(data.prompt.avgRating);
        setRatingCount(data.prompt.ratingCount);

        // Initialize variable values with defaults
        const defaults: Record<string, string> = {};
        for (const variable of data.prompt.variables || []) {
          defaults[variable.name] = variable.default || "";
        }
        setVariableValues(defaults);

        // Track usage
        fetch(`/api/prompts/${data.prompt.id}/use`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: "view" }),
        }).catch(() => {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompt();
  }, [slug]);

  // Handle copy
  const handleCopy = async () => {
    if (!prompt) return;

    let content = prompt.content;

    // Replace variables with values
    for (const [name, value] of Object.entries(variableValues)) {
      content = content.replace(new RegExp(`\\{\\{${name}\\}\\}`, "g"), value || `{{${name}}}`);
    }

    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Track usage
      fetch(`/api/prompts/${prompt.id}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: "copy", variablesUsed: variableValues }),
      }).catch(() => {});
    } catch {
      // Clipboard API not available
    }
  };

  // Handle save/unsave
  const handleSave = async () => {
    if (!prompt || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/save`, {
        method: "POST",
      });

      if (response.status === 401) {
        router.push(`/login?redirect=/prompts/${slug}`);
        return;
      }

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json();
      setIsSaved(data.isSaved);
      setSaveCount(data.saveCount);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle rating
  const handleRate = async (rating: number) => {
    if (!prompt || isRating) return;

    setIsRating(true);
    try {
      const response = await fetch(`/api/prompts/${prompt.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (response.status === 401) {
        router.push(`/login?redirect=/prompts/${slug}`);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rate");
      }

      const data = await response.json();
      setUserRating(data.rating);
      setAvgRating(data.avgRating);
      setRatingCount(data.ratingCount);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRating(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!prompt || !confirm("Are you sure you want to delete this prompt?")) return;

    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      router.push("/prompts");
    } catch (err) {
      console.error(err);
    }
  };

  // Format content with variable highlighting
  const formatContent = (content: string) => {
    return content.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      const value = variableValues[name];
      if (value) {
        return `<span class="text-cyan-500 font-medium">${value}</span>`;
      }
      return `<span class="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-sm font-mono">{{${name}}}</span>`;
    });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || "Prompt not found"}
            </h1>
            <Link
              href="/prompts"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              )}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Prompts
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const categorySlug = prompt.category?.slug || "coding";
  const categoryIcon = CATEGORY_ICONS[categorySlug] || CATEGORY_ICONS.coding;
  const variables = prompt.variables || [];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/prompts"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Prompts
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {prompt.isSystem && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs">
                      <SparklesIcon className="w-3 h-3" />
                      Official
                    </span>
                  )}
                  {prompt.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/30">
                      Featured
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {prompt.title}
                </h1>
                {prompt.description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {prompt.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canEdit && (
                  <>
                    <Link
                      href={`/prompts/${prompt.slug}/edit`}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        "text-gray-400 hover:text-blue-500 hover:bg-blue-500/10"
                      )}
                      title="Edit prompt"
                    >
                      <EditIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleDelete}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                      )}
                      title="Delete prompt"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center flex-wrap gap-4 text-sm">
              {prompt.category && (
                <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  {categoryIcon}
                  {prompt.category.name}
                </span>
              )}
              {prompt.author && (
                <Link
                  href={`/users/${prompt.author.username || prompt.author.id}`}
                  className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {prompt.author.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={prompt.author.image}
                      alt={prompt.author.name || "Author"}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                  {prompt.author.name || "Anonymous"}
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-4 h-4" />
                {new Date(prompt.createdAt).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <SparklesIcon className="w-4 h-4" />
                {prompt.useCount.toLocaleString()} uses
              </span>
            </div>

            {/* Tags */}
            {prompt.tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mt-4">
                {prompt.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/prompts?tags=${tag}`}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Variables Form */}
          {variables.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111] p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Fill in the variables
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {variable.name}
                      {variable.description && (
                        <span className="text-gray-500 font-normal"> - {variable.description}</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable.name] || ""}
                      onChange={(e) =>
                        setVariableValues((prev) => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                      placeholder={variable.default || `Enter ${variable.name}`}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg",
                        "bg-white dark:bg-[#0a0a0a]",
                        "border border-gray-200 dark:border-[#262626]",
                        "text-gray-900 dark:text-white",
                        "placeholder-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Content */}
          <div className="rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111] overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
              <h2 className="font-medium text-gray-900 dark:text-white">
                Prompt
              </h2>
              <button
                onClick={handleCopy}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                  "bg-blue-500/10 text-blue-500 border border-blue-500/30",
                  "hover:bg-blue-500/20 transition-colors"
                )}
              >
                {isCopied ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div
              className="p-4 whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContent(prompt.content) }}
            />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-[#262626]">
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                isSaved
                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                isSaving && "opacity-50 cursor-wait"
              )}
            >
              <BookmarkIcon className={cn("w-5 h-5", isSaved && "fill-current")} />
              {isSaved ? "Saved" : "Save"}
              <span className="text-gray-400">({saveCount})</span>
            </button>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-2">
                {avgRating > 0 ? avgRating.toFixed(1) : "Not rated"} ({ratingCount})
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    disabled={isRating}
                    className={cn(
                      "p-1 transition-colors",
                      isRating && "cursor-wait"
                    )}
                    title={`Rate ${star} stars`}
                  >
                    <StarIcon
                      className={cn(
                        "w-6 h-6 transition-colors",
                        (userRating && star <= userRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Use with Claude button */}
          <div className="mt-6">
            <button
              onClick={handleCopy}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white font-semibold text-lg",
                "hover:shadow-lg hover:-translate-y-0.5 transition-all"
              )}
            >
              <PlayIcon className="w-5 h-5" />
              Copy & Use with Claude
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />
      <main className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6" />
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
          <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-8" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-6" />
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
