"use client";

/**
 * Shared Prompt Fill Page
 *
 * Displays a publicly shared prompt fill created by another user.
 * Users can:
 * - View the filled prompt
 * - Copy to clipboard
 * - Use with AI Assistant
 * - Fork to create their own version
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  UserIcon,
  ClockIcon,
  GitForkIcon,
  StarIcon,
  ShareIcon,
  Loader2Icon,
} from "lucide-react";
import { openAIAssistant, type AIContext } from "@/components/unified-chat/unified-chat-provider";

interface SharedFill {
  id: string;
  user_id: string;
  prompt_id: string;
  title: string;
  variable_values: Record<string, string>;
  final_content: string;
  builder_mode: string;
  is_public: boolean;
  star_count: number;
  created_at: string;
  updated_at: string;
  prompt_title: string;
  prompt_slug: string;
  prompt_content: string;
  category_name: string | null;
  category_slug: string | null;
  author_name: string | null;
  author_image: string | null;
}

export default function SharedPromptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [fill, setFill] = useState<SharedFill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isForking, setIsForking] = useState(false);

  // Fetch fill data
  useEffect(() => {
    async function fetchFill() {
      if (!token) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/prompts/builder/fills/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load shared prompt");
          return;
        }

        setFill(data.fill);
      } catch {
        setError("Failed to load shared prompt");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFill();
  }, [token]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!fill) return;

    try {
      await navigator.clipboard.writeText(fill.final_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Failed to copy
    }
  }, [fill]);

  // Use with AI
  const handleUseWithAI = useCallback(() => {
    if (!fill) return;

    const context: AIContext = {
      page: {
        path: `/prompts/shared/${token}`,
        title: fill.title,
        category: fill.category_slug || "prompts",
        section: "Shared Prompts",
      },
      content: {
        type: "prompt",
        title: fill.title,
        text: fill.final_content,
        metadata: {
          sharedFillId: fill.id,
          originalPrompt: fill.prompt_slug,
          builderMode: fill.builder_mode,
        },
      },
    };

    openAIAssistant({
      context,
      question: fill.final_content,
    });
  }, [fill, token]);

  // Fork this fill
  const handleFork = useCallback(async () => {
    if (!fill || isForking) return;

    setIsForking(true);
    try {
      const response = await fetch("/api/prompts/builder/fills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: fill.prompt_id,
          title: `${fill.title} (Forked)`,
          variableValues: fill.variable_values,
          finalContent: fill.final_content,
          builderMode: fill.builder_mode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.fill?.id) {
        router.push(`/prompts/${fill.prompt_slug}?forked=${data.fill.id}`);
      }
    } catch {
      // Fork failed
    } finally {
      setIsForking(false);
    }
  }, [fill, isForking, router]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
  if (error || !fill) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Prompt Not Found
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error || "This shared prompt doesn't exist or is no longer public."}
            </p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <Link
            href="/prompts"
            className={cn(
              "inline-flex items-center gap-2 text-sm",
              "text-gray-500 dark:text-gray-400",
              "hover:text-gray-700 dark:hover:text-gray-200",
              "transition-colors mb-6"
            )}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Prompts
          </Link>

          {/* Shared badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
              )}
            >
              <ShareIcon className="w-3.5 h-3.5" />
              Shared Prompt
            </span>
            {fill.category_name && (
              <Link
                href={`/prompts?category=${fill.category_slug}`}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  "bg-gray-100 dark:bg-gray-800",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "transition-colors"
                )}
              >
                {fill.category_name}
              </Link>
            )}
          </div>

          {/* Title and meta */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {fill.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {/* Author */}
              <div className="flex items-center gap-2">
                {fill.author_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={fill.author_image}
                    alt={fill.author_name || "Author"}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <span>{fill.author_name || "Anonymous"}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {formatDate(fill.created_at)}
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1.5">
                <StarIcon className="w-4 h-4" />
                {fill.star_count} stars
              </div>

              {/* Based on */}
              <div className="flex items-center gap-1.5">
                Based on{" "}
                <Link
                  href={`/prompts/${fill.prompt_slug}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {fill.prompt_title}
                </Link>
              </div>
            </div>
          </div>

          {/* Content card */}
          <div
            className={cn(
              "rounded-xl p-6",
              "bg-gray-50 dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]",
              "mb-6"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filled Prompt
              </h2>
              <button
                onClick={handleCopy}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                  "text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-500" />
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

            <pre
              className={cn(
                "whitespace-pre-wrap font-mono text-sm",
                "text-gray-700 dark:text-gray-300",
                "bg-white dark:bg-[#0a0a0a]",
                "rounded-lg p-4",
                "border border-gray-200 dark:border-[#333]",
                "max-h-[400px] overflow-y-auto"
              )}
            >
              {fill.final_content}
            </pre>
          </div>

          {/* Variable values */}
          {Object.keys(fill.variable_values).length > 0 && (
            <div
              className={cn(
                "rounded-xl p-6",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "mb-6"
              )}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Variable Values
              </h2>
              <div className="space-y-3">
                {Object.entries(fill.variable_values).map(([name, value]) => (
                  <div key={name} className="flex items-start gap-4">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-mono",
                        "bg-violet-100 dark:bg-violet-500/20",
                        "text-violet-700 dark:text-violet-300"
                      )}
                    >
                      {`{{${name}}}`}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {value || "(empty)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleUseWithAI}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "text-white shadow-lg shadow-blue-500/25",
                "transition-all duration-200"
              )}
            >
              <SparklesIcon className="w-4 h-4" />
              Use with AI
            </button>

            <button
              onClick={handleFork}
              disabled={isForking}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                "text-gray-700 dark:text-gray-200",
                "transition-colors",
                "disabled:opacity-50"
              )}
            >
              {isForking ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <GitForkIcon className="w-4 h-4" />
              )}
              Fork & Customize
            </button>

            <Link
              href={`/prompts/${fill.prompt_slug}`}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                "text-gray-600 dark:text-gray-400",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-colors"
              )}
            >
              View Original Prompt
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
