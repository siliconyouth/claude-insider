"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";

/**
 * Voice Assistant Demo Component
 *
 * A realistic preview of the actual AI assistant chat window from unified-chat.
 * Features a 30-second animation cycle with:
 * - Suggested questions that animate on "click"
 * - Message bubbles matching unified-chat styling
 * - Typewriter streaming effect for AI responses
 * - Voice button states (idle → recording)
 * - Loading dots animation
 */

const DEMO_MESSAGES: { role: "user" | "assistant"; content: string }[] = [
  { role: "user", content: "What is Claude Code?" },
  {
    role: "assistant",
    content:
      "Claude Code is Anthropic's official CLI tool that brings AI-powered coding assistance directly to your terminal. It helps with code reviews, refactoring, debugging, and writing new features.",
  },
  { role: "user", content: "How do I install it?" },
  {
    role: "assistant",
    content:
      "Install it globally with npm:\n\nnpm install -g @anthropic-ai/claude-code\n\nThen run 'claude' in any project directory to start.",
  },
] as const;

const SUGGESTED_QUESTIONS = [
  "What is Claude Code?",
  "How do I install it?",
  "What can it help with?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function VoiceAssistantDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState<number | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Typewriter effect for streaming
  const streamText = useCallback((text: string, onComplete: () => void) => {
    let index = 0;
    setIsStreaming(true);
    setStreamingText("");

    const interval = setInterval(() => {
      if (index < text.length) {
        setStreamingText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        onComplete();
      }
    }, 20); // 20ms per character for smooth streaming

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change (within container only, not page)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, streamingText, isTyping]);

  // Main animation cycle
  useEffect(() => {
    const CYCLE_DURATION = 30000; // 30 seconds

    const runAnimation = () => {
      const timers: NodeJS.Timeout[] = [];
      let cleanupStreaming: (() => void) | undefined;

      // Reset state
      setMessages([]);
      setIsTyping(false);
      setShowSuggestions(true);
      setIsListening(false);
      setHighlightedSuggestion(null);
      setStreamingText("");
      setIsStreaming(false);

      // Step 1: Highlight first suggestion (simulated click)
      timers.push(
        setTimeout(() => {
          setHighlightedSuggestion(0);
        }, 2000)
      );

      // Step 2: Add user message, hide suggestions
      timers.push(
        setTimeout(() => {
          setHighlightedSuggestion(null);
          setShowSuggestions(false);
          setMessages([{ role: "user", content: DEMO_MESSAGES[0]!.content }]);
        }, 2500)
      );

      // Step 3: Show typing indicator
      timers.push(
        setTimeout(() => {
          setIsTyping(true);
        }, 3000)
      );

      // Step 4: Stream AI response
      timers.push(
        setTimeout(() => {
          setIsTyping(false);
          cleanupStreaming = streamText(DEMO_MESSAGES[1]!.content, () => {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: DEMO_MESSAGES[1]!.content },
            ]);
            setStreamingText("");
          });
        }, 4500)
      );

      // Step 5: Show voice button recording state
      timers.push(
        setTimeout(() => {
          setIsListening(true);
        }, 12000)
      );

      // Step 6: Stop recording, add second user message
      timers.push(
        setTimeout(() => {
          setIsListening(false);
          setMessages((prev) => [
            ...prev,
            { role: "user", content: DEMO_MESSAGES[2]!.content },
          ]);
        }, 14000)
      );

      // Step 7: Show typing indicator
      timers.push(
        setTimeout(() => {
          setIsTyping(true);
        }, 14500)
      );

      // Step 8: Stream second AI response
      timers.push(
        setTimeout(() => {
          setIsTyping(false);
          cleanupStreaming = streamText(DEMO_MESSAGES[3]!.content, () => {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: DEMO_MESSAGES[3]!.content },
            ]);
            setStreamingText("");
          });
        }, 16000)
      );

      // Cleanup function
      return () => {
        timers.forEach((timer) => clearTimeout(timer));
        cleanupStreaming?.();
      };
    };

    // Run initial animation
    let cleanup = runAnimation();

    // Loop the animation
    const interval = setInterval(() => {
      cleanup();
      cleanup = runAnimation();
    }, CYCLE_DURATION);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [streamText]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Glow effect behind window */}
      <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-cyan-500/30 rounded-3xl animate-pulse" />
      </div>

      {/* Window frame - matches unified-chat exactly */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-white dark:bg-[#0a0a0a]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/20"
        )}
      >
        {/* Header with tabs */}
        <div className="px-2 py-2 border-b border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-1">
            {/* AI Tab - Active */}
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              AI
            </button>

            {/* Messages Tab - Inactive */}
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                "text-gray-600 dark:text-gray-400",
                "hover:text-gray-900 dark:hover:text-white",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              Messages
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={messagesContainerRef} className="h-[340px] overflow-y-auto p-4 space-y-4">
          {/* Suggested questions - only show when no messages */}
          {showSuggestions && messages.length === 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                      highlightedSuggestion === index
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 scale-95"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    )}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex animate-fade-in-up",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {/* AI Avatar */}
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mr-2">
                  <svg
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] px-4 py-3 text-sm",
                  message.role === "user"
                    ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Streaming AI response */}
          {isStreaming && streamingText && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mr-2">
                <svg
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div className="max-w-[85%] px-4 py-3 text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-2 h-4 ml-0.5 bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                </p>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mr-2">
                <svg
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 dark:border-[#262626]">
          <div className="flex items-center gap-2">
            {/* Voice button */}
            <button
              className={cn(
                "p-3 rounded-xl transition-all duration-200",
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
              aria-label={isListening ? "Recording..." : "Start voice input"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>

            {/* Text input */}
            <input
              type="text"
              placeholder="Type your message..."
              className={cn(
                "flex-1 rounded-xl px-4 py-3 text-sm",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500",
                "border-0 focus:ring-2 focus:ring-blue-500",
                "transition-all duration-200"
              )}
              readOnly
            />

            {/* Send button */}
            <button
              className={cn(
                "p-3 rounded-xl",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "hover:shadow-lg hover:shadow-blue-500/25",
                "transition-all duration-200"
              )}
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
