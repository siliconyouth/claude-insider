"use client";

/**
 * Enhanced Variable Modal (Quick Mode)
 *
 * The smart, fast way to fill prompt variables. Features:
 * - Multiple input types (text, textarea, select, code)
 * - Dropdown suggestions with recent values
 * - Live preview panel showing final prompt
 * - Clipboard detection for code
 * - AI-powered suggestions (optional)
 * - Switch to other modes (Guided, Chat, Playground)
 *
 * @see docs/plans/INTERACTIVE_PROMPT_BUILDER.md
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";
import {
  XIcon,
  SparklesIcon,
  AlertCircleIcon,
  ClipboardIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  SettingsIcon,
  MessageSquareIcon,
  WandIcon,
  LayoutGridIcon,
  CheckIcon,
  HistoryIcon,
  LightbulbIcon,
  Loader2Icon,
  CopyIcon,
} from "lucide-react";
import {
  type EnhancedVariableModalProps,
  type BuilderValues,
  type VariableConfig,
  variableToConfig,
  formatVariableName,
  substituteVariables,
  validateVariable,
  shouldShowVariable,
} from "./types";

// Lazy load Monaco for code input
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] bg-[#1e1e1e] rounded-lg animate-pulse flex items-center justify-center">
      <Loader2Icon className="w-5 h-5 text-gray-500 animate-spin" />
    </div>
  ),
});

// ============================================================================
// Local Storage Keys
// ============================================================================
const RECENT_VALUES_KEY = "prompt-builder-recent-values";
const MAX_RECENT_VALUES = 5;

// ============================================================================
// Main Component
// ============================================================================

export function EnhancedVariableModal({
  promptId,
  promptTitle,
  promptContent,
  variables,
  variableConfigs: externalConfigs,
  onSubmit,
  onClose,
  onModeChange,
  initialValues = {},
}: EnhancedVariableModalProps) {
  // ============================================================================
  // State
  // ============================================================================

  // Merge external configs with inferred configs
  const variableConfigs = useMemo(() => {
    if (externalConfigs && externalConfigs.length > 0) {
      return externalConfigs;
    }
    return variables.map((v, i) => variableToConfig(v, i));
  }, [variables, externalConfigs]);

  // Initialize values with defaults
  const [values, setValues] = useState<BuilderValues>(() => {
    const initial: BuilderValues = {};
    for (const v of variables) {
      initial[v.name] = initialValues[v.name] || v.default_value || "";
    }
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [recentValues, setRecentValues] = useState<Record<string, string[]>>({});
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const [copiedPreview, setCopiedPreview] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  // Load recent values from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_VALUES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[promptId]) {
          setRecentValues(parsed[promptId]);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [promptId]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeDropdown) {
          setActiveDropdown(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, activeDropdown]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Check clipboard for code variables
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.length > 10 && text.length < 10000) {
          setClipboardContent(text);
        }
      } catch {
        // Clipboard access denied, ignore
      }
    };

    // Only check for variables that have detectFromClipboard enabled
    const hasClipboardVariable = variableConfigs.some(
      (c) => c.detectFromClipboard && c.inputType === "code"
    );

    if (hasClipboardVariable) {
      checkClipboard();
    }
  }, [variableConfigs]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const finalContent = useMemo(
    () => substituteVariables(promptContent, values),
    [promptContent, values]
  );

  const visibleConfigs = useMemo(
    () => variableConfigs.filter((c) => shouldShowVariable(c, values)),
    [variableConfigs, values]
  );

  const filledCount = useMemo(() => {
    return visibleConfigs.filter((c) => values[c.variableName]?.trim()).length;
  }, [visibleConfigs, values]);

  const _requiredCount = useMemo(() => {
    return visibleConfigs.filter((c) => c.isRequired).length;
  }, [visibleConfigs]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const saveRecentValue = useCallback(
    (name: string, value: string) => {
      if (!value.trim() || value.length > 500) return;

      try {
        const stored = localStorage.getItem(RECENT_VALUES_KEY);
        const all = stored ? JSON.parse(stored) : {};
        const promptRecent = all[promptId] || {};
        const varRecent = promptRecent[name] || [];

        // Add to front, remove duplicates, limit to MAX
        const updated = [value, ...varRecent.filter((v: string) => v !== value)].slice(
          0,
          MAX_RECENT_VALUES
        );

        all[promptId] = { ...promptRecent, [name]: updated };
        localStorage.setItem(RECENT_VALUES_KEY, JSON.stringify(all));
        setRecentValues((prev) => ({ ...prev, [name]: updated }));
      } catch {
        // Ignore localStorage errors
      }
    },
    [promptId]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all visible fields
      const newErrors: Record<string, string> = {};
      for (const config of visibleConfigs) {
        const error = validateVariable(values[config.variableName] || "", config);
        if (error) {
          newErrors[config.variableName] = error;
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Save recent values
      for (const [name, value] of Object.entries(values)) {
        saveRecentValue(name, value);
      }

      onSubmit(values, finalContent);
    },
    [values, visibleConfigs, finalContent, onSubmit, saveRecentValue]
  );

  const handlePasteFromClipboard = useCallback(
    async (variableName: string) => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleChange(variableName, text);
        }
      } catch {
        // Clipboard access denied
      }
    },
    [handleChange]
  );

  const handleUseClipboard = useCallback(
    (variableName: string) => {
      if (clipboardContent) {
        handleChange(variableName, clipboardContent);
      }
    },
    [clipboardContent, handleChange]
  );

  const fetchAiSuggestions = useCallback(
    async (variableName: string) => {
      setIsLoadingSuggestions(variableName);
      try {
        const response = await fetch("/api/prompts/builder/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptId,
            variableName,
            currentValues: values,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiSuggestions((prev) => ({
            ...prev,
            [variableName]: data.suggestions || [],
          }));
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoadingSuggestions(null);
      }
    },
    [promptId, values]
  );

  const handleCopyPreview = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(finalContent);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
    } catch {
      // Clipboard access denied
    }
  }, [finalContent]);

  // ============================================================================
  // Render Input
  // ============================================================================

  const renderInput = (config: VariableConfig, index: number) => {
    const value = values[config.variableName] || "";
    const error = errors[config.variableName];
    const recent = recentValues[config.variableName] || [];
    const suggestions = config.suggestions || [];
    const aiSugs = aiSuggestions[config.variableName] || [];
    const allSuggestions = [...new Set([...aiSugs, ...recent, ...suggestions])];
    const isDropdownOpen = activeDropdown === config.variableName;
    const isLoadingAi = isLoadingSuggestions === config.variableName;

    const inputId = `var-${config.variableName}`;
    const label = config.label || formatVariableName(config.variableName);

    const commonClasses = cn(
      "w-full rounded-lg transition-all duration-200",
      "bg-gray-50 dark:bg-[#0a0a0a]",
      "border",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
        : "border-gray-200 dark:border-[#262626] focus:border-blue-500 focus:ring-blue-500/30",
      "text-gray-900 dark:text-white",
      "placeholder-gray-400 dark:placeholder-gray-500",
      "focus:outline-none focus:ring-2"
    );

    return (
      <div key={config.variableName} className="relative">
        {/* Label */}
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {config.isRequired && <span className="text-red-500 ml-1">*</span>}
            {!config.isRequired && (
              <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">
                (optional)
              </span>
            )}
          </label>

          {/* AI Suggestions button */}
          {config.aiSuggestionEnabled && (
            <button
              type="button"
              onClick={() => fetchAiSuggestions(config.variableName)}
              disabled={isLoadingAi}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md",
                "text-violet-600 dark:text-violet-400",
                "hover:bg-violet-50 dark:hover:bg-violet-500/10",
                "transition-colors disabled:opacity-50"
              )}
            >
              {isLoadingAi ? (
                <Loader2Icon className="w-3 h-3 animate-spin" />
              ) : (
                <LightbulbIcon className="w-3 h-3" />
              )}
              AI Suggest
            </button>
          )}
        </div>

        {/* Help text */}
        {config.helpText && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            {config.helpText}
          </p>
        )}

        {/* Input based on type */}
        {config.inputType === "select" ? (
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActiveDropdown(isDropdownOpen ? null : config.variableName)
              }
              className={cn(
                commonClasses,
                "flex items-center justify-between px-4 py-2.5 text-left"
              )}
            >
              <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
                {value || config.placeholder || `Select ${label.toLowerCase()}`}
              </span>
              <ChevronDownIcon
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && allSuggestions.length > 0 && (
              <div
                className={cn(
                  "absolute z-20 mt-1 w-full py-1 rounded-lg shadow-lg",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#333]",
                  "max-h-60 overflow-y-auto"
                )}
              >
                {allSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      handleChange(config.variableName, suggestion);
                      setActiveDropdown(null);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm",
                      "hover:bg-gray-50 dark:hover:bg-[#262626]",
                      "flex items-center justify-between",
                      value === suggestion && "text-blue-600 dark:text-cyan-400"
                    )}
                  >
                    {suggestion}
                    {value === suggestion && (
                      <CheckIcon className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : config.inputType === "textarea" ? (
          <div className="relative">
            <textarea
              ref={index === 0 ? (firstInputRef as React.Ref<HTMLTextAreaElement>) : undefined}
              id={inputId}
              value={value}
              onChange={(e) => handleChange(config.variableName, e.target.value)}
              placeholder={config.placeholder || `Enter ${label.toLowerCase()}`}
              rows={4}
              className={cn(commonClasses, "px-4 py-2.5 resize-none")}
            />
            {config.detectFromClipboard && clipboardContent && !value && (
              <button
                type="button"
                onClick={() => handleUseClipboard(config.variableName)}
                className={cn(
                  "absolute right-2 bottom-2 inline-flex items-center gap-1.5 px-2 py-1",
                  "text-xs rounded-md",
                  "bg-blue-50 dark:bg-blue-500/10",
                  "text-blue-600 dark:text-blue-400",
                  "hover:bg-blue-100 dark:hover:bg-blue-500/20",
                  "transition-colors"
                )}
              >
                <ClipboardIcon className="w-3 h-3" />
                Paste from clipboard
              </button>
            )}
          </div>
        ) : config.inputType === "code" ? (
          <div className="relative">
            <MonacoEditor
              height={`${config.codeHeight || 200}px`}
              language={config.codeLanguage || "plaintext"}
              theme="vs-dark"
              value={value}
              onChange={(newValue) =>
                handleChange(config.variableName, newValue || "")
              }
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 8, bottom: 8 },
              }}
            />
            {config.detectFromClipboard && clipboardContent && !value && (
              <button
                type="button"
                onClick={() => handleUseClipboard(config.variableName)}
                className={cn(
                  "absolute right-2 top-2 inline-flex items-center gap-1.5 px-2 py-1 z-10",
                  "text-xs rounded-md",
                  "bg-blue-500/20 text-blue-300",
                  "hover:bg-blue-500/30",
                  "transition-colors"
                )}
              >
                <ClipboardIcon className="w-3 h-3" />
                Paste from clipboard
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              ref={index === 0 ? (firstInputRef as React.Ref<HTMLInputElement>) : undefined}
              id={inputId}
              type={config.inputType}
              value={value}
              onChange={(e) => handleChange(config.variableName, e.target.value)}
              onFocus={() => {
                if (allSuggestions.length > 0) {
                  setActiveDropdown(config.variableName);
                }
              }}
              placeholder={config.placeholder || `Enter ${label.toLowerCase()}`}
              className={cn(commonClasses, "px-4 py-2.5")}
            />

            {/* Recent values dropdown for text inputs */}
            {isDropdownOpen && allSuggestions.length > 0 && (
              <div
                className={cn(
                  "absolute z-20 mt-1 w-full py-1 rounded-lg shadow-lg",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#333]",
                  "max-h-48 overflow-y-auto"
                )}
              >
                {recent.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <HistoryIcon className="w-3 h-3" />
                    Recent
                  </div>
                )}
                {recent.map((suggestion, i) => (
                  <button
                    key={`recent-${i}`}
                    type="button"
                    onClick={() => {
                      handleChange(config.variableName, suggestion);
                      setActiveDropdown(null);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm truncate",
                      "hover:bg-gray-50 dark:hover:bg-[#262626]"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
                {suggestions.length > 0 && recent.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-[#333] my-1" />
                )}
                {suggestions.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <LightbulbIcon className="w-3 h-3" />
                    Suggestions
                  </div>
                )}
                {suggestions
                  .filter((s) => !recent.includes(s))
                  .map((suggestion, i) => (
                    <button
                      key={`sug-${i}`}
                      type="button"
                      onClick={() => {
                        handleChange(config.variableName, suggestion);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm",
                        "hover:bg-gray-50 dark:hover:bg-[#262626]"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}

            {/* Paste button for text inputs */}
            {!value && (
              <button
                type="button"
                onClick={() => handlePasteFromClipboard(config.variableName)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "p-1.5 rounded-md text-gray-400",
                  "hover:text-gray-600 dark:hover:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
                title="Paste from clipboard"
              >
                <ClipboardIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
            <AlertCircleIcon className="w-3 h-3" />
            {error}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={cn(
          "relative w-full",
          showPreview ? "max-w-4xl" : "max-w-lg",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl shadow-black/20",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden",
          "transition-all duration-300"
        )}
        style={{
          maxHeight: "90vh",
        }}
        onClick={() => setActiveDropdown(null)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                Quick Mode
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filledCount}/{visibleConfigs.length} filled
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {promptTitle}
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                showPreview && "text-blue-500 bg-blue-50 dark:bg-blue-500/10"
              )}
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? (
                <EyeIcon className="w-5 h-5" />
              ) : (
                <EyeOffIcon className="w-5 h-5" />
              )}
            </button>

            {/* Other modes dropdown */}
            {onModeChange && (
              <div className="relative group">
                <button
                  type="button"
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                    "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  title="Switch mode"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
                <div
                  className={cn(
                    "absolute right-0 mt-1 w-48 py-1 rounded-lg shadow-lg",
                    "bg-white dark:bg-[#1a1a1a]",
                    "border border-gray-200 dark:border-[#333]",
                    "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                    "transition-all duration-200"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onModeChange("guided")}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#262626] flex items-center gap-2"
                  >
                    <WandIcon className="w-4 h-4" />
                    Guided Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange("chat")}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#262626] flex items-center gap-2"
                  >
                    <MessageSquareIcon className="w-4 h-4" />
                    Chat Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange("playground")}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#262626] flex items-center gap-2"
                  >
                    <LayoutGridIcon className="w-4 h-4" />
                    Playground
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-colors"
              )}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn("flex", showPreview ? "flex-row" : "flex-col")}>
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={cn(showPreview ? "w-1/2 border-r border-gray-200 dark:border-[#262626]" : "w-full")}
          >
            <div
              className="px-6 py-4 space-y-5 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {visibleConfigs.length > 0 ? (
                visibleConfigs.map((config, index) => renderInput(config, index))
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 rounded-full bg-gradient-to-br from-violet-500/10 to-blue-500/10 w-fit mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Use
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    This prompt has no variables to fill in. Review the preview and click
                    &quot;Use with AI&quot; to send it directly.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
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
          </form>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Live Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md",
                    "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "transition-colors"
                  )}
                >
                  {copiedPreview ? (
                    <>
                      <CheckIcon className="w-3 h-3 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div
                className="flex-1 px-4 py-3 overflow-y-auto"
                style={{ maxHeight: "calc(90vh - 180px)" }}
              >
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {finalContent}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedVariableModal;
