"use client";

/**
 * Ask AI Modal Component
 *
 * Modal interface for asking the AI assistant questions with context.
 * Supports conversation history for authenticated users.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useAskAI } from "./ask-ai-provider";
import { useAuth } from "@/components/providers/auth-provider";
import type { AIConversation } from "@/app/actions/ai-conversations";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AskAIModal() {
  const {
    isOpen,
    close,
    currentContext,
    currentQuestion,
    suggestedQuestions,
    // Conversation history
    currentConversationId,
    setCurrentConversationId,
    conversations,
    loadConversations,
    loadConversation,
    showHistory,
    setShowHistory,
  } = useAskAI();

  const { isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset when modal opens with new context
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput("");
    }
  }, [isOpen, currentContext]);

  // Save message to conversation if authenticated
  const saveMessage = useCallback(async (
    convId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    if (!isAuthenticated) return;
    try {
      const { addMessage } = await import("@/app/actions/ai-conversations");
      await addMessage(convId, role, content);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  }, [isAuthenticated]);

  // Load a conversation from history
  const handleLoadConversation = useCallback(async (conv: AIConversation) => {
    setIsLoadingHistory(true);
    try {
      const loadedMessages = await loadConversation(conv.id);
      setMessages(loadedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })));
      setCurrentConversationId(conv.id);
      setShowHistory(false);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [loadConversation, setCurrentConversationId, setShowHistory]);

  // Start a new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  }, [setCurrentConversationId, setShowHistory]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    // Create or use existing conversation for authenticated users
    let convId = currentConversationId;
    if (isAuthenticated && !convId && messages.length === 0) {
      try {
        const { createConversation } = await import("@/app/actions/ai-conversations");
        const result = await createConversation(currentContext ? {
          page: currentContext.page,
          content: currentContext.content ? {
            type: currentContext.content.type,
            title: currentContext.content.title,
          } : undefined,
        } : undefined);
        if (result.data) {
          convId = result.data.id;
          setCurrentConversationId(convId);
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }

    // Save user message
    if (convId) {
      saveMessage(convId, "user", userMessage);
    }

    try {
      // Include context in the first message
      const contextPrefix = messages.length === 0 && currentQuestion
        ? currentQuestion + "\n\n"
        : "";

      // Build messages array for the API
      const apiMessages = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user" as const, content: contextPrefix + userMessage },
      ];

      // Extract AI context for better RAG ranking
      const aiContext = currentContext?.content ? {
        type: currentContext.content.type,
        category: currentContext.page?.category,
        code: currentContext.content.code,
        language: currentContext.content.language,
        title: currentContext.content.title,
      } : undefined;

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          currentPage: currentContext?.page?.path,
          visibleSection: currentContext?.page?.section,
          aiContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Save assistant message after streaming completes
      if (convId && assistantMessage) {
        saveMessage(convId, "assistant", assistantMessage);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, currentQuestion, currentContext, currentConversationId, isAuthenticated, saveMessage, setCurrentConversationId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[80vh]",
          "flex flex-col",
          "rounded-2xl bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {showHistory ? "Conversation History" : "Ask Claude"}
              </h2>
              {!showHistory && currentContext?.page && (
                <p className="text-xs text-gray-500">
                  Context: {currentContext.page.title}
                  {currentContext.content?.type && ` (${currentContext.content.type})`}
                </p>
              )}
              {showHistory && (
                <p className="text-xs text-gray-500">
                  {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* History toggle for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  if (!showHistory) {
                    loadConversations();
                  }
                  setShowHistory(!showHistory);
                }}
                className={cn(
                  "px-2 py-1 text-xs rounded-md flex items-center gap-1.5",
                  "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  showHistory && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400"
                )}
              >
                <HistoryIcon className="h-3.5 w-3.5" />
                {showHistory ? "Chat" : "History"}
              </button>
            )}
            {!showHistory && currentContext && (
              <button
                onClick={() => setShowContext(!showContext)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md",
                  "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  showContext && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                {showContext ? "Hide" : "Show"} Context
              </button>
            )}
            <button
              onClick={close}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Context Preview */}
        {showContext && currentQuestion && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-[#262626]">
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-32">
              {currentQuestion}
            </pre>
          </div>
        )}

        {/* Messages or History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showHistory ? (
            // History panel
            <div className="space-y-4">
              {/* New conversation button */}
              <button
                onClick={handleNewConversation}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-medium",
                  "hover:shadow-lg hover:shadow-blue-500/25",
                  "transition-all duration-200"
                )}
              >
                <PlusIcon className="h-4 w-4" />
                New Conversation
              </button>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <span className="inline-flex gap-1 text-gray-400">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                  </span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start chatting to save your history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl",
                        "bg-white dark:bg-[#111111]",
                        "border border-gray-200 dark:border-[#262626]",
                        "hover:border-blue-500/50",
                        "transition-all duration-200",
                        currentConversationId === conv.id && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {conv.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.message_count} message{conv.message_count !== 1 ? "s" : ""} • {formatDate(conv.updated_at)}
                          </p>
                        </div>
                        {conv.is_starred && (
                          <StarIcon className="h-4 w-4 text-yellow-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Chat messages
            <>
              {messages.length === 0 && suggestedQuestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm",
                          "bg-gray-100 dark:bg-gray-800",
                          "text-gray-700 dark:text-gray-300",
                          "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                          "hover:text-blue-700 dark:hover:text-cyan-300",
                          "transition-colors"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content || (
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-[#262626]">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              className={cn(
                "flex-1 resize-none rounded-xl px-4 py-3",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500",
                "border-0 focus:ring-2 focus:ring-blue-500",
                "max-h-32"
              )}
              style={{
                height: "auto",
                minHeight: "44px",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-3 rounded-xl",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "hover:shadow-lg hover:shadow-blue-500/25",
                "transition-all"
              )}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
