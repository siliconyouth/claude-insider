"use client";

/**
 * Use With AI Assistant Button
 *
 * Opens the Interactive Prompt Builder with multiple modes:
 * - Quick Mode: Enhanced form with suggestions and recent values
 * - Guided Mode: Step-by-step wizard for complex prompts
 * - Chat Mode: AI-powered conversational builder
 * - Playground Mode: Full Monaco editor environment
 *
 * Features:
 * - Mode selector (or remembers preference)
 * - One-click integration with AI Assistant
 * - Variable substitution with smart suggestions
 * - Tracks usage analytics
 * - Works with saved and system prompts
 *
 * @see docs/plans/INTERACTIVE_PROMPT_BUILDER.md
 */

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";
import { SparklesIcon, PlayIcon, Loader2Icon } from "lucide-react";
import { openAIAssistant, type AIContext } from "@/components/unified-chat/unified-chat-provider";
import { type PromptVariable, type VariableConfig, type BuilderMode } from "./builder/types";

/**
 * Auto-detect {{variable}} patterns from prompt content
 * Extracts variable names and creates PromptVariable objects
 */
function extractVariablesFromContent(content: string): PromptVariable[] {
  const varRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const foundNames = new Set<string>();
  let result;

  while ((result = varRegex.exec(content)) !== null) {
    const varName = result[1];
    if (varName) {
      foundNames.add(varName);
    }
  }

  return Array.from(foundNames).map((name) => ({
    name,
    description: formatVariableName(name),
    required: true,
  }));
}

/**
 * Convert snake_case or camelCase to human-readable name
 */
function formatVariableName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Lazy load the builder to keep initial bundle small
const InteractivePromptBuilder = dynamic(
  () => import("./builder/interactive-prompt-builder").then((mod) => {
    console.log("[UseWithAssistantButton] InteractivePromptBuilder loaded successfully");
    return mod.InteractivePromptBuilder;
  }).catch((err) => {
    console.error("[UseWithAssistantButton] Failed to load InteractivePromptBuilder:", err);
    throw err;
  }),
  {
    ssr: false,
    loading: () => {
      console.log("[UseWithAssistantButton] Loading InteractivePromptBuilder...");
      return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="text-white">Loading builder...</div>
      </div>;
    },
  }
);

interface UseWithAssistantButtonProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables?: PromptVariable[];
  variableConfigs?: VariableConfig[];
  category?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Skip mode selector and use this mode directly */
  initialMode?: BuilderMode;
  /** Skip mode selector entirely (use for simple prompts) */
  skipModeSelector?: boolean;
}

export function UseWithAssistantButton({
  promptId,
  promptTitle,
  promptContent,
  variables = [],
  variableConfigs,
  category,
  className,
  variant = "primary",
  size = "md",
  initialMode,
  skipModeSelector,
}: UseWithAssistantButtonProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Auto-detect variables from content if none provided
  // This ensures the builder shows even when DB variables are empty
  const effectiveVariables = useMemo(() => {
    if (variables.length > 0) {
      return variables;
    }
    // Auto-detect {{variable}} patterns from prompt content
    return extractVariablesFromContent(promptContent);
  }, [variables, promptContent]);

  // Track usage with enhanced analytics
  const trackUsage = useCallback(async (builderMode: string = "direct") => {
    try {
      setIsTracking(true);

      // Gather device/browser info for analytics (non-PII)
      const deviceInfo = {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: window.innerWidth < 768,
        isTouch: 'ontouchstart' in window,
        referrer: document.referrer ? new URL(document.referrer).pathname : null,
      };

      await fetch(`/api/prompts/${promptId}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "assistant",
          builderMode,
          deviceInfo,
          promptCategory: category,
        }),
      });
    } catch {
      // Silent fail - don't block user experience
    } finally {
      setIsTracking(false);
    }
  }, [promptId, category]);

  // Handle button click
  const handleClick = useCallback(() => {
    // Use effectiveVariables which includes auto-detected ones
    const hasVariables = effectiveVariables.length > 0;

    // DEBUG: Log click event
    console.log("[UseWithAssistantButton] Click:", {
      hasVariables,
      effectiveVariablesCount: effectiveVariables.length,
      skipModeSelector,
      initialMode,
    });

    if (hasVariables) {
      // Show Interactive Prompt Builder with mode selector
      console.log("[UseWithAssistantButton] Setting showBuilder to true");
      setShowBuilder(true);
    } else {
      // No variables - open directly with AI Assistant
      console.log("[UseWithAssistantButton] No variables, using directly");
      handleDirectUse();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleDirectUse has circular dependency
  }, [effectiveVariables, skipModeSelector, initialMode]);

  // Direct use without variables
  const handleDirectUse = useCallback(async () => {
    // Track usage with "direct" mode
    await trackUsage("direct");

    // Build AI context
    const context: AIContext = {
      page: {
        path: `/prompts/${promptId}`,
        title: promptTitle,
        category: category || "prompts",
        section: "Prompt Library",
      },
      content: {
        type: "prompt",
        title: promptTitle,
        text: promptContent,
        metadata: {
          promptId,
          category: category || "",
          builderMode: "direct",
        },
      },
    };

    // Open AI Assistant
    openAIAssistant({
      context,
      question: promptContent,
    });
  }, [promptId, promptTitle, promptContent, category, trackUsage]);

  // Handle builder close
  const handleClose = useCallback(() => {
    setShowBuilder(false);
  }, []);

  // Button styles based on variant
  const variantStyles = {
    primary: cn(
      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
      "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
      "text-white shadow-lg shadow-blue-500/25",
      "border-0"
    ),
    secondary: cn(
      "bg-white dark:bg-[#111111]",
      "border border-gray-200 dark:border-[#262626]",
      "hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
      "text-gray-700 dark:text-gray-200"
    ),
    ghost: cn(
      "bg-transparent",
      "hover:bg-gray-100 dark:hover:bg-gray-800",
      "text-gray-600 dark:text-gray-400"
    ),
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isTracking}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        {isTracking ? (
          <Loader2Icon className="w-4 h-4 animate-spin" />
        ) : variant === "primary" ? (
          <SparklesIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4" />
        )}
        Use with AI
      </button>

      {showBuilder && (
        <InteractivePromptBuilder
          promptId={promptId}
          promptTitle={promptTitle}
          promptContent={promptContent}
          variables={effectiveVariables}
          variableConfigs={variableConfigs}
          category={category}
          onClose={handleClose}
          skipModeSelector={skipModeSelector}
          initialMode={initialMode}
        />
      )}
    </>
  );
}

export default UseWithAssistantButton;
