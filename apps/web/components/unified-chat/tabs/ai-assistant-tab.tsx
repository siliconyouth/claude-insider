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
  clearAllConversations,
  getActiveConversationId,
  setActiveConversationId,
  getAssistantName,
  getUserName,
  formatConversationTime,
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

// ============================================================================
// Retry Helper
// ============================================================================

/**
 * Fetch with exponential backoff retry logic.
 * Retries on network errors and 5xx server errors.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry on client errors (4xx) - those won't improve
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on server errors (5xx)
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) break;

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[Chat] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
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
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Smart recommendations after AI response
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationPool, setRecommendationPool] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Names (loaded for Settings panel - prefixed as unused for now)
  const [_assistantName, setAssistantNameState] = useState(DEFAULT_ASSISTANT_NAME);
  const [_userName, setUserNameState] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const selectedVoiceRef = useRef(selectedVoice);

  // Audio semaphore refs (prevents overlapping audio)
  const isSpeakingRef = useRef(false);
  const speakingMessageIndexRef = useRef<number | null>(null);

  // Phase 3: Audio caching and queue system
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const isMobileRef = useRef(false);

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

    // Detect mobile for TTS strategy (Safari blocks chained audio.play())
    const ua = navigator.userAgent;
    const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    isMobileRef.current = isMobileDevice || isIOSSafari;
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

  // Cleanup audio on unmount (prevents zombie audio and memory leaks)
  useEffect(() => {
    // Capture ref for cleanup
    const audioCache = audioCacheRef.current;

    return () => {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Cancel browser TTS
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      // Clear speech queue
      speechQueueRef.current = [];
      isProcessingQueueRef.current = false;
      // Stop speech recognition
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      // CRITICAL: Revoke all cached blob URLs to prevent memory leaks
      // Each URL.createObjectURL() holds a reference to the blob in memory
      audioCache.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      audioCache.clear();
    };
  }, []);

  // Handle AI context from Ask AI
  useEffect(() => {
    if (aiQuestion && aiContext) {
      // Pre-fill input with question
      setInput(aiQuestion);
      inputRef.current?.focus();
    }
  }, [aiContext, aiQuestion]);

  // ============================================================================
  // TTS - Phase 3: Queue-based streaming with caching
  // ============================================================================

  /**
   * Split text into natural sentences for TTS streaming.
   * Avoids splitting on technical dots (file extensions, URLs, abbreviations).
   */
  const splitIntoSentences = useCallback((text: string): string[] => {
    const sentences: string[] = [];
    let current = "";
    let i = 0;

    const pushCurrent = () => {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
      current = "";
    };

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      // Paragraph breaks create natural pauses
      if (char === "\n" && nextChar === "\n") {
        current += char;
        pushCurrent();
        while (text[i + 1] === "\n") i++;
        i++;
        continue;
      }

      // List items start new sentences
      if (char === "\n") {
        const afterNewline = text.slice(i + 1, i + 5);
        const isListItem = /^(\d+[.)]\s|[-*•]\s)/.test(afterNewline);
        if (isListItem && current.trim().length > 0) {
          pushCurrent();
        }
        current += char;
        i++;
        continue;
      }

      current += char;

      // Colon followed by newline (introduces list)
      if (char === ":" && nextChar === "\n") {
        pushCurrent();
        i++;
        continue;
      }

      // Check for sentence-ending punctuation
      if (char === "." || char === "!" || char === "?") {
        // Skip dots that are NOT sentence endings
        const isFileExtension = /\.(md|ts|tsx|js|jsx|json|py|go|rs|yaml|yml|env|css|html|xml|txt|sh|bash|toml|sql)$/i.test(current);
        const isDomain = /\.(com|org|io|dev|ai|net|edu|gov|co|app)$/i.test(current);
        const isAbbreviation = /(e\.g|i\.e|etc|vs|mr|mrs|dr|sr|jr)\.$/i.test(current);
        const isVersionOrNumber = /\d\.$/.test(current) || /v\d+\.$/.test(current.toLowerCase());
        const isPath = current.includes("/") && !nextChar?.match(/\s/);
        const isCodeRef = /[a-z_]\.[a-z_]/i.test(current.slice(-5));
        const hasNoSpaceAfter = nextChar && !nextChar.match(/\s/) && nextChar !== undefined;

        const isRealSentenceEnd =
          !isFileExtension &&
          !isDomain &&
          !isAbbreviation &&
          !isVersionOrNumber &&
          !isPath &&
          !isCodeRef &&
          !hasNoSpaceAfter &&
          (nextChar === undefined || nextChar === " " || nextChar === "\n");

        if (isRealSentenceEnd) {
          while (text[i + 1] === " ") i++;
          pushCurrent();
        }
      }
      i++;
    }

    pushCurrent();
    return sentences;
  }, []);

  /**
   * Process speech queue - plays sentences sequentially for natural reading.
   * On mobile, plays all at once to avoid Safari's audio.play() restrictions.
   */
  const processSpeechQueue = useCallback(async () => {
    // Guard: Only one audio at a time
    if (isProcessingQueueRef.current) return;
    if (speechQueueRef.current.length === 0) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setSpeakingMessageIdx(null);
      return;
    }

    // On mobile, join all sentences and play as one (Safari restrictions)
    const textToSpeak = isMobileRef.current
      ? speechQueueRef.current.join(" ")
      : speechQueueRef.current.shift()!;

    if (isMobileRef.current) {
      speechQueueRef.current = [];
    }

    if (!textToSpeak.trim()) {
      if (speechQueueRef.current.length > 0) {
        processSpeechQueue();
      } else {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setSpeakingMessageIdx(null);
      }
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      // Check cache first
      const cacheKey = `${selectedVoiceRef.current}:${textToSpeak}`;
      let audioUrl = audioCacheRef.current.get(cacheKey);

      if (!audioUrl) {
        const response = await fetch("/api/assistant/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: markdownToSpeakableText(textToSpeak),
            voice: selectedVoiceRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error("TTS API failed");
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        // Cache for replay (don't revoke these URLs)
        audioCacheRef.current.set(cacheKey, audioUrl);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        isProcessingQueueRef.current = false;
        // Process next sentence (desktop only - mobile plays all at once)
        if (!isMobileRef.current && speechQueueRef.current.length > 0) {
          processSpeechQueue();
        } else {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          setSpeakingMessageIdx(null);
        }
      };

      audio.onerror = () => {
        isProcessingQueueRef.current = false;
        // Try next sentence on error
        if (speechQueueRef.current.length > 0) {
          processSpeechQueue();
        } else {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          setSpeakingMessageIdx(null);
        }
      };

      await audio.play();
    } catch (err) {
      console.error("[TTS Queue] Error:", err);
      isProcessingQueueRef.current = false;
      // Continue with next sentence
      if (speechQueueRef.current.length > 0) {
        processSpeechQueue();
      } else {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setSpeakingMessageIdx(null);
      }
    }
  }, []);

  /**
   * Speak text using queue system for natural sentence-by-sentence reading.
   * Waits for full response, then streams sentences with best quality.
   */
  const speakText = useCallback(async (text: string, messageIndex?: number) => {
    if (!text.trim()) return;

    // Stop any previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Set speaking state
    isSpeakingRef.current = true;
    if (messageIndex !== undefined) {
      speakingMessageIndexRef.current = messageIndex;
      setSpeakingMessageIdx(messageIndex);
    }
    setIsSpeaking(true);

    // Split into sentences and queue
    const sentences = splitIntoSentences(markdownToSpeakableText(text));
    speechQueueRef.current = sentences;

    // Start processing queue
    processSpeechQueue();
  }, [splitIntoSentences, processSpeechQueue]);

  /**
   * Stop all audio playback and clear queue.
   */
  const stopSpeaking = useCallback(() => {
    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop browser TTS fallback
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Clear queue
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Release semaphore and reset state
    isSpeakingRef.current = false;
    speakingMessageIndexRef.current = null;
    setIsSpeaking(false);
    setSpeakingMessageIdx(null);
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
  // Smart Recommendations
  // ============================================================================

  /**
   * Generate context-aware follow-up questions based on page and conversation.
   * Returns pool of recommendations - first 3 shown, rest available via "Something else"
   */
  const generateRecommendations = useCallback((): string[] => {
    const baseRecommendations = [
      "Can you explain this in more detail?",
      "What are the best practices for this?",
      "Are there any common mistakes to avoid?",
      "Can you show me a code example?",
      "How does this compare to alternatives?",
      "What are the performance considerations?",
    ];

    // Add context-aware recommendations based on page
    const contextRecommendations: string[] = [];

    if (pathname?.includes("/docs/getting-started")) {
      contextRecommendations.push(
        "What should I configure first?",
        "How do I verify my setup is correct?",
        "What are the minimum requirements?"
      );
    } else if (pathname?.includes("/docs/configuration")) {
      contextRecommendations.push(
        "What's the recommended configuration?",
        "How do I customize this for my project?",
        "Are there any security considerations?"
      );
    } else if (pathname?.includes("/docs/api")) {
      contextRecommendations.push(
        "What are the rate limits?",
        "How do I handle errors?",
        "Can you show the request/response format?"
      );
    } else if (pathname?.includes("/docs/tips")) {
      contextRecommendations.push(
        "What are the most useful tips?",
        "How can I be more productive?",
        "What features are often overlooked?"
      );
    }

    // Combine and shuffle for variety
    const all = [...contextRecommendations, ...baseRecommendations];
    return all.sort(() => Math.random() - 0.5);
  }, [pathname]);

  /**
   * Cycle to next set of recommendations from pool
   */
  const handleSomethingElse = useCallback(() => {
    if (recommendationPool.length > 0) {
      const nextBatch = recommendationPool.slice(0, 3);
      const remainingPool = recommendationPool.slice(3);
      setRecommendations(nextBatch);
      setRecommendationPool(remainingPool);
      track("assistant_something_else_clicked");
    }
  }, [recommendationPool]);

  // ============================================================================
  // Chat
  // ============================================================================

  const sendMessage = useCallback(async (messageOverride?: string) => {
    const messageText = (messageOverride ?? input).trim();
    if (!messageText || isLoading) return;

    // CRITICAL: Stop any playing audio before new message
    stopSpeaking();

    // Hide previous recommendations
    setShowRecommendations(false);
    setRecommendations([]);

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

      const response = await fetchWithRetry(
        "/api/assistant/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            currentPage: pathname,
            pageContent,
            visibleSection,
            aiContext: aiContext || undefined,
          }),
        },
        3, // Max 3 retries
        1000 // 1 second base delay
      );

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

      // Show smart recommendations after response
      setTimeout(() => {
        const pool = generateRecommendations();
        setRecommendationPool(pool.slice(3));
        setRecommendations(pool.slice(0, 3));
        setShowRecommendations(true);
      }, 300);

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
    stopSpeaking,
    clearAIContext,
    announce,
    generateRecommendations,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Handle clicking a recommendation - sends immediately and hides recommendations
   */
  const handleRecommendationClick = useCallback((recommendation: string) => {
    setShowRecommendations(false);
    setRecommendations([]);
    sendMessage(recommendation);
    track("assistant_recommendation_clicked", { recommendation: recommendation.substring(0, 50) });
  }, [sendMessage]);

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

  const handleClearAllConversations = useCallback(() => {
    if (confirm("Are you sure you want to delete all conversations? This cannot be undone.")) {
      clearAllConversations();
      setConversations([]);
      setMessages([]);
      setActiveConvId(null);
      setShowHistory(false);
      announce("All conversations cleared");
    }
  }, [announce]);

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
      <div className="flex-1 overflow-hidden flex relative">
        {/* History Panel - Full screen overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
            {/* History Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Conversations</h3>
              <div className="flex items-center gap-2">
                {/* New conversation button */}
                <button
                  onClick={startNewConversation}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "hover:scale-105 transition-all"
                  )}
                  title="Start new conversation"
                >
                  <PlusIcon className="h-4 w-4" />
                  New
                </button>
                {/* Close button */}
                <button
                  onClick={() => setShowHistory(false)}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white",
                    "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  title="Back to chat"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* History Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {conversations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                    <ChatIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Start a new conversation to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className={cn(
                        "group w-full rounded-lg border p-3 text-left transition-all",
                        "hover:border-blue-500/50 hover:shadow-md",
                        activeConversationId === conv.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "truncate text-sm font-medium",
                            activeConversationId === conv.id
                              ? "text-blue-600 dark:text-cyan-400"
                              : "text-gray-900 dark:text-white"
                          )}>
                            {conv.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} · {formatConversationTime(conv.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteConv(conv.id, e)}
                          className={cn(
                            "rounded p-1 opacity-0 transition-all group-hover:opacity-100",
                            "text-gray-400 hover:text-red-500",
                            "hover:bg-red-100 dark:hover:bg-red-900/30"
                          )}
                          title="Delete conversation"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* History Footer - Clear All */}
            {conversations.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                <button
                  onClick={handleClearAllConversations}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm",
                    "border border-red-200 dark:border-red-900/50",
                    "bg-white dark:bg-gray-800",
                    "text-red-600 dark:text-red-400",
                    "hover:bg-red-50 dark:hover:bg-red-900/20",
                    "transition-colors"
                  )}
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear all conversations
                </button>
              </div>
            )}
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
                        // Send immediately - don't just copy to input
                        sendMessage(suggestion);
                        track("assistant_suggestion_clicked", { suggestion: suggestion.substring(0, 50) });
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
                        onClick={() => {
                          // Toggle: if speaking THIS message, stop; else play this message
                          if (speakingMessageIdx === i && isSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(msg.content, i);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded transition-colors text-sm",
                          speakingMessageIdx === i && isSpeaking
                            ? "text-blue-500 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                        title={speakingMessageIdx === i && isSpeaking ? "Stop speaking" : "Speak this message"}
                      >
                        {speakingMessageIdx === i && isSpeaking ? (
                          <>
                            <StopIcon className="h-4 w-4" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <SpeakerIcon className="h-4 w-4" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          announce("Copied to clipboard");
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy to clipboard"
                      >
                        <CopyIcon className="h-4 w-4" />
                        <span>Copy</span>
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

            {/* Smart Recommendations */}
            {showRecommendations && recommendations.length > 0 && !isLoading && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suggested follow-ups:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.map((rec, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecommendationClick(rec)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        "bg-gray-100 dark:bg-gray-800",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                        "border border-transparent hover:border-blue-300 dark:hover:border-blue-700",
                        "transition-all duration-200"
                      )}
                    >
                      {rec}
                    </button>
                  ))}
                  {recommendationPool.length > 0 && (
                    <button
                      onClick={handleSomethingElse}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        "bg-gradient-to-r from-violet-100 to-blue-100",
                        "dark:from-violet-900/30 dark:to-blue-900/30",
                        "text-violet-700 dark:text-violet-300",
                        "hover:from-violet-200 hover:to-blue-200",
                        "dark:hover:from-violet-800/40 dark:hover:to-blue-800/40",
                        "transition-all duration-200"
                      )}
                    >
                      Something else →
                    </button>
                  )}
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
                onClick={() => sendMessage()}
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
