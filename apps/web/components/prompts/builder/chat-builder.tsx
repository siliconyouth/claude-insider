"use client";

/**
 * Chat Builder Mode
 *
 * AI-powered conversational interface for building prompts.
 * Claude asks questions and guides users through filling variables naturally.
 *
 * Features:
 * - Natural language conversation
 * - Quick reply options
 * - Context-aware follow-ups
 * - Paste code detection
 * - Undo capability
 * - Progress tracking
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/design-system";
import {
  XIcon,
  SendIcon,
  Loader2Icon,
  SparklesIcon,
  RotateCcwIcon,
  BotIcon,
  UserIcon,
} from "lucide-react";
import {
  type ChatBuilderProps,
  type BuilderValues,
  type ChatMessage,
  type ChatOption,
  variableToConfig,
  formatVariableName,
  substituteVariables,
} from "./types";

// ============================================================================
// Generate unique ID
// ============================================================================
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatBuilder({
  promptId: _promptId,
  promptTitle,
  promptContent,
  variables,
  variableConfigs: externalConfigs,
  onComplete,
  onClose,
}: ChatBuilderProps) {
  // ============================================================================
  // State
  // ============================================================================

  const variableConfigs = useMemo(() => {
    if (externalConfigs && externalConfigs.length > 0) {
      return externalConfigs;
    }
    return variables.map((v, i) => variableToConfig(v, i));
  }, [variables, externalConfigs]);

  const [values, setValues] = useState<BuilderValues>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentVariableIndex, setCurrentVariableIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Computed
  // ============================================================================

  const currentVariable = variableConfigs[currentVariableIndex];
  const _remainingVariables = variableConfigs.slice(currentVariableIndex);
  const filledCount = Object.keys(values).filter((k) => values[k]?.trim()).length;

  const finalContent = useMemo(
    () => substituteVariables(promptContent, values),
    [promptContent, values]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      startConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // AI Conversation Logic
  // ============================================================================

  const startConversation = useCallback(async () => {
    const variableList = variableConfigs.map((c) => c.label || formatVariableName(c.variableName)).join(", ");

    const introMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: `Hi! I'll help you build "${promptTitle}".\n\nI need to collect ${variableConfigs.length} piece${variableConfigs.length > 1 ? "s" : ""} of information: ${variableList}.\n\nLet's start!`,
      timestamp: new Date(),
    };

    setMessages([introMessage]);

    // After a short delay, ask the first question
    setTimeout(() => {
      askForVariable(0);
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptTitle, variableConfigs]);

  const askForVariable = useCallback(
    async (index: number) => {
      const config = variableConfigs[index];
      if (!config) {
        // All variables collected, show summary
        showSummary();
        return;
      }

      setIsLoading(true);

      // Build question based on variable config
      const label = config.label || formatVariableName(config.variableName);
      let question = `What's the ${label.toLowerCase()}?`;

      if (config.helpText) {
        question += `\n\n💡 ${config.helpText}`;
      }

      // Build options if available
      let options: ChatOption[] | undefined;
      if (config.suggestions && config.suggestions.length > 0) {
        options = config.suggestions.slice(0, 4).map((s) => ({
          label: s,
          value: s,
        }));
      }

      // Simulate AI thinking delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const questionMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: question,
        timestamp: new Date(),
        options,
      };

      setMessages((prev) => [...prev, questionMessage]);
      setCurrentVariableIndex(index);
      setIsLoading(false);

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variableConfigs]
  );

  const handleUserMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !currentVariable) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message,
        timestamp: new Date(),
        variableCollected: currentVariable.variableName,
        valueCollected: message,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      // Store value
      setValues((prev) => ({
        ...prev,
        [currentVariable.variableName]: message,
      }));

      // Add acknowledgment
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const ackMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: getAcknowledgment(currentVariable.variableName, message),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, ackMessage]);
      setIsLoading(false);

      // Move to next variable
      const nextIndex = currentVariableIndex + 1;
      if (nextIndex < variableConfigs.length) {
        setTimeout(() => askForVariable(nextIndex), 600);
      } else {
        setTimeout(() => showSummary(), 600);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentVariable, currentVariableIndex, variableConfigs, askForVariable]
  );

  const getAcknowledgment = (_variableName: string, _value: string): string => {
    const responses = [
      "Got it! ✓",
      "Perfect, noted. ✓",
      "Great, thanks! ✓",
      "Excellent choice! ✓",
      "That works! ✓",
    ];
    const remainingCount = variableConfigs.length - currentVariableIndex - 1;
    const ack = responses[Math.floor(Math.random() * responses.length)];

    if (remainingCount > 0) {
      return `${ack}\n\n${remainingCount} more to go...`;
    }
    return `${ack}\n\nThat's everything I needed!`;
  };

  // Build summary message from provided values (avoids stale closure)
  const buildSummaryMessageFromValues = useCallback((currentValues: BuilderValues): string => {
    let summary = "🎉 Your prompt is ready!\n\n**Summary:**\n";

    for (const config of variableConfigs) {
      const label = config.label || formatVariableName(config.variableName);
      const value = currentValues[config.variableName];
      const displayValue = value
        ? value.length > 50
          ? value.substring(0, 50) + "..."
          : value
        : "(not provided)";
      summary += `• **${label}:** ${displayValue}\n`;
    }

    summary += "\nClick **Use with AI** to start your conversation, or go back to make changes.";
    return summary;
  }, [variableConfigs]);

  const showSummary = useCallback(() => {
    setIsLoading(true);

    setTimeout(() => {
      // Build summary using current values state via setState callback
      // to avoid stale closure issues
      setValues((currentValues) => {
        const summary = buildSummaryMessageFromValues(currentValues);

        const summaryMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: summary,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, summaryMessage]);
        setIsComplete(true);
        setIsLoading(false);

        return currentValues; // Don't modify values, just read them
      });
    }, 500);
  }, [buildSummaryMessageFromValues]);

  const handleOptionClick = useCallback(
    (option: ChatOption) => {
      handleUserMessage(option.value);
    },
    [handleUserMessage]
  );

  const handleUndo = useCallback(() => {
    if (currentVariableIndex === 0 && messages.length <= 2) return;

    // Find the last variable that was filled
    const newIndex = Math.max(0, currentVariableIndex - 1);
    const prevConfig = variableConfigs[newIndex];

    if (prevConfig) {
      // Remove the value
      setValues((prev) => {
        const next = { ...prev };
        delete next[prevConfig.variableName];
        return next;
      });

      // Remove last few messages (ack + user + question)
      setMessages((prev) => prev.slice(0, -3));

      // Re-ask the question
      setIsComplete(false);
      setTimeout(() => askForVariable(newIndex), 300);
    }
  }, [currentVariableIndex, variableConfigs, messages.length, askForVariable]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        handleUserMessage(inputValue.trim());
      }
    },
    [inputValue, handleUserMessage]
  );

  const handleComplete = useCallback(() => {
    onComplete(values, finalContent);
  }, [values, finalContent, onComplete]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "relative w-full max-w-2xl h-[80vh] max-h-[700px]",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl shadow-black/20",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                Chat Mode
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filledCount}/{variableConfigs.length}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {promptTitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 2 && !isComplete && (
              <button
                onClick={handleUndo}
                className={cn(
                  "p-2 rounded-lg",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
                title="Undo last answer"
              >
                <RotateCcwIcon className="w-5 h-5" />
              </button>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-violet-500 to-blue-500"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                {message.role === "assistant" ? (
                  <BotIcon className="w-4 h-4 text-white" />
                ) : (
                  <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 max-w-[80%]",
                  message.role === "user" && "text-right"
                )}
              >
                <div
                  className={cn(
                    "inline-block px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap",
                    message.role === "assistant"
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none"
                      : "bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-tr-none"
                  )}
                >
                  {message.content}
                </div>

                {/* Quick options */}
                {message.options && message.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(option)}
                        disabled={isLoading || currentVariableIndex !== variableConfigs.findIndex((c) => c.suggestions?.includes(option.value))}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-full",
                          "bg-white dark:bg-gray-800",
                          "border border-gray-200 dark:border-gray-600",
                          "text-gray-700 dark:text-gray-300",
                          "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400",
                          "transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <BotIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input / Complete */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
          {isComplete ? (
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={handleUndo}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "text-gray-600 dark:text-gray-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
              >
                <RotateCcwIcon className="w-4 h-4" />
                Go Back
              </button>
              <button
                onClick={handleComplete}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
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
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-6 py-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  currentVariable
                    ? `Enter ${(currentVariable.label || formatVariableName(currentVariable.variableName)).toLowerCase()}...`
                    : "Type your message..."
                }
                disabled={isLoading}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#333]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                  "disabled:opacity-50"
                )}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-gradient-to-r from-violet-600 to-blue-600",
                  "text-white",
                  "hover:from-violet-500 hover:to-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200"
                )}
              >
                {isLoading ? (
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
              </button>
            </form>
          )}
        </div>

        {/* Progress indicator */}
        {!isComplete && (
          <div className="absolute bottom-[72px] left-0 right-0 px-6">
            <div className="flex gap-1">
              {variableConfigs.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i < currentVariableIndex
                      ? "bg-blue-500"
                      : i === currentVariableIndex
                      ? "bg-gradient-to-r from-violet-500 to-blue-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatBuilder;
