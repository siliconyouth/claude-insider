"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { createComment } from "@/app/actions/comments";
import { useToast } from "@/components/toast";

interface CommentFormProps {
  resourceType: "resource" | "doc";
  resourceId: string;
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  resourceType,
  resourceId,
  parentId,
  placeholder = "Write a comment...",
  onSuccess,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const { isAuthenticated, showSignIn } = useAuth();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Sign in to comment");
      showSignIn();
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    startTransition(async () => {
      const result = await createComment(resourceType, resourceId, content, parentId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Comment submitted for review");
        setContent("");
        onSuccess?.();
      }
    });
  };

  const charCount = content.length;
  const maxChars = 2000;
  const isOverLimit = charCount > maxChars;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isAuthenticated ? placeholder : "Sign in to comment..."}
          disabled={isPending || !isAuthenticated}
          autoFocus={autoFocus}
          rows={3}
          className={cn(
            "w-full px-4 py-3 rounded-lg resize-none",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isOverLimit && "border-red-500 focus:ring-red-500"
          )}
        />

        {/* Character count */}
        <div className="absolute bottom-2 right-2">
          <span
            className={cn(
              "text-xs",
              isOverLimit
                ? "text-red-500"
                : charCount > maxChars * 0.9
                ? "text-yellow-500"
                : "text-gray-400"
            )}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Comments are reviewed before being published
        </p>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg",
                "text-gray-600 dark:text-gray-400",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "transition-colors"
              )}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || isOverLimit || !content.trim()}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-sm",
              "hover:shadow-md hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              "transition-all duration-200"
            )}
          >
            {isPending ? "Posting..." : parentId ? "Reply" : "Post Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}
