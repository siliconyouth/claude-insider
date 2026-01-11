"use client";

/**
 * Builder Mode Selector
 *
 * The entry point for the Interactive Prompt Builder.
 * Presents users with 4 modes:
 *
 * 1. Quick Mode - Enhanced form with suggestions
 * 2. Guided Mode - Step-by-step wizard
 * 3. Chat Mode - AI-powered conversation
 * 4. Playground - Full editor with preview
 *
 * Smart defaults based on prompt complexity:
 * - Simple prompts (0-2 vars) → Quick Mode
 * - Complex prompts (3+ vars) → Guided Mode recommended
 *
 * Keyboard shortcuts:
 * - 1/2/3/4: Select mode directly
 * - Escape: Close modal
 * - Enter: Select focused/recommended mode
 * - Arrow keys: Navigate between modes
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/design-system";
import {
  XIcon,
  ZapIcon,
  WandIcon,
  MessageSquareIcon,
  LayoutGridIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "lucide-react";
import { type BuilderMode, type BuilderPreferences } from "./types";

// ============================================================================
// Local Storage
// ============================================================================
const PREFERENCES_KEY = "prompt-builder-preferences";

interface ModeSelectorProps {
  promptTitle: string;
  variableCount: number;
  onSelectMode: (mode: BuilderMode) => void;
  onClose: () => void;
}

interface ModeOption {
  mode: BuilderMode;
  icon: React.ReactNode;
  title: string;
  description: string;
  bestFor: string;
  isRecommended?: boolean;
  badge?: string;
  shortcut: string;
}

export function ModeSelector({
  promptTitle,
  variableCount,
  onSelectMode,
  onClose,
}: ModeSelectorProps) {
  // Default to ON for better UX - most users want their choice remembered
  const [rememberChoice, setRememberChoice] = useState(true);
  const [preferences, setPreferences] = useState<Partial<BuilderPreferences>>({});
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trigger entrance animation
  useEffect(() => {
    // Small delay to ensure CSS transition triggers
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Load preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);

        // If user has a remembered preference, auto-select
        if (parsed.rememberMode && parsed.defaultMode) {
          onSelectMode(parsed.defaultMode);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [onSelectMode]);

  // Determine recommended mode based on variable count
  const recommendedMode: BuilderMode =
    variableCount <= 2 ? "quick" : variableCount <= 4 ? "guided" : "chat";

  const modes: ModeOption[] = useMemo(() => [
    {
      mode: "quick",
      icon: <ZapIcon className="w-8 h-8" />,
      title: "Quick Mode",
      description: "Fill in the blanks with smart suggestions and live preview",
      bestFor: "Simple prompts, repeat use",
      isRecommended: recommendedMode === "quick",
      badge: recommendedMode === "quick" ? "Recommended" : undefined,
      shortcut: "1",
    },
    {
      mode: "guided",
      icon: <WandIcon className="w-8 h-8" />,
      title: "Guided Mode",
      description: "Step-by-step wizard that walks you through each variable",
      bestFor: "Complex prompts, first time users",
      isRecommended: recommendedMode === "guided",
      badge: recommendedMode === "guided" ? "Recommended" : undefined,
      shortcut: "2",
    },
    {
      mode: "chat",
      icon: <MessageSquareIcon className="w-8 h-8" />,
      title: "Chat Mode",
      description: "AI assistant helps you build the perfect prompt conversationally",
      bestFor: "Exploration, customization, complex needs",
      isRecommended: recommendedMode === "chat",
      badge: recommendedMode === "chat" ? "Recommended" : "AI Powered",
      shortcut: "3",
    },
    {
      mode: "playground",
      icon: <LayoutGridIcon className="w-8 h-8" />,
      title: "Playground",
      description: "Full editor with variable sidebar, preview, and version history",
      bestFor: "Power users, forking, advanced editing",
      shortcut: "4",
    },
  ], [recommendedMode]);

  const handleSelect = useCallback(
    (mode: BuilderMode) => {
      // Save preference if remember is checked
      if (rememberChoice) {
        try {
          const updated = { ...preferences, defaultMode: mode, rememberMode: true };
          localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }
      }

      onSelectMode(mode);
    },
    [rememberChoice, preferences, onSelectMode]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "1":
          e.preventDefault();
          handleSelect("quick");
          break;
        case "2":
          e.preventDefault();
          handleSelect("guided");
          break;
        case "3":
          e.preventDefault();
          handleSelect("chat");
          break;
        case "4":
          e.preventDefault();
          handleSelect("playground");
          break;
        case "Enter": {
          e.preventDefault();
          const focusedMode = modes[focusedIndex];
          if (focusedIndex >= 0 && focusedMode) {
            handleSelect(focusedMode.mode);
          } else {
            // Select recommended mode
            handleSelect(recommendedMode);
          }
          break;
        }
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % modes.length);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + modes.length) % modes.length);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleSelect, focusedIndex, modes, recommendedMode]);

  // Focus management for arrow key navigation
  useEffect(() => {
    if (focusedIndex >= 0) {
      const buttons = modalRef.current?.querySelectorAll("[data-mode-button]");
      if (buttons && buttons[focusedIndex]) {
        (buttons[focusedIndex] as HTMLButtonElement).focus();
      }
    }
  }, [focusedIndex]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/50 backdrop-blur-sm",
        // Entrance animation for backdrop
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-2xl",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl shadow-black/20",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden",
          // Entrance animation for modal
          "transition-all duration-300 ease-out",
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-[#262626]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                <SparklesIcon className="w-6 h-6 text-violet-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Choose Your Builder Mode
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 ml-12">
              {promptTitle} • {variableCount} variable{variableCount !== 1 ? "s" : ""} to fill
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2.5 rounded-xl",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            title="Close (Esc)"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Options */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map((option, index) => (
            <button
              key={option.mode}
              data-mode-button
              onClick={() => handleSelect(option.mode)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={cn(
                "relative flex flex-col items-start p-5 rounded-xl text-left",
                "border-2 transition-all duration-200",
                // Staggered entrance animation
                "animate-in fade-in slide-in-from-bottom-2",
                option.isRecommended
                  ? "border-blue-500/50 bg-gradient-to-br from-blue-50/80 to-violet-50/50 dark:from-blue-500/10 dark:to-violet-500/5"
                  : "border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#404040]",
                "hover:shadow-xl hover:-translate-y-1",
                focusedIndex === index && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#111111]",
                "group",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              style={{
                animationDelay: `${index * 75}ms`,
                animationFillMode: "backwards",
              }}
            >
              {/* Badges */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {option.badge && (
                  <span
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full",
                      option.isRecommended
                        ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {option.badge}
                  </span>
                )}
              </div>

              {/* Keyboard shortcut badge */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1">
                <kbd
                  className={cn(
                    "px-2 py-0.5 text-xs font-mono rounded",
                    "bg-gray-100 dark:bg-gray-800",
                    "text-gray-500 dark:text-gray-500",
                    "border border-gray-200 dark:border-gray-700",
                    "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30",
                    "group-hover:text-blue-600 dark:group-hover:text-cyan-400",
                    "group-hover:border-blue-300 dark:group-hover:border-blue-700",
                    "transition-colors"
                  )}
                >
                  {option.shortcut}
                </kbd>
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "p-3 rounded-xl mb-4",
                  option.isRecommended
                    ? "bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gradient-to-br group-hover:from-violet-500/20 group-hover:to-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-cyan-400",
                  "transition-all duration-200"
                )}
              >
                {option.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                {option.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                {option.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                <span className="font-medium">Best for:</span> {option.bestFor}
              </p>

              {/* Arrow indicator */}
              <ChevronRightIcon
                className={cn(
                  "absolute bottom-4 right-12 w-5 h-5",
                  "text-gray-300 dark:text-gray-600",
                  "group-hover:text-blue-500 dark:group-hover:text-cyan-400",
                  "group-hover:translate-x-1 transition-all duration-200"
                )}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50/80 dark:bg-[#0a0a0a]">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className={cn(
                "w-4 h-4 rounded",
                "border-gray-300 dark:border-gray-600",
                "text-blue-600 focus:ring-blue-500",
                "cursor-pointer"
              )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              Remember my choice
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-600 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px]">1-4</kbd> to select • <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px]">Esc</kbd> to close
            </span>
            <button
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "text-gray-600 dark:text-gray-400",
                "hover:bg-gray-200 dark:hover:bg-gray-800",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeSelector;
