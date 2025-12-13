"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { cn } from "@/lib/design-system";
import { createSuggestion } from "@/app/actions/suggestions";
import { useToast } from "@/components/toast";

interface SuggestEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: "resource" | "doc";
  resourceId: string;
  resourceTitle?: string;
}

const SUGGESTION_TYPES = [
  { value: "typo", label: "Typo / Grammar", description: "Fix spelling or grammatical errors" },
  { value: "content", label: "Content Update", description: "Update outdated or incorrect information" },
  { value: "metadata", label: "Metadata", description: "Fix tags, links, or other metadata" },
  { value: "other", label: "Other", description: "Other improvements or additions" },
] as const;

type SuggestionType = (typeof SUGGESTION_TYPES)[number]["value"];

export function SuggestEditModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
}: SuggestEditModalProps) {
  const [suggestionType, setSuggestionType] = useState<SuggestionType>("content");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedChanges, setSuggestedChanges] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your suggestion");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe your suggestion");
      return;
    }

    startTransition(async () => {
      const result = await createSuggestion(
        resourceType,
        resourceId,
        suggestionType,
        title,
        description,
        suggestedChanges
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Thank you! Your suggestion has been submitted for review.");
        // Reset form
        setTitle("");
        setDescription("");
        setSuggestedChanges("");
        setSuggestionType("content");
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  const descriptionLength = description.length;
  const maxDescription = 5000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-lg",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-xl shadow-2xl",
          "animate-scale-in",
          "max-h-[90vh] overflow-hidden flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#262626]">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggest an Edit
            </h3>
            {resourceTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                for &ldquo;{resourceTitle}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Suggestion Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What type of edit is this?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSuggestionType(type.value)}
                    className={cn(
                      "p-3 rounded-lg text-left transition-colors",
                      "border",
                      suggestionType === type.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        suggestionType === type.value
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      )}
                    >
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="suggestion-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="suggestion-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your suggestion"
                maxLength={200}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "bg-white dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {title.length}/200
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="suggestion-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="suggestion-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what should be changed and why..."
                rows={3}
                maxLength={maxDescription}
                className={cn(
                  "w-full px-3 py-2 rounded-lg resize-none",
                  "bg-white dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  descriptionLength > maxDescription * 0.9 && "border-yellow-500"
                )}
              />
              <p
                className={cn(
                  "mt-1 text-xs text-right",
                  descriptionLength > maxDescription * 0.9
                    ? "text-yellow-500"
                    : "text-gray-400"
                )}
              >
                {descriptionLength}/{maxDescription}
              </p>
            </div>

            {/* Suggested Changes (optional) */}
            <div>
              <label
                htmlFor="suggested-changes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Suggested Text (optional)
              </label>
              <textarea
                id="suggested-changes"
                value={suggestedChanges}
                onChange={(e) => setSuggestedChanges(e.target.value)}
                placeholder="Paste or write the corrected text here..."
                rows={4}
                className={cn(
                  "w-full px-3 py-2 rounded-lg resize-none font-mono text-sm",
                  "bg-white dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                If you have specific text changes, include them here
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-[#262626]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Suggestions are reviewed by our team
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg",
                "text-gray-600 dark:text-gray-400",
                "hover:text-gray-900 dark:hover:text-white",
                "transition-colors"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !title.trim() || !description.trim()}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-sm",
                "hover:shadow-md",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            >
              {isPending ? "Submitting..." : "Submit Suggestion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
