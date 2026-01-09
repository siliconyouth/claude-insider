"use client";

/**
 * Prompt Submission Page
 *
 * Community contribution form for submitting new prompts.
 *
 * Features:
 * - Title, description, content fields
 * - Category selection (18 categories)
 * - Tags input
 * - Source URL for attribution
 * - Terms acceptance
 * - AI analysis on submit
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import {
  ArrowLeftIcon,
  SendIcon,
  Loader2Icon,
  InfoIcon,
  CheckIcon,
  SparklesIcon,
  XIcon,
  PlusIcon,
  AlertCircleIcon,
  CodeIcon,
  PencilIcon,
  BarChartIcon,
  LightbulbIcon,
  ZapIcon,
  BookOpenIcon,
  MessageSquareIcon,
  BriefcaseIcon,
  TheaterIcon,
  SearchIcon,
  MegaphoneIcon,
  ScaleIcon,
  HeartIcon,
  GraduationCapIcon,
  LanguagesIcon,
  PaletteIcon,
  ServerIcon,
  ShieldIcon,
} from "lucide-react";

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  coding: CodeIcon,
  writing: PencilIcon,
  analysis: BarChartIcon,
  creative: LightbulbIcon,
  productivity: ZapIcon,
  learning: BookOpenIcon,
  conversation: MessageSquareIcon,
  business: BriefcaseIcon,
  roleplay: TheaterIcon,
  research: SearchIcon,
  marketing: MegaphoneIcon,
  legal: ScaleIcon,
  healthcare: HeartIcon,
  education: GraduationCapIcon,
  translation: LanguagesIcon,
  design: PaletteIcon,
  devops: ServerIcon,
  security: ShieldIcon,
};

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export default function SubmitPromptPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check authentication and fetch categories
  useEffect(() => {
    async function init() {
      // Check auth
      const authRes = await fetch("/api/auth/session");
      const authData = await authRes.json();
      setIsAuthenticated(!!authData.session?.user);

      // Fetch categories
      const catRes = await fetch("/api/prompts/categories");
      const catData = await catRes.json();
      setCategories(catData.categories || []);
    }
    init();
  }, []);

  // Handle tag input
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        handleAddTag();
      } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
        setTags(tags.slice(0, -1));
      }
    },
    [handleAddTag, tagInput, tags]
  );

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!content.trim()) {
      newErrors.content = "Prompt content is required";
    } else if (content.length < 20) {
      newErrors.content = "Prompt must be at least 20 characters";
    } else if (content.length > 50000) {
      newErrors.content = "Prompt must be less than 50,000 characters";
    }

    if (!categoryId) {
      newErrors.categoryId = "Please select a category";
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = "You must accept the terms";
    }

    if (sourceUrl && !isValidUrl(sourceUrl)) {
      newErrors.sourceUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content, categoryId, acceptedTerms, sourceUrl]);

  // URL validation helper
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setIsSubmitting(true);
      setErrors({});

      try {
        const response = await fetch("/api/prompts/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            content: content.trim(),
            categoryId,
            tags,
            sourceUrl: sourceUrl.trim() || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login?redirect=/prompts/submit");
            return;
          }
          throw new Error(data.error || "Failed to submit prompt");
        }

        setSubmitSuccess(true);
      } catch (err) {
        setErrors({
          submit: err instanceof Error ? err.message : "Failed to submit prompt",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, description, content, categoryId, tags, sourceUrl, validateForm, router]
  );

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
        </main>
        <Footer />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-violet-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign in to Submit a Prompt
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create an account or sign in to contribute prompts to the community library.
            </p>
            <Link
              href="/login?redirect=/prompts/submit"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white font-semibold",
                "hover:shadow-lg transition-all"
              )}
            >
              Sign in to Continue
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show success message after submission
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Prompt Submitted!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for contributing! Your prompt is being reviewed by our AI
              and will be published after moderation approval.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/prompts"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                )}
              >
                Browse Prompts
              </Link>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setTitle("");
                  setDescription("");
                  setContent("");
                  setCategoryId("");
                  setTags([]);
                  setSourceUrl("");
                  setAcceptedTerms(false);
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-medium",
                  "hover:shadow-lg transition-all"
                )}
              >
                <PlusIcon className="w-4 h-4" />
                Submit Another
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Submit a Prompt
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share your best prompts with the community. Submitted prompts will be
              reviewed and adapted for Claude best practices before publishing.
            </p>
          </div>

          {/* Info Box */}
          <div className={cn(
            "rounded-xl p-4 mb-8",
            "bg-blue-500/5 border border-blue-500/20"
          )}>
            <div className="flex gap-3">
              <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Submission Guidelines
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Prompts are reviewed and may be adapted for Claude best practices</li>
                  <li>Include clear instructions and expected output format</li>
                  <li>Use {"{{variable}}"} syntax for customizable parts</li>
                  <li>Credit the original source if applicable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code Review Assistant"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border transition-colors",
                  errors.title
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 dark:border-[#262626] focus:border-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this prompt does"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                )}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Prompt Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your prompt here. Use {{variable}} for customizable parts."
                rows={12}
                className={cn(
                  "w-full px-4 py-3 rounded-lg font-mono text-sm",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border transition-colors",
                  errors.content
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 dark:border-[#262626] focus:border-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  "resize-y min-h-[200px]"
                )}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>{content.length} / 50,000 characters</span>
                {errors.content && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircleIcon className="w-3 h-3" />
                    {errors.content}
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] || CodeIcon;
                  const isSelected = categoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                        "border",
                        isSelected
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-500"
                          : "bg-gray-50 dark:bg-[#111111] border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:border-blue-500/30"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  {errors.categoryId}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tags <span className="text-gray-400">(optional, max 10)</span>
              </label>
              <div className={cn(
                "flex flex-wrap items-center gap-2 p-2 rounded-lg",
                "bg-gray-50 dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
              )}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleAddTag}
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                  disabled={tags.length >= 10}
                  className={cn(
                    "flex-1 min-w-[100px] px-2 py-1",
                    "bg-transparent border-0 outline-none",
                    "text-gray-900 dark:text-white text-sm",
                    "placeholder-gray-400 dark:placeholder-gray-500"
                  )}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Press Enter or comma to add a tag
              </p>
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Source URL <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/original-source"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border transition-colors",
                  errors.sourceUrl
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 dark:border-[#262626] focus:border-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                Credit the original author if this prompt is from another source
              </p>
              {errors.sourceUrl && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  {errors.sourceUrl}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="rounded-xl border border-gray-200 dark:border-[#262626] p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I confirm that this prompt is my own work or I have permission to share it.
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-500 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-500 hover:underline">
                    Privacy Policy
                  </Link>.
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  {errors.acceptedTerms}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-xl p-4 bg-red-500/5 border border-red-500/20">
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white font-semibold text-lg",
                "hover:shadow-lg hover:-translate-y-0.5 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <SendIcon className="w-5 h-5" />
                  Submit Prompt
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
