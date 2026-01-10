"use client";

/**
 * Prompt Playground
 *
 * Full-featured editor environment for power users.
 * Features:
 * - Monaco editor with syntax highlighting for {{variables}}
 * - Split-pane layout with variable sidebar
 * - Live preview panel
 * - Version history (future)
 * - Fork and share functionality (future)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";
import {
  XIcon,
  SparklesIcon,
  SidebarIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  SaveIcon,
  ShareIcon,
  HistoryIcon,
} from "lucide-react";
import {
  type PlaygroundProps,
  type BuilderValues,
  type PromptVariable,
  formatVariableName,
  substituteVariables,
  extractVariableNames,
} from "./types";

// Lazy load Monaco
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-[#1e1e1e] flex items-center justify-center">
      <Loader2Icon className="w-6 h-6 text-gray-500 animate-spin" />
    </div>
  ),
});

export function Playground({
  promptId,
  promptTitle = "Untitled Prompt",
  promptContent = "",
  variables: initialVariables = [],
  onSave,
  onClose,
}: PlaygroundProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [content, setContent] = useState(promptContent);
  const [title, setTitle] = useState(promptTitle);
  const [variables, setVariables] = useState<PromptVariable[]>(initialVariables);
  const [values, setValues] = useState<BuilderValues>(() => {
    const initial: BuilderValues = {};
    for (const v of initialVariables) {
      initial[v.name] = v.default_value || "";
    }
    return initial;
  });

  const [showSidebar, setShowSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const editorRef = useRef<unknown>(null);

  // ============================================================================
  // Computed
  // ============================================================================

  // Extract variables from content
  const detectedVariables = useMemo(() => extractVariableNames(content), [content]);

  // Merge detected variables with existing
  const allVariables = useMemo(() => {
    const existing = new Set(variables.map((v) => v.name));
    const result = [...variables];

    for (const name of detectedVariables) {
      if (!existing.has(name)) {
        result.push({ name, required: true });
      }
    }

    return result;
  }, [variables, detectedVariables]);

  const finalContent = useMemo(
    () => substituteVariables(content, values),
    [content, values]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Track changes
  useEffect(() => {
    const changed =
      content !== promptContent ||
      title !== promptTitle ||
      JSON.stringify(variables) !== JSON.stringify(initialVariables);
    setHasChanges(changed);
  }, [content, title, variables, promptContent, promptTitle, initialVariables]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleContentChange = useCallback((value: string | undefined) => {
    setContent(value || "");
  }, []);

  const handleValueChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAddVariable = useCallback(() => {
    const existingNames = new Set(allVariables.map((v) => v.name));
    let newName = "new_variable";
    let counter = 1;
    while (existingNames.has(newName)) {
      newName = `new_variable_${counter++}`;
    }

    setVariables((prev) => [...prev, { name: newName, required: true }]);
    setValues((prev) => ({ ...prev, [newName]: "" }));

    // Insert into content
    setContent((prev) => prev + `{{${newName}}}`);
  }, [allVariables]);

  const handleRemoveVariable = useCallback(
    (name: string) => {
      setVariables((prev) => prev.filter((v) => v.name !== name));
      setValues((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });

      // Remove from content
      setContent((prev) => prev.replace(new RegExp(`\\{\\{${name}\\}\\}`, "g"), ""));
    },
    []
  );

  const handleRenameVariable = useCallback(
    (oldName: string, newName: string) => {
      if (!newName.trim() || oldName === newName) return;
      if (allVariables.some((v) => v.name === newName && v.name !== oldName)) return;

      setVariables((prev) =>
        prev.map((v) => (v.name === oldName ? { ...v, name: newName } : v))
      );
      setValues((prev) => {
        const next = { ...prev };
        next[newName] = next[oldName] || "";
        delete next[oldName];
        return next;
      });

      // Update in content
      setContent((prev) =>
        prev.replace(new RegExp(`\\{\\{${oldName}\\}\\}`, "g"), `{{${newName}}}`)
      );
    },
    [allVariables]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(finalContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied
    }
  }, [finalContent]);

  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        promptId,
        variableValues: values,
        finalContent,
        title,
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [promptId, values, finalContent, title, onSave, isSaving]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] bg-[#111111]">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              "text-gray-400 hover:text-white",
              "hover:bg-gray-800",
              "transition-colors"
            )}
          >
            <XIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-violet-500" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "bg-transparent border-none text-lg font-semibold text-white",
                "focus:outline-none focus:ring-0",
                "placeholder-gray-500"
              )}
              placeholder="Untitled Prompt"
            />
            {hasChanges && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">
                Unsaved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle buttons */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSidebar
                ? "text-blue-400 bg-blue-500/10"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
            title="Toggle variables panel"
          >
            <SidebarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showPreview
                ? "text-blue-400 bg-blue-500/10"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
            title="Toggle preview panel"
          >
            {showPreview ? (
              <EyeIcon className="w-5 h-5" />
            ) : (
              <EyeOffIcon className="w-5 h-5" />
            )}
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Actions */}
          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              "text-gray-400 hover:text-white hover:bg-gray-800",
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

          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
                "text-gray-400 hover:text-white hover:bg-gray-800",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <SaveIcon className="w-4 h-4" />
              )}
              Save
            </button>
          )}

          <button
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              "text-gray-400 hover:text-white hover:bg-gray-800",
              "transition-colors opacity-50 cursor-not-allowed"
            )}
            disabled
            title="Coming soon"
          >
            <ShareIcon className="w-4 h-4" />
            Share
          </button>

          <button
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              "text-gray-400 hover:text-white hover:bg-gray-800",
              "transition-colors opacity-50 cursor-not-allowed"
            )}
            disabled
            title="Coming soon"
          >
            <HistoryIcon className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Variables Sidebar */}
        {showSidebar && (
          <div className="w-72 flex-shrink-0 border-r border-[#262626] bg-[#111111] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
              <span className="text-sm font-medium text-gray-300">
                Variables ({allVariables.length})
              </span>
              <button
                onClick={handleAddVariable}
                className={cn(
                  "p-1.5 rounded-lg",
                  "text-gray-400 hover:text-white hover:bg-gray-800",
                  "transition-colors"
                )}
                title="Add variable"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {allVariables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) =>
                        handleRenameVariable(variable.name, e.target.value)
                      }
                      className={cn(
                        "flex-1 bg-transparent text-sm font-medium text-gray-300",
                        "border-none focus:outline-none focus:ring-0",
                        "hover:text-white"
                      )}
                    />
                    <button
                      onClick={() => handleRemoveVariable(variable.name)}
                      className={cn(
                        "p-1 rounded text-gray-500 hover:text-red-400",
                        "transition-colors"
                      )}
                      title="Remove variable"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={values[variable.name] || ""}
                    onChange={(e) =>
                      handleValueChange(variable.name, e.target.value)
                    }
                    placeholder={`Enter ${formatVariableName(variable.name).toLowerCase()}`}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm",
                      "bg-[#0a0a0a] border border-[#333]",
                      "text-white placeholder-gray-500",
                      "focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
                    )}
                  />
                </div>
              ))}

              {allVariables.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No variables defined</p>
                  <p className="text-xs mt-1">
                    Use {`{{variable_name}}`} in your prompt
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className={cn("flex-1 flex flex-col", !showPreview && "flex-1")}>
          <div className="px-4 py-2 border-b border-[#262626] bg-[#0d0d0d]">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Editor
            </span>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="markdown"
              theme="vs-dark"
              value={content}
              onChange={handleContentChange}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                folding: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
                suggest: { showWords: false },
                quickSuggestions: false,
              }}
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/3 flex-shrink-0 border-l border-[#262626] bg-[#0a0a0a] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-[#0d0d0d]">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </span>
              <button
                onClick={handleCopy}
                className={cn(
                  "p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800",
                  "transition-colors"
                )}
                title="Copy preview"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {finalContent || (
                  <span className="text-gray-500 italic">
                    Start typing to see preview...
                  </span>
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626] bg-[#111111]">
        <div className="text-xs text-gray-500">
          {content.length} characters •{" "}
          {Math.ceil(content.length / 4)} estimated tokens
        </div>
        <button
          onClick={() => {
            // Use with AI would go here
            if (onSave) {
              handleSave();
            }
            onClose?.();
          }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
            "text-white shadow-lg shadow-blue-500/25",
            "transition-all duration-200"
          )}
        >
          <SparklesIcon className="w-4 h-4" />
          Use with AI
        </button>
      </div>
    </div>
  );
}

export default Playground;
