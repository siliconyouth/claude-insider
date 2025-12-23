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
import { useSound } from "@/hooks/use-sound-effects";
import { useUnifiedChat } from "../unified-chat-provider";
import { markdownToSpeakableText } from "@/lib/claude-utils";
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
  renameConversation,
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
import {
  ChatMessageAction,
} from "@/components/chat/chat-message";
import { VirtualizedAIMessageList } from "@/components/messaging/virtualized-ai-message-list";

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

  // Sound effects for AI chat
  const { playMessageSent, playMessageReceived, playToggleOn, playToggleOff } = useSound();

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
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Smart recommendations after AI response
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationPool, setRecommendationPool] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Names (loaded for Settings panel - prefixed as unused for now)
  const [_assistantName, setAssistantNameState] = useState(DEFAULT_ASSISTANT_NAME);
  const [_userName, setUserNameState] = useState("");

  // Refs
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

  // Track if we've played the first response sound (plays once per response)
  const hasPlayedFirstChunkRef = useRef(false);

  // Streaming TTS: track position in text that has been queued
  const streamingTTSStartedRef = useRef(false);
  const lastQueuedTextRef = useRef("");

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
   * Split text into natural chunks for TTS streaming.
   *
   * FLUENCY OPTIMIZATION (v1.12.0):
   * Instead of splitting into individual sentences (which causes pauses between
   * API calls), we now batch text into larger paragraphs/chunks. This lets
   * ElevenLabs v3 handle internal pacing naturally, resulting in much smoother
   * speech without artificial gaps.
   *
   * Chunk strategy:
   * - Short responses (<500 chars): Send as single chunk for seamless playback
   * - Medium responses: Split on paragraph breaks only (double newlines)
   * - Long responses (>2000 chars): Split on paragraphs, max ~1500 chars per chunk
   */
  const splitIntoChunks = useCallback((text: string): string[] => {
    const cleanText = text.trim();

    // Short text: send as single chunk for maximum fluency
    if (cleanText.length < 500) {
      return [cleanText];
    }

    // Split on paragraph breaks (double newlines)
    const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);

    // If only 1-2 paragraphs, return as-is
    if (paragraphs.length <= 2) {
      return paragraphs.map(p => p.trim());
    }

    // For longer text, batch paragraphs into chunks of ~1500 chars max
    // This balances fluency (fewer API calls) with responsiveness
    const chunks: string[] = [];
    let currentChunk = "";
    const MAX_CHUNK_SIZE = 1500;

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();

      if (currentChunk.length === 0) {
        currentChunk = trimmedPara;
      } else if (currentChunk.length + trimmedPara.length + 2 <= MAX_CHUNK_SIZE) {
        // Add paragraph to current chunk with separator
        currentChunk += " " + trimmedPara;
      } else {
        // Current chunk is full, push it and start new one
        chunks.push(currentChunk);
        currentChunk = trimmedPara;
      }
    }

    // Push final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
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

    // Split into chunks and queue
    const chunks = splitIntoChunks(markdownToSpeakableText(text));
    speechQueueRef.current = chunks;

    // Start processing queue
    processSpeechQueue();
  }, [splitIntoChunks, processSpeechQueue]);

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

  /**
   * Queue text for streaming TTS - starts speaking as soon as first sentence is ready.
   * Call this during streaming to add sentences to the queue progressively.
   *
   * @param fullText - The complete text so far (including previously queued text)
   * @param isFinal - If true, queues any remaining text even if incomplete sentence
   */
  const _queueStreamingTTS = useCallback((fullText: string, isFinal: boolean = false) => {
    if (!fullText.trim()) return;

    const speakableText = markdownToSpeakableText(fullText);
    const alreadyQueued = lastQueuedTextRef.current;

    // Find the new text that hasn't been queued yet
    if (!speakableText.startsWith(alreadyQueued)) {
      // Text was completely replaced, reset
      lastQueuedTextRef.current = "";
    }

    const newText = speakableText.slice(lastQueuedTextRef.current.length).trim();
    if (!newText) return;

    // Find complete sentences (ends with . ! ? or newlines for headers)
    // For streaming, we want to be aggressive about finding sentence boundaries
    const sentenceEndRegex = /[.!?]\s+|[.!?]$/;
    const lastSentenceEnd = newText.search(sentenceEndRegex);

    let textToQueue = "";

    if (isFinal) {
      // Queue everything remaining
      textToQueue = newText;
    } else if (lastSentenceEnd !== -1) {
      // Find the actual end position (including the punctuation)
      const match = newText.match(sentenceEndRegex);
      if (match && match.index !== undefined) {
        textToQueue = newText.slice(0, match.index + match[0].length).trim();
      }
    } else if (!streamingTTSStartedRef.current && newText.length > 150) {
      // First chunk: wait for more context (~150 chars), then find natural break
      // This gives ElevenLabs enough context for proper intonation
      const commaPos = newText.lastIndexOf(", ");
      const semicolonPos = newText.lastIndexOf("; ");
      const colonPos = newText.lastIndexOf(": ");
      const bestBreak = Math.max(commaPos, semicolonPos, colonPos);
      if (bestBreak > 60) {
        textToQueue = newText.slice(0, bestBreak + 1).trim();
      }
    } else if (streamingTTSStartedRef.current && newText.length > 60) {
      // Subsequent chunks: smaller threshold (~60 chars) for fluent flow
      // Queue at natural pauses (commas, semicolons, colons) to avoid long gaps
      const commaPos = newText.lastIndexOf(", ");
      const semicolonPos = newText.lastIndexOf("; ");
      const colonPos = newText.lastIndexOf(": ");
      const dashPos = newText.lastIndexOf(" - ");
      const bestBreak = Math.max(commaPos, semicolonPos, colonPos, dashPos);
      if (bestBreak > 25) {
        textToQueue = newText.slice(0, bestBreak + (dashPos === bestBreak ? 2 : 1)).trim();
      }
    }

    if (!textToQueue) return;

    // Update tracking
    lastQueuedTextRef.current += (lastQueuedTextRef.current ? " " : "") + textToQueue;

    // Initialize TTS state if this is the first chunk
    if (!streamingTTSStartedRef.current) {
      streamingTTSStartedRef.current = true;
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      // Stop any previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      speechQueueRef.current = [];
      isProcessingQueueRef.current = false;
    }

    // Add to queue
    speechQueueRef.current.push(textToQueue);

    // Start processing if not already
    if (!isProcessingQueueRef.current) {
      processSpeechQueue();
    }
  }, [processSpeechQueue]);

  /**
   * Reset streaming TTS state - call before starting a new response.
   */
  const resetStreamingTTS = useCallback(() => {
    streamingTTSStartedRef.current = false;
    lastQueuedTextRef.current = "";
  }, []);

  /**
   * Prefetch audio from ElevenLabs - returns audio element ready to play.
   * Optimized for low latency with early playback capability.
   */
  const prefetchAudio = useCallback(async (text: string): Promise<HTMLAudioElement | null> => {
    if (!text.trim()) return null;

    try {
      const speakableText = markdownToSpeakableText(text);
      const cacheKey = `${selectedVoiceRef.current}:${speakableText}`;
      let audioUrl = audioCacheRef.current.get(cacheKey);

      if (!audioUrl) {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch("/api/assistant/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: speakableText,
            voice: selectedVoiceRef.current,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        audioCacheRef.current.set(cacheKey, audioUrl);
      }

      const audio = new Audio(audioUrl);
      // Use 'metadata' preload - faster than 'auto', enough to get duration
      audio.preload = "metadata";

      // Wait for 'canplay' (enough data to start) instead of 'canplaythrough' (all data)
      // This reduces latency by ~500ms-1s
      await new Promise<void>((resolve) => {
        const onReady = () => {
          audio.removeEventListener("canplay", onReady);
          audio.removeEventListener("loadedmetadata", onReady);
          audio.removeEventListener("error", onReady);
          resolve();
        };
        audio.addEventListener("canplay", onReady);
        audio.addEventListener("loadedmetadata", onReady);
        audio.addEventListener("error", onReady);
        audio.load();
      });

      return audio;
    } catch {
      return null;
    }
  }, []);

  /**
   * Fake-stream text while audio plays - reveals text progressively synced to audio duration.
   * NOTE: Currently unused - kept for potential future use with synchronized text+audio display
   */
  const _fakeStreamText = useCallback((
    fullText: string,
    audioDuration: number,
    onUpdate: (partialText: string) => void,
    onComplete: () => void
  ) => {
    const chars = fullText.length;
    // Calculate reveal rate: slightly faster than audio to ensure text is ahead
    const msPerChar = (audioDuration * 1000 * 0.85) / chars;
    const minMsPerChar = 15; // Minimum speed (fast typing)
    const maxMsPerChar = 50; // Maximum speed (slow, readable)
    const actualMsPerChar = Math.max(minMsPerChar, Math.min(maxMsPerChar, msPerChar));

    let currentIndex = 0;

    const revealNext = () => {
      if (currentIndex >= chars) {
        onUpdate(fullText);
        onComplete();
        return;
      }

      // Reveal in word chunks for smoother appearance
      let nextIndex = currentIndex + 1;
      // If we're at a space, reveal until next space (whole word)
      if (fullText[currentIndex] === ' ' || currentIndex === 0) {
        const nextSpace = fullText.indexOf(' ', currentIndex + 1);
        if (nextSpace !== -1 && nextSpace - currentIndex < 15) {
          nextIndex = nextSpace + 1;
        }
      }

      currentIndex = nextIndex;
      onUpdate(fullText.slice(0, currentIndex));

      setTimeout(revealNext, actualMsPerChar * (nextIndex - currentIndex + 1));
    };

    revealNext();
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
      // Play sound for starting listening
      playToggleOn();
    } catch (err) {
      console.error("Failed to start listening:", err);
    }
  }, [speechSupported, announce, playToggleOn]);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript("");
    // Play sound for stopping listening
    playToggleOff();
  }, [playToggleOff]);

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

    // Play sent sound
    playMessageSent();

    // Reset first chunk tracking for this response
    hasPlayedFirstChunkRef.current = false;

    // Reset streaming TTS state for new response
    resetStreamingTTS();

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

      // OPTIMIZATION: Start audio prefetch early during streaming (parallel, not sequential)
      let earlyAudioPromise: Promise<HTMLAudioElement | null> | null = null;
      let earlyPrefetchText = "";
      const EARLY_PREFETCH_THRESHOLD = 300; // Start prefetch after 300 chars

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

                // ALWAYS stream text immediately - no buffering
                // Audio will play in parallel when ready
                setStreamingContent(fullContent);

                // Play received sound on first chunk
                if (!hasPlayedFirstChunkRef.current) {
                  hasPlayedFirstChunkRef.current = true;
                  playMessageReceived();
                }

                // OPTIMIZATION: Start early audio prefetch when we have enough text
                // This runs IN PARALLEL with continued Claude streaming
                if (autoSpeak && !earlyAudioPromise && fullContent.length >= EARLY_PREFETCH_THRESHOLD) {
                  earlyPrefetchText = fullContent;
                  earlyAudioPromise = prefetchAudio(fullContent);
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Text streaming is already complete - add final message and clear loading state
      const assistantMessage: Message = { role: "assistant", content: fullContent };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
      setIsLoading(false); // Clear loading BEFORE audio prefetch to avoid showing loading indicator again

      // Handle TTS - audio plays alongside already-visible text (no fake streaming)
      if (autoSpeak && fullContent) {
        let audio: HTMLAudioElement | null = null;

        // Check if early prefetch is still valid (text didn't change too much)
        // If text grew by less than 50%, reuse early prefetch; otherwise fetch fresh
        const textGrowth = earlyPrefetchText ? (fullContent.length - earlyPrefetchText.length) / earlyPrefetchText.length : 1;

        if (earlyAudioPromise && textGrowth < 0.5) {
          // Reuse early prefetch - text didn't change much
          audio = await earlyAudioPromise;
        } else {
          // Text changed significantly or no early prefetch - fetch fresh
          audio = await prefetchAudio(fullContent);
        }

        if (audio && audio.duration > 0) {
          // Set up audio state
          audioRef.current = audio;
          isSpeakingRef.current = true;
          setIsSpeaking(true);

          // Start audio playback - text is already visible, no fake streaming needed
          audio.play();

          // Handle audio end
          audio.onended = () => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            setSpeakingMessageIdx(null);
          };
        }
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
    prefetchAudio,
    resetStreamingTTS,
    stopSpeaking,
    clearAIContext,
    announce,
    generateRecommendations,
    playMessageSent,
    playMessageReceived,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Generate recommendations when conversation loads with existing messages.
   * Shows follow-up suggestions if last message is from assistant.
   */
  useEffect(() => {
    // Only generate if:
    // 1. We have messages
    // 2. Last message is from assistant
    // 3. Not currently loading/streaming
    // 4. Don't already have recommendations
    if (
      messages.length > 0 &&
      messages[messages.length - 1]?.role === "assistant" &&
      !isLoading &&
      !streamingContent &&
      recommendations.length === 0
    ) {
      const pool = generateRecommendations();
      setRecommendationPool(pool.slice(3));
      setRecommendations(pool.slice(0, 3));
      setShowRecommendations(true);
    }
  }, [messages, isLoading, streamingContent, recommendations.length, generateRecommendations]);

  /**
   * Handle clicking a recommendation - sends immediately and hides recommendations
   */
  const handleRecommendationClick = useCallback((recommendation: string) => {
    setShowRecommendations(false);
    setRecommendations([]);
    sendMessage(recommendation);
    track("assistant_recommendation_clicked", { recommendation: recommendation.substring(0, 50) });
  }, [sendMessage]);

  /**
   * Render actions (Listen/Copy buttons) for assistant messages in virtualized list
   */
  const renderMessageActions = useCallback((msg: Message, index: number) => {
    if (msg.role !== "assistant") return null;

    return (
      <>
        <ChatMessageAction
          onClick={() => {
            if (speakingMessageIdx === index && isSpeaking) {
              stopSpeaking();
            } else {
              speakText(msg.content, index);
            }
          }}
          isActive={speakingMessageIdx === index && isSpeaking}
          ariaLabel={speakingMessageIdx === index && isSpeaking ? "Stop speaking" : "Listen to message"}
        >
          {speakingMessageIdx === index && isSpeaking ? (
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
        </ChatMessageAction>
        <ChatMessageAction
          onClick={() => {
            navigator.clipboard.writeText(msg.content);
            setCopiedMessageIdx(index);
            announce("Copied to clipboard");
            // Reset after 2 seconds
            setTimeout(() => setCopiedMessageIdx(null), 2000);
          }}
          isActive={copiedMessageIdx === index}
          ariaLabel="Copy message to clipboard"
        >
          {copiedMessageIdx === index ? (
            <>
              <CheckIcon className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </ChatMessageAction>
      </>
    );
  }, [speakingMessageIdx, isSpeaking, copiedMessageIdx, speakText, stopSpeaking, announce]);

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

  // Start renaming a conversation
  const startRename = useCallback((convId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingConvId(convId);
    setRenameValue(currentTitle);
  }, []);

  // Save renamed conversation
  const saveRename = useCallback(() => {
    if (renamingConvId && renameValue.trim()) {
      renameConversation(renamingConvId, renameValue.trim());
      setConversations(getAllConversations());
      announce(`Conversation renamed to ${renameValue.trim()}`);
    }
    setRenamingConvId(null);
    setRenameValue("");
  }, [renamingConvId, renameValue, announce]);

  // Cancel renaming
  const cancelRename = useCallback(() => {
    setRenamingConvId(null);
    setRenameValue("");
  }, []);

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
                    <div
                      key={conv.id}
                      className={cn(
                        "group w-full rounded-lg border p-3 text-left transition-all",
                        "hover:border-blue-500/50 hover:shadow-md",
                        activeConversationId === conv.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => loadConversation(conv)}
                        >
                          {renamingConvId === conv.id ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={saveRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRename();
                                if (e.key === "Escape") cancelRename();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "w-full px-2 py-1 rounded text-sm font-medium",
                                "bg-white dark:bg-gray-700",
                                "border border-blue-500",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                "text-gray-900 dark:text-white"
                              )}
                              autoFocus
                            />
                          ) : (
                            <p className={cn(
                              "truncate text-sm font-medium",
                              activeConversationId === conv.id
                                ? "text-blue-600 dark:text-cyan-400"
                                : "text-gray-900 dark:text-white"
                            )}>
                              {conv.title}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} · {formatConversationTime(conv.updatedAt)}
                          </p>
                        </button>
                        <div className="flex items-center gap-1">
                          {/* Rename button */}
                          <button
                            onClick={(e) => startRename(conv.id, conv.title, e)}
                            className={cn(
                              "rounded p-1 opacity-0 transition-all group-hover:opacity-100",
                              "text-gray-400 hover:text-blue-500",
                              "hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            )}
                            title="Rename conversation"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {/* Delete button */}
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
                      </div>
                    </div>
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

        {/* Settings Panel - Full screen overlay */}
        {showSettings && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
            {/* Settings Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Assistant Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
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

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Voice Selection Section with inline preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SpeakerIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Voice</h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose the voice for text-to-speech responses
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2.5 text-sm",
                      "bg-gray-100 dark:bg-gray-800",
                      "border border-gray-200 dark:border-gray-700",
                      "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all"
                    )}
                  >
                    {VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </select>
                  {/* Inline preview button */}
                  <button
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                      } else {
                        speakText("Hello! I'm your AI assistant, here to help you learn about Claude and answer your questions.");
                      }
                    }}
                    className={cn(
                      "shrink-0 p-2.5 rounded-lg transition-all",
                      isSpeaking
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:scale-105"
                    )}
                    title={isSpeaking ? "Stop preview" : "Preview voice"}
                    aria-label={isSpeaking ? "Stop voice preview" : "Play voice preview"}
                  >
                    {isSpeaking ? (
                      <StopIcon className="h-5 w-5" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Auto-speak Toggle Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">Auto-speak Responses</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically read AI responses aloud
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      autoSpeak
                        ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                    role="switch"
                    aria-checked={autoSpeak}
                    aria-label="Auto-speak responses"
                  >
                    <span
                      className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        autoSpeak && "translate-x-5"
                      )}
                    />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Suggestions - shown only when no messages */}
          {messages.length === 0 && !isLoading && suggestions.length > 0 && (
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-500">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
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

          {/* Virtualized Message List with inline recommendations */}
          {(messages.length > 0 || isLoading) && (
            <VirtualizedAIMessageList
              messages={messages}
              streamingContent={streamingContent}
              isLoading={isLoading}
              error={error}
              renderActions={renderMessageActions}
              className="p-4"
              recommendations={
                showRecommendations && recommendations.length > 0
                  ? recommendations.map((rec) => ({
                      text: rec,
                      onClick: () => handleRecommendationClick(rec),
                    }))
                  : []
              }
              onSomethingElse={handleSomethingElse}
              hasMoreRecommendations={recommendationPool.length > 0}
              isSpeaking={isSpeaking}
              onStopSpeaking={stopSpeaking}
            />
          )}

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
      {/* Cog/gear icon */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
