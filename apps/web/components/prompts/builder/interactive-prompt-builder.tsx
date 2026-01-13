"use client";

/**
 * Interactive Prompt Builder
 *
 * Main orchestrator component that manages the builder flow:
 * 1. Shows Mode Selector (unless user has preference)
 * 2. Renders the selected mode component
 * 3. Handles completion and AI Assistant integration
 *
 * @see docs/plans/INTERACTIVE_PROMPT_BUILDER.md
 */

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { openAIAssistant, type AIContext } from "@/components/unified-chat/unified-chat-provider";
import { type BuilderMode, type BuilderValues, type PromptVariable, type VariableConfig } from "./types";
import { ModeSelector } from "./mode-selector";
import { EnhancedVariableModal } from "./enhanced-variable-modal";

// Lazy load heavier modes
const GuidedWizard = dynamic(() => import("./guided-wizard"), {
  ssr: false,
  loading: () => null,
});

const ChatBuilder = dynamic(() => import("./chat-builder"), {
  ssr: false,
  loading: () => null,
});

const Playground = dynamic(() => import("./playground"), {
  ssr: false,
  loading: () => null,
});

interface InteractivePromptBuilderProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables: PromptVariable[];
  variableConfigs?: VariableConfig[];
  category?: string;
  onClose: () => void;
  skipModeSelector?: boolean;
  initialMode?: BuilderMode;
}

export function InteractivePromptBuilder({
  promptId,
  promptTitle,
  promptContent,
  variables,
  variableConfigs,
  category,
  onClose,
  skipModeSelector = false,
  initialMode,
}: InteractivePromptBuilderProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [selectedMode, setSelectedMode] = useState<BuilderMode | null>(initialMode || null);
  const [showModeSelector, setShowModeSelector] = useState(!skipModeSelector && !initialMode);

  const [isTracking, setIsTracking] = useState(false);

  // ============================================================================
  // Effects
  // ============================================================================

  // NOTE: We intentionally do NOT auto-skip the mode selector based on saved
  // preferences. The mode selector should always be shown so users can choose
  // their mode each time. The saved preference is used by mode-selector.tsx
  // to pre-highlight the saved mode, but never to auto-skip.
  // See commit dabe787 for context on this design decision.

  // ============================================================================
  // Handlers
  // ============================================================================

  const trackUsage = useCallback(async (mode: BuilderMode) => {
    if (isTracking) return;

    setIsTracking(true);
    try {
      await fetch(`/api/prompts/${promptId}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: `builder_${mode}` }),
      });
    } catch {
      // Silent fail
    } finally {
      setIsTracking(false);
    }
  }, [promptId, isTracking]);

  const handleModeSelect = useCallback(async (mode: BuilderMode) => {
    // Handle "direct" mode - immediately send to AI Assistant
    if (mode === "direct") {
      // Track usage
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

      // Open AI Assistant and auto-send
      openAIAssistant({
        context,
        question: promptContent,
        autoSend: true,
      });

      // Close builder
      onClose();
      return;
    }

    setSelectedMode(mode);
    setShowModeSelector(false);
  }, [promptId, promptTitle, promptContent, category, trackUsage, onClose]);

  const handleModeChange = useCallback((mode: BuilderMode) => {
    setSelectedMode(mode);
  }, []);

  const handleComplete = useCallback(
    async (values: BuilderValues, finalContent: string) => {
      // Track usage
      if (selectedMode) {
        await trackUsage(selectedMode);
      }

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
          text: finalContent,
          metadata: {
            promptId,
            category: category || "",
            builderMode: selectedMode || "quick",
            variablesFilled: Object.keys(values).join(", "),
          },
        },
      };

      // Open AI Assistant
      openAIAssistant({
        context,
        question: finalContent,
      });

      // Close builder
      onClose();
    },
    [promptId, promptTitle, category, selectedMode, trackUsage, onClose]
  );

  // ============================================================================
  // Render
  // ============================================================================

  // Show mode selector
  if (showModeSelector) {
    return (
      <ModeSelector
        promptTitle={promptTitle}
        variableCount={variables.length}
        onSelectMode={handleModeSelect}
        onClose={onClose}
      />
    );
  }

  // Render selected mode
  switch (selectedMode) {
    case "quick":
      return (
        <EnhancedVariableModal
          promptId={promptId}
          promptTitle={promptTitle}
          promptContent={promptContent}
          variables={variables}
          variableConfigs={variableConfigs}
          onSubmit={handleComplete}
          onClose={onClose}
          onModeChange={handleModeChange}
        />
      );

    case "guided":
      return (
        <GuidedWizard
          promptId={promptId}
          promptTitle={promptTitle}
          promptContent={promptContent}
          variables={variables}
          variableConfigs={variableConfigs}
          onComplete={handleComplete}
          onClose={onClose}
        />
      );

    case "chat":
      return (
        <ChatBuilder
          promptId={promptId}
          promptTitle={promptTitle}
          promptContent={promptContent}
          variables={variables}
          variableConfigs={variableConfigs}
          onComplete={handleComplete}
          onClose={onClose}
        />
      );

    case "playground":
      return (
        <Playground
          promptId={promptId}
          promptTitle={promptTitle}
          promptContent={promptContent}
          variables={variables}
          variableConfigs={variableConfigs}
          onClose={onClose}
        />
      );

    default: {
      // Default to Quick Mode for simple prompts, Guided for complex
      const defaultMode: BuilderMode = variables.length <= 2 ? "quick" : "guided";
      setSelectedMode(defaultMode);
      return null;
    }
  }
}

export default InteractivePromptBuilder;
