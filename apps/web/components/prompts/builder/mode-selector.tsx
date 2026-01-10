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
 */

import { useState, useCallback, useEffect } from "react";
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
}

export function ModeSelector({
  promptTitle,
  variableCount,
  onSelectMode,
  onClose,
}: ModeSelectorProps) {
  const [rememberChoice, setRememberChoice] = useState(false);
  const [preferences, setPreferences] = useState<Partial<BuilderPreferences>>({});

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

  // Determine recommended mode based on variable count
  const recommendedMode: BuilderMode =
    variableCount <= 2 ? "quick" : variableCount <= 4 ? "guided" : "chat";

  const modes: ModeOption[] = [
    {
      mode: "quick",
      icon: <ZapIcon className="w-6 h-6" />,
      title: "Quick Mode",
      description: "Fill in the blanks with smart suggestions and live preview",
      bestFor: "Simple prompts, repeat use",
      isRecommended: recommendedMode === "quick",
      badge: variableCount <= 2 ? "Fastest" : undefined,
    },
    {
      mode: "guided",
      icon: <WandIcon className="w-6 h-6" />,
      title: "Guided Mode",
      description: "Step-by-step wizard that walks you through each variable",
      bestFor: "Complex prompts, first time users",
      isRecommended: recommendedMode === "guided",
    },
    {
      mode: "chat",
      icon: <MessageSquareIcon className="w-6 h-6" />,
      title: "Chat Mode",
      description: "AI assistant helps you build the perfect prompt conversationally",
      bestFor: "Exploration, customization, complex needs",
      isRecommended: recommendedMode === "chat",
      badge: "AI Powered",
    },
    {
      mode: "playground",
      icon: <LayoutGridIcon className="w-6 h-6" />,
      title: "Playground",
      description: "Full editor with variable sidebar, preview, and version history",
      bestFor: "Power users, forking, advanced editing",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "relative w-full max-w-2xl",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl shadow-black/20",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                How do you want to build this prompt?
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {promptTitle} • {variableCount} variable{variableCount !== 1 ? "s" : ""}
            </p>
          </div>
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

        {/* Mode Options */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map((option) => (
            <button
              key={option.mode}
              onClick={() => handleSelect(option.mode)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl text-left",
                "border-2 transition-all duration-200",
                option.isRecommended
                  ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/5"
                  : "border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#333]",
                "hover:shadow-lg hover:-translate-y-0.5",
                "group"
              )}
            >
              {/* Badges */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {option.isRecommended && (
                  <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30">
                    Recommended
                  </span>
                )}
                {option.badge && !option.isRecommended && (
                  <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {option.badge}
                  </span>
                )}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "p-2.5 rounded-lg mb-3",
                  option.isRecommended
                    ? "bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-blue-600 dark:text-cyan-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400"
                )}
              >
                {option.icon}
              </div>

              {/* Content */}
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {option.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {option.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Best for: {option.bestFor}
              </p>

              {/* Arrow indicator */}
              <ChevronRightIcon
                className={cn(
                  "absolute bottom-4 right-4 w-5 h-5",
                  "text-gray-300 dark:text-gray-600",
                  "group-hover:text-blue-500 dark:group-hover:text-cyan-400",
                  "group-hover:translate-x-1 transition-all"
                )}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className={cn(
                "w-4 h-4 rounded",
                "border-gray-300 dark:border-gray-600",
                "text-blue-600 focus:ring-blue-500"
              )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Remember my choice
            </span>
          </label>

          <button
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
        </div>
      </div>
    </div>
  );
}

export default ModeSelector;
