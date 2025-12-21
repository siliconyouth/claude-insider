"use client";

/**
 * Create New Prompt Page
 *
 * Form for creating new prompt templates.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import {
  ArrowLeftIcon,
  SparklesIcon,
  XIcon,
  EyeIcon,
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

export default function NewPromptPage() {
  const router = useRouter();

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetch("/api/prompts/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

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
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
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
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Update variable
  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    setVariables((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
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
        router.push("/login?redirect=/prompts/new");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create prompt");
      }

      const data = await response.json();
      router.push(`/prompts/${data.prompt.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Format preview content
  const formatPreview = () => {
    let preview = content;
    for (const variable of variables) {
      const value = variable.default || `[${variable.name}]`;
      preview = preview.replace(
        new RegExp(`\\{\\{${variable.name}\\}\\}`, "g"),
        `<span class="text-cyan-500 font-medium">${value}</span>`
      );
    }
    return preview;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 pt-8 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
              Create New Prompt
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share your prompt template with the community or keep it private.
            </p>
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
                href="/prompts"
                className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-semibold",
                  "hover:shadow-lg hover:-translate-y-0.5 transition-all",
                  isLoading && "opacity-50 cursor-wait"
                )}
              >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? "Creating..." : "Create Prompt"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
