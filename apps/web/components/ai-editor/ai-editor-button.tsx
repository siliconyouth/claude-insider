"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";
import { useSession } from "@/lib/auth-client";
import { createSuggestion } from "@/app/actions/suggestions";
import type { EditorContext } from "./types";

// Lazy load the heavy modal component
const AIEditorModal = dynamic(
  () => import("./ai-editor-modal").then((m) => ({ default: m.AIEditorModal })),
  { ssr: false }
);

interface AIEditorButtonProps {
  content: string;
  context: EditorContext;
  variant?: "button" | "link";
  className?: string;
}

export function AIEditorButton({
  content,
  context,
  variant = "link",
  className,
}: AIEditorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  // Handle saving - creates edit suggestion
  const handleSave = useCallback(
    async (editedContent: string, _isDirect: boolean) => {
      if (!session?.user?.id) {
        throw new Error("You must be signed in to suggest edits");
      }

      // Create diff summary for suggestion title
      const originalLines = content.split("\n").length;
      const editedLines = editedContent.split("\n").length;
      const lineDiff = editedLines - originalLines;
      const diffText =
        lineDiff === 0
          ? "Modified content"
          : lineDiff > 0
            ? `Added ${lineDiff} lines`
            : `Removed ${Math.abs(lineDiff)} lines`;

      // Submit as edit suggestion
      const result = await createSuggestion(
        "doc",
        context.slug || "unknown",
        "content",
        `AI-assisted edit: ${diffText}`,
        `This edit was created using the AI Writing Assistant.\n\nChanges to: ${context.title || "Document"}\nCategory: ${context.category || "General"}`,
        editedContent
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to submit suggestion");
      }
    },
    [content, context, session]
  );

  // Don't render if no content
  if (!content) return null;

  const buttonContent = (
    <>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
      <span>Edit with AI</span>
    </>
  );

  return (
    <>
      {variant === "link" ? (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            "text-gray-500 dark:text-gray-400",
            "hover:text-blue-600 dark:hover:text-cyan-400",
            "transition-colors",
            className
          )}
        >
          {buttonContent}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
            "border border-gray-200 dark:border-[#262626]",
            "bg-white dark:bg-[#111111]",
            "text-gray-700 dark:text-gray-300",
            "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/20",
            "transition-all duration-200",
            className
          )}
        >
          {buttonContent}
        </button>
      )}

      {isOpen && (
        <AIEditorModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialContent={content}
          context={context}
          onSave={handleSave}
          canEditDirectly={false} // TODO: Check user role for direct edits
        />
      )}
    </>
  );
}
