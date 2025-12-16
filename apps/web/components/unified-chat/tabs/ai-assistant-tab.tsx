"use client";

/**
 * AI Assistant Tab
 *
 * AI chat interface with Claude streaming, TTS, and speech recognition.
 * Ported from voice-assistant.tsx with streamlined implementation.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { cn } from "@/lib/design-system";
import { useUnifiedChat } from "../unified-chat-provider";
import { markdownToSpeakableText, markdownToDisplayText } from "@/lib/claude-utils";
import {
  getPageContent,
  getVisibleSection,
  getSuggestedQuestions,
} from "@/lib/assistant-context";
import {
  getAllConversations,
  createConversation,
  updateConversationMessages,
  deleteConversation,
  getActiveConversationId,
  setActiveConversationId,
  getAssistantName,
  getUserName,
  DEFAULT_ASSISTANT_NAME,
  type Conversation,
} from "@/lib/assistant-storage";
import {
  VoiceRecognizer,
  isSpeechRecognitionSupported,
} from "@/lib/speech-recognition";
import { useAnnouncer } from "@/hooks/use-aria-live";
import { triggerCreditsRefresh } from "@/hooks/use-api-credits";
import { LinkifiedText } from "@/components/linkified-text";

// ============================================================================
// Types
// ============================================================================

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Voice {
  id: string;
  name: string;
  description: string;
}

// ============================================================================
// Voices
// ============================================================================

const VOICES: Voice[] = [
  // Female voices
  { id: "sarah", name: "Sarah", description: "Soft, young female" },
  { id: "rachel", name: "Rachel", description: "Calm, young female" },
  { id: "emily", name: "Emily", description: "Calm, young female" },
  { id: "matilda", name: "Matilda", description: "Warm, young female" },
  { id: "freya", name: "Freya", description: "Expressive, female" },
  { id: "charlotte", name: "Charlotte", description: "Seductive, female" },
  { id: "alice", name: "Alice", description: "Confident, female" },
  { id: "lily", name: "Lily", description: "Warm, female" },
  // Male voices
  { id: "daniel", name: "Daniel", description: "Deep, authoritative" },
  { id: "brian", name: "Brian", description: "Deep, middle-aged" },
  { id: "adam", name: "Adam", description: "Deep, middle-aged" },
  { id: "josh", name: "Josh", description: "Deep, young male" },
  { id: "liam", name: "Liam", description: "Articulate, male" },
  { id: "charlie", name: "Charlie", description: "Casual, male" },
  { id: "george", name: "George", description: "Warm, male" },
  { id: "chris", name: "Chris", description: "Casual, male" },
];

// ============================================================================
// Component
// ============================================================================

export function AIAssistantTab() {
  const { aiContext, aiQuestion, clearAIContext } = useUnifiedChat();
  const { announce } = useAnnouncer();
  const pathname = usePathname();

  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Voice state
  const [selectedVoice, setSelectedVoice] = useState<string>("sarah");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Names (loaded for Settings panel - prefixed as unused for now)
  const [_assistantName, setAssistantNameState] = useState(DEFAULT_ASSISTANT_NAME);
  const [_userName, setUserNameState] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const selectedVoiceRef = useRef(selectedVoice);

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    // Load preferences
    const savedVoice = localStorage.getItem("claude-insider-voice");
    const savedAutoSpeak = localStorage.getItem("claude-insider-auto-speak");
    if (savedVoice) setSelectedVoice(savedVoice);
    if (savedAutoSpeak !== null) setAutoSpeak(savedAutoSpeak === "true");

    // Load names
    setAssistantNameState(getAssistantName());
    setUserNameState(getUserName());

    // Load conversations
    const savedConvs = getAllConversations();
    setConversations(savedConvs);

    // Load active conversation
    const activeId = getActiveConversationId();
    if (activeId && savedConvs.some((c) => c.id === activeId)) {
      setActiveConvId(activeId);
      const activeConv = savedConvs.find((c) => c.id === activeId);
      if (activeConv) setMessages(activeConv.messages);
    }

    // Check speech support
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Update voice ref
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("claude-insider-voice", selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem("claude-insider-auto-speak", String(autoSpeak));
  }, [autoSpeak]);

  // Save messages
  useEffect(() => {
    if (messages.length > 0 && activeConversationId) {
      updateConversationMessages(activeConversationId, messages);
      setConversations(getAllConversations());
    }
  }, [messages, activeConversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Generate suggestions based on context
  useEffect(() => {
    const pageSuggestions = getSuggestedQuestions(pathname);
    setSuggestions(pageSuggestions.slice(0, 3));
  }, [pathname]);

  // Handle AI context from Ask AI
  useEffect(() => {
    if (aiQuestion && aiContext) {
      // Pre-fill input with question
      setInput(aiQuestion);
      inputRef.current?.focus();
    }
  }, [aiContext, aiQuestion]);

  // ============================================================================
  // TTS
  // ============================================================================

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsSpeaking(true);
    try {
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: markdownToSpeakableText(text),
          voice: selectedVoiceRef.current,
        }),
      });

      if (!response.ok) {
        // Fallback to browser TTS
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
          return;
        }
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ============================================================================
  // Speech Recognition
  // ============================================================================

  const startListening = useCallback(() => {
    if (!speechSupported) return;

    if (!recognizerRef.current) {
      recognizerRef.current = new VoiceRecognizer({
        onResult: (transcript: string, isFinal: boolean) => {
          if (isFinal) {
            setInput(transcript);
            setInterimTranscript("");
          } else {
            setInterimTranscript(transcript);
          }
        },
        onEnd: () => {
          setIsListening(false);
        },
        onError: (error: string) => {
          console.error("Speech error:", error);
          setIsListening(false);
          announce("Speech recognition error. Please try again.");
        },
      });
    }

    try {
      recognizerRef.current.start();
      setIsListening(true);
      announce("Listening for voice input");
    } catch (err) {
      console.error("Failed to start listening:", err);
    }
  }, [speechSupported, announce]);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  // ============================================================================
  // Chat
  // ============================================================================

  const sendMessage = useCallback(async () => {
    const messageText = input.trim();
    if (!messageText || isLoading) return;

    // Create new conversation if needed
    let convId = activeConversationId;
    if (!convId) {
      const newConv = createConversation();
      convId = newConv.id;
      setActiveConvId(convId);
      setActiveConversationId(convId);
    }

    // Add user message
    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setStreamingContent("");

    // Track analytics
    track("assistant_message_sent", { page: pathname });

    try {
      // Get page context
      const pageContent = getPageContent();
      const visibleSection = getVisibleSection();

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentPage: pathname,
          pageContent,
          visibleSection,
          aiContext: aiContext || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Stream response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullContent = "";

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
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: Message = { role: "assistant", content: fullContent };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      // Auto-speak if enabled
      if (autoSpeak && fullContent) {
        speakText(fullContent);
      }

      // Refresh credits
      triggerCreditsRefresh();

      // Clear AI context after first message
      if (aiContext) {
        clearAIContext();
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      announce("Error sending message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    activeConversationId,
    messages,
    pathname,
    aiContext,
    autoSpeak,
    speakText,
    clearAIContext,
    announce,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================================
  // Conversation Management
  // ============================================================================

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setActiveConvId(null);
    setActiveConversationId("");
    setShowHistory(false);
    inputRef.current?.focus();
  }, []);

  const loadConversation = useCallback((conv: Conversation) => {
    setMessages(conv.messages);
    setActiveConvId(conv.id);
    setActiveConversationId(conv.id);
    setShowHistory(false);
  }, []);

  const deleteConv = useCallback((convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(convId);
    setConversations(getAllConversations());
    if (activeConversationId === convId) {
      setMessages([]);
      setActiveConvId(null);
    }
  }, [activeConversationId]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#262626]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "px-2 py-1 text-xs rounded-md flex items-center gap-1.5",
              "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              showHistory && "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            History
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              showSettings && "bg-gray-100 dark:bg-gray-800"
            )}
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* History sidebar */}
        {showHistory && (
          <div className="w-64 border-r border-gray-200 dark:border-[#262626] overflow-y-auto">
            <div className="p-2">
              <button
                onClick={startNewConversation}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white text-sm font-medium",
                  "hover:shadow-lg hover:shadow-blue-500/25",
                  "transition-all duration-200"
                )}
              >
                <PlusIcon className="h-4 w-4" />
                New Chat
              </button>
            </div>
            <div className="px-2 pb-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer",
                    "text-sm text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    activeConversationId === conv.id && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => deleteConv(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="w-72 border-r border-gray-200 dark:border-[#262626] overflow-y-auto p-4 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Settings</h3>

            {/* Voice selection */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-sm",
                  "bg-gray-100 dark:bg-gray-800",
                  "border-0 focus:ring-2 focus:ring-blue-500"
                )}
              >
                {VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-speak toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto-speak</span>
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={cn(
                  "relative w-10 h-6 rounded-full transition-colors",
                  autoSpeak
                    ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                    autoSpeak && "translate-x-4"
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && suggestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        "bg-gray-100 dark:bg-gray-800",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                        "transition-colors"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <LinkifiedText text={markdownToDisplayText(msg.content)} />
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                        className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title={isSpeaking ? "Stop" : "Speak"}
                      >
                        {isSpeaking ? (
                          <StopIcon className="h-4 w-4" />
                        ) : (
                          <SpeakerIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          announce("Copied to clipboard");
                        }}
                        className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Copy"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <LinkifiedText text={markdownToDisplayText(streamingContent)} />
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                  <span className="inline-flex gap-1 text-gray-400">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex justify-center">
                <div className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-2">
              {/* Mic button */}
              {speechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  <MicIcon className="h-5 w-5" />
                </button>
              )}

              {/* Text input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={interimTranscript || input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening..." : "Type a message..."}
                  disabled={isLoading}
                  className={cn(
                    "w-full rounded-xl px-4 py-3",
                    "bg-gray-100 dark:bg-gray-800",
                    "text-gray-900 dark:text-white",
                    "placeholder-gray-500",
                    "border-0 focus:ring-2 focus:ring-blue-500",
                    "disabled:opacity-50"
                  )}
                />
              </div>

              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:shadow-lg hover:shadow-blue-500/25"
                )}
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5M3.05 13A9 9 0 106 5.3L3 8M12 7v5l4 2" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
