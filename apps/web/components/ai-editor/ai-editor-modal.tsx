"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useSound } from "@/hooks/use-sound-effects";
import { AIToolbar } from "./ai-toolbar";
import { DiffPreview } from "./diff-preview";
import type { EditCommand, EditorContext, Selection } from "./types";

interface AIEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  context: EditorContext;
  onSave: (content: string, isDirect: boolean) => Promise<void>;
  canEditDirectly?: boolean;
}

export function AIEditorModal({
  isOpen,
  onClose,
  initialContent,
  context,
  onSave,
  canEditDirectly = false,
}: AIEditorModalProps) {
  const [content, setContent] = useState(initialContent);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playSuccess, playError } = useSound();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setEditedContent(null);
      setStreamingContent("");
      setShowDiff(false);
      setError(null);
      setSelection(null);
    }
  }, [isOpen, initialContent]);

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      setSelection({
        start,
        end,
        text: content.slice(start, end),
      });
    } else {
      setSelection(null);
    }
  }, [content]);

  // Execute AI edit command
  const executeCommand = useCallback(
    async (command: EditCommand, customPrompt?: string) => {
      setError(null);
      setIsStreaming(true);
      setStreamingContent("");
      setEditedContent(null);

      try {
        const response = await fetch("/api/assistant/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: selection ? content : content,
            command,
            customPrompt,
            selection: selection || undefined,
            context: {
              title: context.title,
              category: context.category,
              fullContent: selection ? content : undefined,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to process edit");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "text") {
                  fullResponse += data.content;
                  setStreamingContent(fullResponse);
                } else if (data.type === "done") {
                  // Streaming complete
                  if (selection) {
                    // Replace selection in content
                    const newContent =
                      content.slice(0, selection.start) +
                      fullResponse +
                      content.slice(selection.end);
                    setEditedContent(newContent);
                  } else {
                    setEditedContent(fullResponse);
                  }
                  setShowDiff(true);
                  playSuccess();
                } else if (data.type === "error") {
                  throw new Error(data.content);
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        playError();
      } finally {
        setIsStreaming(false);
      }
    },
    [content, selection, context, playSuccess, playError]
  );

  // Accept edited content
  const acceptEdit = useCallback(() => {
    if (editedContent) {
      setContent(editedContent);
      setEditedContent(null);
      setShowDiff(false);
      setStreamingContent("");
      setSelection(null);
    }
  }, [editedContent]);

  // Reject edited content
  const rejectEdit = useCallback(() => {
    setEditedContent(null);
    setShowDiff(false);
    setStreamingContent("");
  }, []);

  // Save content
  const handleSave = useCallback(
    async (isDirect: boolean) => {
      setIsSaving(true);
      try {
        await onSave(content, isDirect);
        playSuccess();
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save";
        setError(message);
        playError();
      } finally {
        setIsSaving(false);
      }
    },
    [content, onSave, onClose, playSuccess, playError]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to close
      if (e.key === "Escape") {
        if (showDiff) {
          rejectEdit();
        } else {
          onClose();
        }
        e.preventDefault();
      }

      // Cmd/Ctrl+Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleSave(canEditDirectly);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showDiff, rejectEdit, onClose, handleSave, canEditDirectly]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-editor-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-5xl max-h-[90vh] overflow-hidden",
          "bg-white dark:bg-[#111111] rounded-xl shadow-2xl",
          "border border-gray-200 dark:border-[#262626]",
          "flex flex-col animate-scale-in"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div>
            <h2
              id="ai-editor-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              AI Writing Assistant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {context.title || "Editing document"}
              {context.category && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                  {context.category}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            aria-label="Close editor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Toolbar */}
        <AIToolbar
          onCommand={executeCommand}
          isStreaming={isStreaming}
          hasSelection={!!selection}
          selectionText={selection?.text}
        />

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden flex">
          {showDiff && editedContent ? (
            <DiffPreview
              original={content}
              edited={editedContent}
              onAccept={acceptEdit}
              onReject={rejectEdit}
            />
          ) : (
            <div className="flex-1 flex flex-col p-4">
              {/* Streaming preview */}
              {isStreaming && streamingContent && (
                <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      AI is writing...
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {streamingContent}
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Selection indicator */}
              {selection && !isStreaming && (
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Selected: {selection.text.length} characters
                  <button
                    onClick={() => setSelection(null)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear selection
                  </button>
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onClick={handleSelectionChange}
                className={cn(
                  "flex-1 w-full p-4 rounded-lg resize-none",
                  "font-mono text-sm leading-relaxed",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-gray-100",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                placeholder="Enter content to edit..."
                disabled={isStreaming}
              />

              {/* Character count */}
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {content.length.toLocaleString()} characters
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#262626] font-mono">
              ⌘ Enter
            </kbd>{" "}
            to save
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              Cancel
            </button>
            {canEditDirectly ? (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving || isStreaming}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors"
                  )}
                >
                  Suggest Edit
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || isStreaming}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "shadow-lg shadow-blue-500/25",
                    "hover:opacity-90",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all"
                  )}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving || isStreaming}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium text-white",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "shadow-lg shadow-blue-500/25",
                  "hover:opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              >
                {isSaving ? "Submitting..." : "Submit Suggestion"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}
