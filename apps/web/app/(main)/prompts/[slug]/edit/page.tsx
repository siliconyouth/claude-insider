"use client";

/**
 * Edit Prompt Page
 *
 * Form for editing existing prompt templates.
 * Similar to the new prompt page but pre-populated with existing data.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import {
  ArrowLeftIcon,
  SaveIcon,
  XIcon,
  EyeIcon,
  Loader2Icon,
  AlertTriangleIcon,
} from "lucide-react";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface Variable {
  name: string;
  description: string;
  default: string;
}

interface PromptData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: { id: string; slug: string; name: string } | null;
  tags: string[];
  variables: Variable[];
  visibility: "private" | "public" | "unlisted";
  isSystem: boolean;
}

export default function EditPromptPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Prompt data state
  const [promptId, setPromptId] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [visibility, setVisibility] = useState<"private" | "public" | "unlisted">("private");

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isSystem, setIsSystem] = useState(false);

  // Fetch prompt data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both in parallel
        const [promptRes, categoriesRes] = await Promise.all([
          fetch(`/api/prompts/${slug}`),
          fetch("/api/prompts/categories"),
        ]);

        if (!promptRes.ok) {
          if (promptRes.status === 404) {
            setError("Prompt not found");
          } else if (promptRes.status === 401) {
            router.push(`/login?redirect=/prompts/${slug}/edit`);
            return;
          } else {
            setError("Failed to load prompt");
          }
          setIsLoading(false);
          return;
        }

        const promptData = await promptRes.json();
        const categoriesData = await categoriesRes.json();

        // Check edit permission
        if (!promptData.canEdit) {
          setError("You don't have permission to edit this prompt");
          setIsLoading(false);
          return;
        }

        const prompt = promptData.prompt as PromptData;

        // Populate form
        setPromptId(prompt.id);
        setOriginalSlug(prompt.slug);
        setTitle(prompt.title);
        setDescription(prompt.description || "");
        setContent(prompt.content);
        setCategoryId(prompt.category?.id || "");
        setTags(prompt.tags || []);
        setVariables(prompt.variables || []);
        setVisibility(prompt.visibility);
        setCanEdit(true);
        setIsSystem(prompt.isSystem);

        setCategories(categoriesData.categories || []);
      } catch (err) {
        console.error("Error loading prompt:", err);
        setError("Failed to load prompt data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, router]);

  // Auto-detect variables from content
  useEffect(() => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    const varNames = [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];

    setVariables((prev) => {
      const existing = new Map(prev.map((v) => [v.name, v]));
      return varNames.map((name) => existing.get(name) || { name, description: "", default: "" });
    });
  }, [content]);

  // Handle tag input
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  }, [tags]);

  // Update variable
  const updateVariable = useCallback((index: number, field: keyof Variable, value: string) => {
    setVariables((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (!promptId) {
      setError("Prompt ID not found");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          categoryId: categoryId || null,
          tags,
          variables: variables.filter((v) => v.name),
          visibility,
        }),
      });

      if (response.status === 401) {
        router.push(`/login?redirect=/prompts/${slug}/edit`);
        return;
      }

      if (response.status === 403) {
        setError("You don't have permission to edit this prompt");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update prompt");
      }

      const data = await response.json();
      // Redirect to the prompt detail page (use original slug in case it didn't change)
      router.push(`/prompts/${data.prompt.slug || originalSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  // Format preview content - escapes HTML to prevent XSS while still highlighting variables
  // This is safe because:
  // 1. The content is the user's own input (not from other users)
  // 2. We escape any HTML entities first
  // 3. We only add our own controlled span tags for variable highlighting
  const formatPreview = useCallback(() => {
    // First escape any HTML in the content to prevent XSS
    let preview = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Then highlight variables with our controlled spans
    for (const variable of variables) {
      const value = (variable.default || `[${variable.name}]`)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      preview = preview.replace(
        new RegExp(`\\{\\{${variable.name}\\}\\}`, "g"),
        `<span class="text-cyan-500 font-medium">${value}</span>`
      );
    }
    return preview;
  }, [content, variables]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-gray-500 dark:text-gray-400">Loading prompt...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state (no permission or not found)
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
            <AlertTriangleIcon className="w-12 h-12 text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {error || "Cannot edit this prompt"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {error === "Prompt not found"
                ? "The prompt you're looking for doesn't exist or has been deleted."
                : "You may not have permission to edit this prompt, or you need to sign in."}
            </p>
            <div className="flex gap-3 mt-4">
              <Link
                href="/prompts"
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Browse Prompts
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
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
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/prompts/${originalSlug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Prompt
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Edit Prompt
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Make changes to your prompt template.
            </p>
            {isSystem && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm">
                <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                This is a system prompt. Changes will affect all users.
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 mb-6 text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Code Review Assistant"
                required
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-gray-100 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this prompt does"
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-gray-100 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Prompt Content *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    "text-sm flex items-center gap-1 transition-colors",
                    showPreview
                      ? "text-blue-500"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  <EyeIcon className="w-4 h-4" />
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Use {"{{variable}}"} syntax for customizable parts. E.g., {"{{code}}"}, {"{{language}}"}
              </p>
              {showPreview ? (
                <div
                  className={cn(
                    "w-full px-4 py-3 rounded-xl min-h-[200px]",
                    "bg-gray-100 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "whitespace-pre-wrap font-mono text-sm"
                  )}
                  // Safe: content is escaped and only controlled spans are added
                  dangerouslySetInnerHTML={{ __html: formatPreview() }}
                />
              ) : (
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your prompt template here..."
                  required
                  rows={8}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl resize-y",
                    "bg-gray-100 dark:bg-[#111111]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white font-mono text-sm",
                    "placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  )}
                />
              )}
            </div>

            {/* Variables */}
            {variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables ({variables.length})
                </label>
                <div className="space-y-3">
                  {variables.map((variable, index) => (
                    <div
                      key={variable.name}
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg",
                        "bg-gray-100 dark:bg-[#111111]",
                        "border border-gray-200 dark:border-[#262626]"
                      )}
                    >
                      <div>
                        <span className="text-xs text-gray-500 mb-1 block">Name</span>
                        <span className="font-mono text-violet-500">{`{{${variable.name}}}`}</span>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Description</label>
                        <input
                          type="text"
                          value={variable.description}
                          onChange={(e) => updateVariable(index, "description", e.target.value)}
                          placeholder="What this variable is for"
                          className={cn(
                            "w-full px-2 py-1 rounded text-sm",
                            "bg-white dark:bg-[#0a0a0a]",
                            "border border-gray-200 dark:border-[#262626]",
                            "text-gray-900 dark:text-white",
                            "focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Default value</label>
                        <input
                          type="text"
                          value={variable.default}
                          onChange={(e) => updateVariable(index, "default", e.target.value)}
                          placeholder="Optional default"
                          className={cn(
                            "w-full px-2 py-1 rounded text-sm",
                            "bg-white dark:bg-[#0a0a0a]",
                            "border border-gray-200 dark:border-[#262626]",
                            "text-gray-900 dark:text-white",
                            "focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl appearance-none",
                  "bg-gray-100 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div
                className={cn(
                  "flex flex-wrap gap-2 px-3 py-2 rounded-xl min-h-[48px]",
                  "bg-gray-100 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "focus-within:ring-2 focus-within:ring-blue-500/50"
                )}
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-700"
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
                  placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
                  className={cn(
                    "flex-1 min-w-[100px] bg-transparent border-none outline-none",
                    "text-gray-900 dark:text-white text-sm",
                    "placeholder-gray-500"
                  )}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to add a tag. Maximum 10 tags.
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "private" as const, label: "Private", desc: "Only you can see it" },
                  { value: "unlisted" as const, label: "Unlisted", desc: "Anyone with link can see" },
                  { value: "public" as const, label: "Public", desc: "Visible in the library" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl text-left transition-all",
                      "border",
                      visibility === opt.value
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                        : "bg-gray-100 dark:bg-[#111111] border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs opacity-70">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-[#262626]">
              <Link
                href={`/prompts/${originalSlug}`}
                className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-semibold",
                  "hover:shadow-lg hover:-translate-y-0.5 transition-all",
                  isSaving && "opacity-50 cursor-wait"
                )}
              >
                {isSaving ? (
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                ) : (
                  <SaveIcon className="w-5 h-5" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
