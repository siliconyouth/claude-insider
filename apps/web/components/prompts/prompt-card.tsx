"use client";

/**
 * Prompt Card Component
 *
 * Displays a prompt in a card format with:
 * - Title and description
 * - Category and tags
 * - Usage stats (saves, uses, rating)
 * - Author info
 * - Save/unsave action
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  BookmarkIcon,
  SparklesIcon,
  UserIcon,
  StarIcon,
  CopyIcon,
  CheckIcon,
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
  coding: <CodeIcon className="w-4 h-4" />,
  writing: <PencilIcon className="w-4 h-4" />,
  analysis: <BarChartIcon className="w-4 h-4" />,
  creative: <LightbulbIcon className="w-4 h-4" />,
  productivity: <ZapIcon className="w-4 h-4" />,
  learning: <BookOpenIcon className="w-4 h-4" />,
  conversation: <MessageSquareIcon className="w-4 h-4" />,
  business: <BriefcaseIcon className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  coding: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  writing: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  analysis: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  creative: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  productivity: "bg-green-500/10 text-green-400 border-green-500/30",
  learning: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  conversation: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  business: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

interface PromptCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface PromptAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: PromptCategory | null;
  tags: string[];
  author: PromptAuthor | null;
  visibility: string;
  isFeatured: boolean;
  isSystem: boolean;
  useCount: number;
  saveCount: number;
  avgRating: number;
  ratingCount: number;
  isSaved: boolean;
  userRating: number | null;
  createdAt: string;
}

interface PromptCardProps {
  prompt: Prompt;
  onSave?: (id: string) => Promise<void>;
  onCopy?: (content: string) => void;
  variant?: "default" | "compact";
}

export function PromptCard({
  prompt,
  onSave,
  onCopy,
  variant = "default",
}: PromptCardProps) {
  const [isSaved, setIsSaved] = useState(prompt.isSaved);
  const [saveCount, setSaveCount] = useState(prompt.saveCount);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaving || !onSave) return;

    setIsSaving(true);
    try {
      await onSave(prompt.id);
      setIsSaved(!isSaved);
      setSaveCount(prev => isSaved ? prev - 1 : prev + 1);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(prompt.content);
      setIsCopied(true);
      onCopy?.(prompt.content);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const categorySlug = prompt.category?.slug || "coding";
  const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.coding;
  const categoryIcon = CATEGORY_ICONS[categorySlug] || CATEGORY_ICONS.coding;

  return (
    <Link
      href={`/prompts/${prompt.slug}`}
      className={cn(
        "group block rounded-xl p-4 bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5",
        "transition-all duration-300",
        variant === "compact" && "p-3"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {prompt.isSystem && (
              <SparklesIcon className="w-4 h-4 text-violet-400 flex-shrink-0" />
            )}
            <h3 className={cn(
              "font-semibold text-gray-900 dark:text-white truncate",
              "group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors",
              variant === "compact" ? "text-sm" : "text-base"
            )}>
              {prompt.title}
            </h3>
            {prompt.isFeatured && (
              <span className="px-1.5 py-0.5 text-[10px] bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
                Featured
              </span>
            )}
          </div>
          {prompt.description && variant !== "compact" && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {prompt.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopy}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="Copy prompt"
          >
            {isCopied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isSaved
                  ? "text-blue-500 bg-blue-500/10"
                  : "text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800",
                isSaving && "opacity-50 cursor-wait"
              )}
              title={isSaved ? "Unsave prompt" : "Save prompt"}
            >
              <BookmarkIcon className={cn("w-4 h-4", isSaved && "fill-current")} />
            </button>
          )}
        </div>
      </div>

      {/* Category and Tags */}
      <div className="flex items-center flex-wrap gap-2 mb-3">
        {prompt.category && (
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
            categoryColor
          )}>
            {categoryIcon}
            {prompt.category.name}
          </span>
        )}
        {variant !== "compact" && prompt.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: Stats and Author */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <div className="flex items-center gap-3">
          {prompt.avgRating > 0 && (
            <span className="flex items-center gap-1">
              <StarIcon className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              {prompt.avgRating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookmarkIcon className="w-3.5 h-3.5" />
            {saveCount}
          </span>
          {prompt.useCount > 0 && (
            <span>{prompt.useCount.toLocaleString()} uses</span>
          )}
        </div>

        {prompt.author ? (
          <div className="flex items-center gap-1.5">
            {prompt.author.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={prompt.author.image}
                alt={prompt.author.name || "Author"}
                className="w-4 h-4 rounded-full"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5" />
            )}
            <span className="truncate max-w-[80px]">
              {prompt.author.name || "Anonymous"}
            </span>
          </div>
        ) : prompt.isSystem ? (
          <span className="text-violet-400">Claude Insider</span>
        ) : null}
      </div>
    </Link>
  );
}

// Skeleton for loading state
export function PromptCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  return (
    <div className={cn(
      "rounded-xl p-4 bg-white dark:bg-[#111111]",
      "border border-gray-200 dark:border-[#262626]",
      variant === "compact" && "p-3"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
          {variant !== "compact" && (
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          )}
        </div>
        <div className="flex gap-1">
          <div className="w-7 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="w-7 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
      </div>
      <div className="flex justify-between">
        <div className="flex gap-3">
          <div className="h-4 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  );
}
