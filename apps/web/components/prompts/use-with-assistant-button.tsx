"use client";

/**
 * Use With AI Assistant Button
 *
 * Opens the AI Assistant with the prompt pre-filled.
 * If the prompt has variables, shows a modal to fill them first.
 *
 * Features:
 * - One-click integration with AI Assistant
 * - Variable substitution modal
 * - Tracks usage analytics
 * - Works with saved and system prompts
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { SparklesIcon, PlayIcon, Loader2Icon } from "lucide-react";
import { openAIAssistant, type AIContext } from "@/components/unified-chat/unified-chat-provider";
import { VariableInputModal } from "./variable-input-modal";

interface PromptVariable {
  name: string;
  description?: string;
  default_value?: string;
  required?: boolean;
}

interface UseWithAssistantButtonProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables?: PromptVariable[];
  category?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function UseWithAssistantButton({
  promptId,
  promptTitle,
  promptContent,
  variables = [],
  category,
  className,
  variant = "primary",
  size = "md",
}: UseWithAssistantButtonProps) {
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Track usage
  const trackUsage = useCallback(async () => {
    try {
      setIsTracking(true);
      await fetch(`/api/prompts/${promptId}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: "assistant" }),
      });
    } catch {
      // Silent fail - don't block user experience
    } finally {
      setIsTracking(false);
    }
  }, [promptId]);

  // Substitute variables in content
  const substituteVariables = useCallback(
    (values: Record<string, string>): string => {
      let content = promptContent;
      for (const [name, value] of Object.entries(values)) {
        content = content.replace(
          new RegExp(`\\{\\{${name}\\}\\}`, "g"),
          value
        );
      }
      return content;
    },
    [promptContent]
  );

  // Open AI Assistant with filled content
  const openWithContent = useCallback(
    async (filledContent: string) => {
      // Track usage
      await trackUsage();

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
          text: filledContent,
          metadata: {
            promptId,
            category: category || "",
          },
        },
      };

      // Open AI Assistant
      openAIAssistant({
        context,
        question: filledContent,
      });
    },
    [promptId, promptTitle, category, trackUsage]
  );

  // Handle button click
  const handleClick = useCallback(() => {
    const hasUnfilledVariables =
      variables.length > 0 &&
      variables.some((v) => {
        // Check if variable exists in content
        const regex = new RegExp(`\\{\\{${v.name}\\}\\}`, "g");
        return regex.test(promptContent);
      });

    if (hasUnfilledVariables) {
      // Show modal to fill variables
      setShowVariableModal(true);
    } else {
      // Open directly
      openWithContent(promptContent);
    }
  }, [variables, promptContent, openWithContent]);

  // Handle modal submit
  const handleVariableSubmit = useCallback(
    (values: Record<string, string>) => {
      const filledContent = substituteVariables(values);
      openWithContent(filledContent);
      setShowVariableModal(false);
    },
    [substituteVariables, openWithContent]
  );

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

      {showVariableModal && (
        <VariableInputModal
          promptTitle={promptTitle}
          variables={variables}
          onSubmit={handleVariableSubmit}
          onClose={() => setShowVariableModal(false)}
        />
      )}
    </>
  );
}

export default UseWithAssistantButton;
