"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import type { Message } from "@/lib/claude-utils";
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
  setAssistantName,
  getUserName,
  setUserName,
  hasAskedForNameThisSession,
  setAskedForNameThisSession,
  formatConversationTime,
  DEFAULT_ASSISTANT_NAME,
  type Conversation,
} from "@/lib/assistant-storage";
import {
  VoiceRecognizer,
  isSpeechRecognitionSupported,
} from "@/lib/speech-recognition";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAnnouncer } from "@/hooks/use-aria-live";
import { triggerCreditsRefresh } from "@/hooks/use-api-credits";
import { LinkifiedText } from "./linkified-text";

// Extend window for quota warning tracking
declare global {
  interface Window {
    __elevenLabsQuotaWarned?: boolean;
  }
}

interface StreamEvent {
  type: "text" | "done" | "error";
  content?: string;
}

// Export a function to open the assistant from other components
let openAssistantFn: (() => void) | null = null;
export function openAssistant() {
  if (openAssistantFn) openAssistantFn();
}

export function VoiceAssistant() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [, setIsSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>("sarah");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [customAssistantName, setCustomAssistantName] = useState<string>("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");
  // User name state
  const [userName, setUserNameState] = useState<string>("");
  const [showUserNameInput, setShowUserNameInput] = useState(false);
  const [userNameInputValue, setUserNameInputValue] = useState("");
  const [hasAskedForName, setHasAskedForName] = useState(false);
  // Smart recommendations state
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationPool, setRecommendationPool] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  // Cache for generated TTS audio to avoid regenerating on replay
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const { announce } = useAnnouncer();

  // Copy message to clipboard
  const copyToClipboard = useCallback(async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      announce("Message copied to clipboard");
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopiedMessageIndex(messageIndex);
        announce("Message copied to clipboard");
        setTimeout(() => {
          setCopiedMessageIndex(null);
        }, 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        announce("Failed to copy message");
      }
      document.body.removeChild(textarea);
    }
  }, [announce]);

  // Prevent hydration mismatch and load preferences from localStorage
  useEffect(() => {
    setMounted(true);
    // Load saved preferences
    const savedVoice = localStorage.getItem("claude-insider-voice");
    const savedAutoSpeak = localStorage.getItem("claude-insider-auto-speak");
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }
    if (savedAutoSpeak !== null) {
      setAutoSpeak(savedAutoSpeak === "true");
    }
    // Load custom assistant name
    const savedName = getAssistantName();
    setCustomAssistantName(savedName !== DEFAULT_ASSISTANT_NAME ? savedName : "");
    // Load user name
    const savedUserName = getUserName();
    setUserNameState(savedUserName);
    // Check if we've already asked for name this session
    setHasAskedForName(hasAskedForNameThisSession());
    // Load conversations
    const savedConversations = getAllConversations();
    setConversations(savedConversations);
    // Load active conversation
    const activeId = getActiveConversationId();
    if (activeId && savedConversations.some(c => c.id === activeId)) {
      setActiveConvId(activeId);
      const activeConv = savedConversations.find(c => c.id === activeId);
      if (activeConv) {
        setMessages(activeConv.messages);
      }
    }
    // Register the open function for external access
    openAssistantFn = () => setIsOpen(true);
    return () => {
      openAssistantFn = null;
    };
  }, []);

  // Save voice preference when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("claude-insider-voice", selectedVoice);
    }
  }, [selectedVoice, mounted]);

  // Save auto-speak preference when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("claude-insider-auto-speak", String(autoSpeak));
    }
  }, [autoSpeak, mounted]);

  // Available ElevenLabs voices (all pre-made voices) - memoized to prevent re-renders
  const voices = useMemo(() => [
    // Female voices
    { id: "sarah", name: "Sarah", description: "Soft, young female" },
    { id: "rachel", name: "Rachel", description: "Calm, young female" },
    { id: "emily", name: "Emily", description: "Calm, young female" },
    { id: "matilda", name: "Matilda", description: "Warm, young female" },
    { id: "freya", name: "Freya", description: "Expressive, female" },
    { id: "charlotte", name: "Charlotte", description: "Seductive, female" },
    { id: "alice", name: "Alice", description: "Confident, female" },
    { id: "lily", name: "Lily", description: "Warm, female" },
    { id: "domi", name: "Domi", description: "Strong, young female" },
    { id: "elli", name: "Elli", description: "Young, female" },
    { id: "dorothy", name: "Dorothy", description: "Pleasant, female" },
    { id: "grace", name: "Grace", description: "Southern accent, female" },
    { id: "serena", name: "Serena", description: "Pleasant, female" },
    { id: "nicole", name: "Nicole", description: "Whisper, young female" },
    { id: "glinda", name: "Glinda", description: "Witch, female" },
    { id: "mimi", name: "Mimi", description: "Childish, female" },
    { id: "gigi", name: "Gigi", description: "Childish, female" },
    // Male voices
    { id: "daniel", name: "Daniel", description: "Deep, authoritative" },
    { id: "brian", name: "Brian", description: "Deep, middle-aged" },
    { id: "adam", name: "Adam", description: "Deep, middle-aged" },
    { id: "josh", name: "Josh", description: "Deep, young male" },
    { id: "liam", name: "Liam", description: "Articulate, male" },
    { id: "charlie", name: "Charlie", description: "Casual, male" },
    { id: "george", name: "George", description: "Warm, male" },
    { id: "chris", name: "Chris", description: "Casual, male" },
    { id: "drew", name: "Drew", description: "Well-rounded, male" },
    { id: "clyde", name: "Clyde", description: "War veteran, male" },
    { id: "paul", name: "Paul", description: "Ground reporter, male" },
    { id: "dave", name: "Dave", description: "Conversational, male" },
    { id: "fin", name: "Fin", description: "Sailor, male" },
    { id: "antoni", name: "Antoni", description: "Well-rounded, male" },
    { id: "thomas", name: "Thomas", description: "Calm, male" },
    { id: "callum", name: "Callum", description: "Hoarse, male" },
    { id: "patrick", name: "Patrick", description: "Shouty, male" },
    { id: "harry", name: "Harry", description: "Anxious, male" },
    { id: "arnold", name: "Arnold", description: "Crisp, male" },
    { id: "james", name: "James", description: "Calm, old male" },
    { id: "michael", name: "Michael", description: "Old, male" },
    { id: "ethan", name: "Ethan", description: "Young, male" },
    { id: "ryan", name: "Ryan", description: "Soldier, male" },
    { id: "sam", name: "Sam", description: "Raspy, young male" },
    { id: "jessie", name: "Jessie", description: "Raspy, older male" },
    { id: "giovanni", name: "Giovanni", description: "Foreigner, male" },
  ], []);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Streaming TTS state
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);
  const lastSpokenIndexRef = useRef(0);
  const streamingCompleteRef = useRef(false); // Track if streaming is done
  const pendingAutoSpeakTextRef = useRef<string>(""); // Accumulate text for mobile-safe TTS
  const isMobileRef = useRef(false); // Detect mobile for TTS strategy

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Focus trap for modal accessibility
  const { containerRef: assistantContainerRef } = useFocusTrap({
    enabled: isOpen,
    initialFocusRef: inputRef as React.RefObject<HTMLElement>,
    returnFocusRef: triggerButtonRef as React.RefObject<HTMLElement>,
    onEscape: () => {
      setIsOpen(false);
      track("assistant_closed", { page: pathname });
    },
    closeOnEscape: true,
  });

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0 && activeConversationId) {
      updateConversationMessages(activeConversationId, messages);
      // Refresh conversations list
      setConversations(getAllConversations());
    }
  }, [messages, activeConversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Preview a voice with a short sample text
  const previewVoice = useCallback(async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't select the voice, just preview

    // Stop any existing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    // If already previewing this voice, stop
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voiceId);

    try {
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello! This is how I sound. Nice to meet you!",
          voice: voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to preview voice");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;

      audio.onended = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewingVoice(null);
    }
  }, [previewingVoice]);

  // Initialize speech recognition and detect mobile
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
    // Detect mobile/touch devices for TTS strategy
    // Mobile Safari blocks programmatic audio.play() calls without user gesture
    // Note: We ONLY check user agent, not touch support (MacBooks have touch trackpads)
    const ua = navigator.userAgent;
    const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    // Also check if it's Safari on iOS specifically (most restrictive)
    const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    isMobileRef.current = isMobileDevice || isIOSSafari;
  }, []);

  // Close voice menu when clicking outside
  useEffect(() => {
    if (!showVoiceMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setShowVoiceMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVoiceMenu]);

  // Ref for selectedVoice to avoid stale closure in processSpeechQueue
  const selectedVoiceRef = useRef(selectedVoice);
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Get a good English voice for browser TTS fallback
  const getPreferredVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
           voices.find((v) => v.lang.startsWith("en") && v.name.includes("Samantha")) ||
           voices.find((v) => v.lang.startsWith("en")) ||
           null;
  }, []);

  // Speak text using browser TTS (fallback)
  const speakWithBrowserTTSQueue = useCallback((text: string, onEnd: () => void) => {
    if (!("speechSynthesis" in window)) {
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = onEnd;
    utterance.onerror = onEnd;

    window.speechSynthesis.speak(utterance);
  }, [getPreferredVoice]);

  // Process speech queue - handles both desktop (sequential) and mobile (single batch)
  // On mobile, we DON'T chain audio via onended because Safari blocks programmatic play()
  const processSpeechQueue = useCallback(async () => {
    // Strict guard - only one audio at a time
    if (isSpeakingQueueRef.current) return;
    if (speechQueueRef.current.length === 0) {
      if (streamingCompleteRef.current) {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      }
      return;
    }

    // Take all queued text
    const textToSpeak = speechQueueRef.current.join(" ");
    speechQueueRef.current = [];

    if (!textToSpeak.trim()) {
      if (streamingCompleteRef.current) {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      }
      return;
    }

    // Mark as speaking BEFORE any async operations
    isSpeakingQueueRef.current = true;
    setIsSpeaking(true);

    try {
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markdownToSpeakableText(textToSpeak), voice: selectedVoiceRef.current }),
      });

      if (!response.ok) {
        // Check if it's a quota exceeded error
        if (response.status === 429) {
          try {
            const errorData = await response.json();
            if (errorData.error === 'quota_exceeded') {
              // Only announce once per session
              if (!window.__elevenLabsQuotaWarned) {
                window.__elevenLabsQuotaWarned = true;
                announce('Voice quota exceeded. Using browser voice instead.');
              }
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
        // Fallback to browser TTS
        speakWithBrowserTTSQueue(textToSpeak, () => {
          isSpeakingQueueRef.current = false;
          // On mobile, don't try to process next - it will fail without user gesture
          if (!isMobileRef.current && speechQueueRef.current.length > 0) {
            processSpeechQueue();
          } else {
            setIsSpeaking(false);
            setSpeakingMessageIndex(null);
          }
        });
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isSpeakingQueueRef.current = false;

        // On mobile, DON'T try to chain audio - Safari blocks it without user gesture
        // On desktop, we can continue processing the queue
        if (!isMobileRef.current && speechQueueRef.current.length > 0) {
          processSpeechQueue();
        } else {
          // Either mobile or queue is empty
          setIsSpeaking(false);
          setSpeakingMessageIndex(null);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        isSpeakingQueueRef.current = false;
        // On mobile, don't try to continue - fall back gracefully
        if (!isMobileRef.current && speechQueueRef.current.length > 0) {
          processSpeechQueue();
        } else {
          setIsSpeaking(false);
          setSpeakingMessageIndex(null);
        }
      };

      await audio.play();
    } catch (err) {
      console.error("[TTS] Error:", err);
      isSpeakingQueueRef.current = false;
      // Fallback to browser TTS
      speakWithBrowserTTSQueue(textToSpeak, () => {
        if (!isMobileRef.current && speechQueueRef.current.length > 0) {
          processSpeechQueue();
        } else {
          setIsSpeaking(false);
          setSpeakingMessageIndex(null);
        }
      });
    }
  }, [speakWithBrowserTTSQueue, announce]);

  // Split text into speakable sentences, avoiding splits on technical dots
  // Also breaks on empty lines and list items for natural pauses
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

      // Check for empty lines (paragraph breaks) - create a pause
      if (char === "\n" && nextChar === "\n") {
        current += char;
        pushCurrent();
        // Skip all consecutive newlines
        while (text[i + 1] === "\n") {
          i++;
        }
        i++;
        continue;
      }

      // Check for list items at start of line (after newline)
      // Matches: "1. ", "2) ", "- ", "* ", "• "
      if (char === "\n") {
        const afterNewline = text.slice(i + 1, i + 5);
        const isListItem = /^(\d+[.)]\s|[-*•]\s)/.test(afterNewline);

        if (isListItem && current.trim().length > 0) {
          // End current sentence before the list item
          pushCurrent();
        }
        current += char;
        i++;
        continue;
      }

      current += char;

      // Check for colon followed by newline (introduces a list)
      if (char === ":" && nextChar === "\n") {
        pushCurrent();
        i++;
        continue;
      }

      // Check for sentence-ending punctuation
      if (char === "." || char === "!" || char === "?") {
        // Skip dots that are NOT sentence endings:
        // 1. File extensions (.md, .ts, .js, .json, .tsx, .jsx, .py, .go, .rs, .yaml, .yml, .env, .css, .html, .xml, etc.)
        // 2. Abbreviations (e.g., i.e., etc., vs., Mr., Dr., etc.)
        // 3. URLs or paths (contains / before or after)
        // 4. Version numbers (v1.0, 2.0.1)
        // 5. Domain names (.com, .org, .io, .dev, .ai)
        // 6. Code references (method.call, object.property)
        // 7. Decimal numbers (3.14)

        const isFileExtension = /\.(md|ts|tsx|js|jsx|json|py|go|rs|yaml|yml|env|css|html|xml|txt|sh|bash|zsh|toml|cfg|ini|log|sql|graphql|vue|svelte|astro|mdx)$/i.test(current);
        const isDomain = /\.(com|org|io|dev|ai|net|edu|gov|co|app|xyz)$/i.test(current);
        const isAbbreviation = /(e\.g|i\.e|etc|vs|mr|mrs|dr|sr|jr|inc|ltd|corp)\.$/i.test(current);
        const isVersionOrNumber = /\d\.$/.test(current) || /v\d+\.$/.test(current.toLowerCase());
        const isPath = current.includes("/") && !nextChar?.match(/\s/);
        const isCodeRef = /[a-z_]\.[a-z_]/i.test(current.slice(-5));
        const hasNoSpaceAfter = nextChar && !nextChar.match(/\s/) && nextChar !== undefined;

        // It's a real sentence ending if:
        // - Followed by space + capital letter, or end of text, or newline
        // - AND not any of the technical patterns above
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
          // Skip whitespace after punctuation
          while (text[i + 1] === " ") {
            i++;
          }
          pushCurrent();
        }
      }
      i++;
    }

    // Add any remaining text
    pushCurrent();

    return sentences;
  }, []);

  // Add text to speech queue (splits by sentences) - reserved for future use
  const _queueSpeech = useCallback((text: string) => {
    const sentences = splitIntoSentences(text);
    sentences.forEach(sentence => {
      if (sentence.length > 0) {
        speechQueueRef.current.push(sentence);
      }
    });
    processSpeechQueue();
  }, [processSpeechQueue, splitIntoSentences]);

  // Stop streaming TTS
  const stopStreamingTTS = useCallback(() => {
    speechQueueRef.current = [];
    isSpeakingQueueRef.current = false;
    lastSpokenIndexRef.current = 0;
    streamingCompleteRef.current = false;
    // Stop any playing audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Also stop browser TTS fallback if active
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
  }, []);

  // Handle keyboard shortcut (Cmd/Ctrl + .)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen]);

  // Ref for autoSpeak to avoid stale closure in sendMessage
  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  // Ref for generateRecommendations to avoid forward reference (defined later in the file)
  const generateRecommendationsRef = useRef<() => string[]>(() => []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Track message sent
      track("assistant_message_sent", { page: pathname, messageLength: content.trim().length });

      // Clear recommendations when user sends a message
      setShowRecommendations(false);
      setRecommendations([]);

      setError(null);
      setIsLoading(true);
      setStreamingContent("");

      // Reset streaming TTS state
      stopStreamingTTS();
      lastSpokenIndexRef.current = 0;
      streamingCompleteRef.current = false;
      pendingAutoSpeakTextRef.current = ""; // Reset pending text for mobile

      // Create a new conversation if this is the first message
      let currentConvId = activeConversationId;
      if (!currentConvId) {
        const newConv = createConversation();
        currentConvId = newConv.id;
        setActiveConvId(currentConvId);
        setConversations(getAllConversations());
      }

      // Add user message
      const userMessage: Message = { role: "user", content: content.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      // Track the message index for speaking indicator
      const assistantMessageIndex = updatedMessages.length;

      try {
        // Get page context
        const pageContent = getPageContent();
        const visibleSection = getVisibleSection();

        // Get custom assistant name (use stored name or undefined)
        const assistantNameToSend = customAssistantName || undefined;

        // Determine if we should ask for user's name
        // Only ask if: no name set, haven't asked this session, and this is the first message
        const shouldAskForName = !userName && !hasAskedForName && updatedMessages.length === 1;

        // Mark that we've asked for name this session (do this before the request)
        if (shouldAskForName) {
          setAskedForNameThisSession();
          setHasAskedForName(true);
        }

        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            currentPage: pathname,
            pageContent,
            visibleSection,
            customAssistantName: assistantNameToSend,
            userName: userName || undefined,
            shouldAskForName,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Read the streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: StreamEvent = JSON.parse(line.slice(6));

                if (data.type === "text" && data.content) {
                  assistantContent += data.content;
                  setStreamingContent(assistantContent);

                  // Stream TTS: speak sentences as they complete during streaming
                  // On mobile, we DON'T do incremental TTS - we wait until the end
                  // because Safari blocks chained audio.play() calls
                  if (autoSpeakRef.current && !isMobileRef.current) {
                    const sentences = splitIntoSentences(assistantContent);
                    // Get new complete sentences that haven't been queued yet
                    const newSentences = sentences.slice(lastSpokenIndexRef.current);
                    if (newSentences.length > 0) {
                      // Only queue sentences that are "complete" (have ending punctuation or significant length)
                      // Keep the last sentence if it might be incomplete
                      const completeCount = newSentences.length > 1 ? newSentences.length - 1 : 0;
                      const sentencesToQueue = newSentences.slice(0, completeCount);

                      if (sentencesToQueue.length > 0) {
                        setSpeakingMessageIndex(assistantMessageIndex);
                        sentencesToQueue.forEach(sentence => {
                          speechQueueRef.current.push(sentence);
                        });
                        lastSpokenIndexRef.current += sentencesToQueue.length;
                        processSpeechQueue();
                      }
                    }
                  }
                } else if (data.type === "error") {
                  throw new Error(data.content || "Stream error");
                }
              } catch {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }

        // Mark streaming as complete
        streamingCompleteRef.current = true;

        // Trigger credits refresh after AI response
        triggerCreditsRefresh();

        console.log('[TTS] Streaming complete', {
          autoSpeak: autoSpeakRef.current,
          hasContent: !!assistantContent.trim(),
          isMobile: isMobileRef.current,
          lastSpokenIndex: lastSpokenIndexRef.current
        });

        // Queue any remaining text that wasn't spoken during streaming
        if (autoSpeakRef.current && assistantContent.trim()) {
          if (isMobileRef.current) {
            // On mobile: speak the ENTIRE response as one audio request
            // This is triggered right after streaming completes, so it's still
            // considered a "continuation" of the original user gesture
            console.log('[TTS] Mobile: queuing entire response');
            setSpeakingMessageIndex(assistantMessageIndex);
            speechQueueRef.current.push(assistantContent);
            processSpeechQueue();
          } else {
            // On desktop: just queue remaining sentences (we already played most)
            const sentences = splitIntoSentences(assistantContent);
            const remainingSentences = sentences.slice(lastSpokenIndexRef.current);
            console.log('[TTS] Desktop: queuing remaining sentences', {
              totalSentences: sentences.length,
              lastSpoken: lastSpokenIndexRef.current,
              remaining: remainingSentences.length
            });
            if (remainingSentences.length > 0) {
              setSpeakingMessageIndex(assistantMessageIndex);
              remainingSentences.forEach(sentence => {
                speechQueueRef.current.push(sentence);
              });
              processSpeechQueue();
            }
          }
        }

        // Add complete assistant message
        if (assistantContent) {
          const assistantMessage: Message = {
            role: "assistant",
            content: assistantContent,
          };
          const newMessages = [...updatedMessages, assistantMessage];
          setMessages(newMessages);

          // Initialize recommendations after assistant responds
          // Small delay to let the UI settle
          setTimeout(() => {
            const pool = generateRecommendationsRef.current();
            setRecommendationPool(pool.slice(3));
            setRecommendations(pool.slice(0, 3));
            setShowRecommendations(true);
          }, 300);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        stopStreamingTTS();
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [messages, isLoading, pathname, stopStreamingTTS, splitIntoSentences, processSpeechQueue, activeConversationId, customAssistantName, userName, hasAskedForName]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Start a new conversation
  const handleNewConversation = useCallback(() => {
    const newConv = createConversation();
    setActiveConvId(newConv.id);
    setMessages([]);
    setConversations(getAllConversations());
    setShowConversationList(false);
    track("assistant_new_conversation");
  }, []);

  // Select an existing conversation
  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveConvId(conv.id);
    setActiveConversationId(conv.id);
    setMessages(conv.messages);
    setShowConversationList(false);
    track("assistant_conversation_selected", { messageCount: conv.messages.length });
  }, []);

  // Delete a specific conversation
  const handleDeleteConversation = useCallback((convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(convId);
    const updated = getAllConversations();
    setConversations(updated);
    // If we deleted the active conversation, clear messages
    if (convId === activeConversationId) {
      setActiveConvId(null);
      setMessages([]);
    }
    track("assistant_conversation_deleted");
  }, [activeConversationId]);

  // Clear current conversation (existing behavior)
  const handleClearHistory = () => {
    track("assistant_history_cleared", { messageCount: messages.length });
    if (activeConversationId) {
      deleteConversation(activeConversationId);
      setConversations(getAllConversations());
    }
    setActiveConvId(null);
    setMessages([]);
  };

  // Clear all conversations
  const handleClearAllConversations = useCallback(() => {
    track("assistant_all_conversations_cleared", { count: conversations.length });
    clearAllConversations();
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);
    setShowConversationList(false);
  }, [conversations.length]);

  // Save custom assistant name
  const handleSaveAssistantName = useCallback(() => {
    const trimmed = nameInputValue.trim();
    setAssistantName(trimmed);
    setCustomAssistantName(trimmed);
    setShowNameInput(false);
    setNameInputValue("");
    if (trimmed) {
      announce(`Assistant name changed to ${trimmed}`);
      track("assistant_name_changed", { name: trimmed });
    } else {
      announce("Assistant name reset to default");
      track("assistant_name_reset");
    }
  }, [nameInputValue, announce]);

  // Save user's name
  const handleSaveUserName = useCallback(() => {
    const trimmed = userNameInputValue.trim();
    setUserName(trimmed);
    setUserNameState(trimmed);
    setShowUserNameInput(false);
    setUserNameInputValue("");
    if (trimmed) {
      announce(`Your name has been saved as ${trimmed}`);
      track("user_name_set", { hasName: true });
    } else {
      announce("Your name has been cleared");
      track("user_name_cleared");
    }
  }, [userNameInputValue, announce]);

  // Generate contextual recommendations based on conversation and current page
  const generateRecommendations = useCallback(() => {
    const currentPath = pathname || "/";

    // Base recommendations pool organized by context
    const baseRecommendations: Record<string, string[]> = {
      general: [
        "What can you help me with?",
        "Tell me about Claude Code features",
        "How do I get started with Claude?",
        "What's new in the latest Claude update?",
        "Explain Claude's capabilities",
        "What are the best practices for using Claude?",
      ],
      gettingStarted: [
        "How do I install Claude Code?",
        "What are the system requirements?",
        "How do I authenticate with Claude?",
        "Walk me through the setup process",
        "What's the quickest way to get started?",
      ],
      configuration: [
        "How do I configure CLAUDE.md?",
        "What settings can I customize?",
        "How do I set up environment variables?",
        "Explain the configuration options",
        "What's the best configuration for my project?",
      ],
      api: [
        "How do I use the Claude API?",
        "Explain API authentication",
        "What are the rate limits?",
        "Show me API examples",
        "How do I handle API errors?",
      ],
      tips: [
        "What are your top productivity tips?",
        "How can I write better prompts?",
        "What shortcuts should I know?",
        "How do I get better responses?",
        "Share some advanced techniques",
      ],
      resources: [
        "What resources do you recommend?",
        "Show me popular MCP servers",
        "What tools work well with Claude?",
        "Where can I find examples?",
        "What SDKs are available?",
      ],
      followUp: [
        "Can you explain that more simply?",
        "Give me a code example",
        "What are the alternatives?",
        "How does this compare to other approaches?",
        "What should I do next?",
        "Are there any gotchas I should know about?",
      ],
    };

    // Determine context based on current page
    let contextKey = "general";
    if (currentPath.includes("getting-started")) contextKey = "gettingStarted";
    else if (currentPath.includes("configuration")) contextKey = "configuration";
    else if (currentPath.includes("api")) contextKey = "api";
    else if (currentPath.includes("tips")) contextKey = "tips";
    else if (currentPath.includes("resources")) contextKey = "resources";

    // If we have messages, add follow-up questions
    const hasMessages = messages.length > 0;

    // Build the recommendation pool
    let pool: string[] = [];

    if (hasMessages) {
      // Prioritize follow-up questions when there's conversation context
      pool = [...(baseRecommendations.followUp ?? []), ...(baseRecommendations[contextKey] ?? []), ...(baseRecommendations.general ?? [])];
    } else {
      // Start with context-specific, then general
      pool = [...(baseRecommendations[contextKey] ?? []), ...(baseRecommendations.general ?? [])];
    }

    // Remove duplicates and shuffle
    pool = [...new Set(pool)].sort(() => Math.random() - 0.5);

    return pool;
  }, [pathname, messages.length]);

  // Keep ref updated for use in sendMessage (which is defined before this)
  useEffect(() => {
    generateRecommendationsRef.current = generateRecommendations;
  }, [generateRecommendations]);

  // Show next set of recommendations (for "Something else")
  const showNextRecommendations = useCallback(() => {
    const pool = recommendationPool.length > 0 ? recommendationPool : generateRecommendations();

    // Get next 3 recommendations (excluding current ones)
    const currentSet = new Set(recommendations);
    const available = pool.filter(r => !currentSet.has(r));

    if (available.length < 3) {
      // Reset pool if we've shown most recommendations
      const newPool = generateRecommendations();
      setRecommendationPool(newPool);
      setRecommendations(newPool.slice(0, 3));
    } else {
      setRecommendations(available.slice(0, 3));
      setRecommendationPool(available.slice(3));
    }
    setShowRecommendations(true);
  }, [recommendationPool, recommendations, generateRecommendations]);

  // Handle clicking a recommendation
  const handleRecommendationClick = useCallback((recommendation: string) => {
    // Hide recommendations
    setShowRecommendations(false);
    setRecommendations([]);
    // Send the recommendation as if user typed it
    sendMessage(recommendation);
    track("assistant_recommendation_clicked", { recommendation: recommendation.substring(0, 50) });
  }, [sendMessage]);

  // Export conversation as markdown file
  const handleExportConversation = useCallback(() => {
    if (messages.length === 0) return;

    track("assistant_chat_exported", { messageCount: messages.length });

    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString("en-US", { hour12: false }).replace(/:/g, "-");
    const filename = `claude-insider-chat-${date}-${time}.md`;

    let markdown = `# Claude Insider Assistant Chat\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((message) => {
      if (message.role === "user") {
        markdown += `## You\n\n${message.content}\n\n`;
      } else {
        markdown += `## Assistant\n\n${message.content}\n\n`;
      }
    });

    markdown += `---\n\n*Exported from [Claude Insider](https://www.claudeinsider.com)*\n`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [messages]);

  // Stop any ongoing speech (TTS) including streaming queue
  const stopSpeaking = useCallback(() => {
    // Stop streaming TTS queue
    stopStreamingTTS();
    // Stop any audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Stop browser speech synthesis
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
  }, [stopStreamingTTS]);

  // Toggle voice recording
  const toggleVoiceRecording = useCallback(() => {
    if (!speechSupported) {
      setError("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      // Stop listening
      recognizerRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    // Track voice input started
    track("assistant_voice_input_started");

    // Stop any ongoing speech when user starts talking
    stopSpeaking();

    // Start listening
    if (!recognizerRef.current) {
      recognizerRef.current = new VoiceRecognizer({
        language: "en-US",
        continuous: false,
        interimResults: true,
        onResult: (transcript, isFinal) => {
          // Stop any TTS when user speaks
          stopSpeaking();

          if (isFinal) {
            setInput(transcript);
            setInterimTranscript("");
            setIsListening(false);
            // Auto-send after final result
            setTimeout(() => {
              sendMessage(transcript);
            }, 100);
          } else {
            setInterimTranscript(transcript);
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setIsListening(false);
          setInterimTranscript("");
        },
        onStart: () => {
          setIsListening(true);
          setError(null);
          // Stop any ongoing speech when voice input starts
          stopSpeaking();
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }

    recognizerRef.current.start();
  }, [speechSupported, isListening, sendMessage, stopSpeaking]);

  // Browser-native TTS fallback
  const speakWithBrowserTTS = useCallback((text: string, messageIndex: number) => {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in your browser");
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) || voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Samantha")
    ) || voices.find(
      (v) => v.lang.startsWith("en")
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageIndex(messageIndex);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Text-to-speech function with ElevenLabs + browser fallback
  // Includes caching to avoid regenerating audio on replay
  const speakMessage = useCallback(async (text: string, messageIndex: number) => {
    // Check if we're currently speaking THIS message - check BEFORE stopping anything
    // Use audioRef to detect if audio is actively playing (not just queued)
    const isAudioPlaying = audioRef.current !== null && !audioRef.current.paused;
    const isCurrentlySpeakingThisMessage =
      speakingMessageIndex === messageIndex &&
      (isAudioPlaying || isSpeakingQueueRef.current);

    // If clicking the same message that's currently playing, just stop (toggle off)
    if (isCurrentlySpeakingThisMessage) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      speechQueueRef.current = [];
      isSpeakingQueueRef.current = false;
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      setIsTTSLoading(false);
      return;
    }

    // Stop any OTHER audio that might be playing (different message)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    isSpeakingQueueRef.current = false;

    // Track TTS playback
    track("assistant_tts_played", { voice: selectedVoice, textLength: text.length });

    setIsSpeaking(true);
    setSpeakingMessageIndex(messageIndex);

    // Create cache key using text content and voice
    const cacheKey = `${selectedVoice}:${text}`;
    const cachedAudioUrl = audioCacheRef.current.get(cacheKey);

    // Helper function to play audio from URL
    const playAudioFromUrl = (audioUrl: string, isCached: boolean) => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        setIsTTSLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
        setIsTTSLoading(false);
        // Note: Don't revoke cached URLs - they'll be reused for replay
      };

      audio.onerror = () => {
        // Fallback to browser TTS on audio error
        console.warn("Audio playback failed, falling back to browser TTS");
        if (!isCached) {
          URL.revokeObjectURL(audioUrl);
          audioCacheRef.current.delete(cacheKey);
        }
        setIsTTSLoading(false);
        speakWithBrowserTTS(text, messageIndex);
      };

      audio.play().catch((err) => {
        console.error("Audio play error:", err);
        setIsTTSLoading(false);
        speakWithBrowserTTS(text, messageIndex);
      });
    };

    // Use cached audio if available
    if (cachedAudioUrl) {
      console.log("[TTS] Using cached audio");
      setIsTTSLoading(false);
      playAudioFromUrl(cachedAudioUrl, true);
      return;
    }

    // No cache - fetch from API
    setIsTTSLoading(true);

    try {
      // Try ElevenLabs TTS first
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markdownToSpeakableText(text), voice: selectedVoice }),
      });

      if (!response.ok) {
        // Fallback to browser TTS
        console.warn("ElevenLabs TTS failed, falling back to browser TTS");
        setIsTTSLoading(false);
        speakWithBrowserTTS(text, messageIndex);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the audio URL for future replays
      audioCacheRef.current.set(cacheKey, audioUrl);
      console.log("[TTS] Audio cached for reuse");

      playAudioFromUrl(audioUrl, false);
    } catch (err) {
      console.error("TTS error:", err);
      setIsTTSLoading(false);
      // Fallback to browser TTS
      speakWithBrowserTTS(text, messageIndex);
    }
  }, [speakingMessageIndex, speakWithBrowserTTS, selectedVoice]);

  // Cleanup audio, speech synthesis, and recognizer on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
    };
  }, []);

  const suggestedQuestions = getSuggestedQuestions(pathname);

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button with Tooltip */}
      <div
        className={`fixed right-6 z-40 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"} transition-all`}
        style={{
          // Position above mobile bottom navigation
          bottom: "calc(1.5rem + var(--mobile-nav-height, 0px))",
        }}
      >
        {/* Tooltip Balloon */}
        <div className="absolute bottom-full right-0 mb-3 animate-bounce">
          <div className="relative rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow-lg dark:bg-gray-800 dark:text-white whitespace-nowrap">
            <span className="font-semibold text-blue-500 dark:text-cyan-400">AI Assistant</span>
            <span className="text-gray-600 dark:text-gray-300"> (Cmd + .)</span>
            {/* Arrow - inline styles override global border-color rule */}
            <div
              className="absolute -bottom-2 right-6 h-0 w-0 dark:hidden"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid white",
              }}
            />
            {/* Dark mode arrow */}
            <div
              className="absolute -bottom-2 right-6 h-0 w-0 hidden dark:block"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid rgb(31, 41, 55)",
              }}
            />
          </div>
        </div>

        {/* Main Button */}
        <button
          ref={triggerButtonRef}
          onClick={() => {
            setIsOpen(true);
            track("assistant_opened", { page: pathname });
            announce("AI Assistant opened");
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          aria-label="Open AI Assistant"
          title="AI Assistant/Chat (Cmd + .)"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      </div>

      {/* Fullscreen backdrop */}
      {isOpen && isFullscreen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
          aria-hidden="true"
        />
      )}

      {/* Assistant Panel */}
      <div
        ref={assistantContainerRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        className={`fixed z-50 flex flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out dark:border-gray-700 dark:bg-gray-900 ${
          isFullscreen
            ? "inset-4 sm:inset-8 md:inset-12 lg:inset-16 rounded-2xl"
            : "bottom-0 right-0 h-[700px] w-full max-w-md rounded-t-2xl sm:bottom-6 sm:right-6 sm:rounded-2xl"
        } ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header - Compact design with settings icon */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Conversations/History button */}
            <button
              onClick={() => setShowConversationList(!showConversationList)}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white transition-colors ${
                showConversationList ? "bg-white/30" : "bg-white/20 hover:bg-white/30"
              }`}
              title="View conversation history"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="hidden sm:inline">History</span>
              {conversations.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-bold text-gray-900">
                  {conversations.length}
                </span>
              )}
            </button>
            <h2 className="font-semibold text-white truncate max-w-[180px]" title={customAssistantName || "Claude AI Assistant"}>
              {customAssistantName || "Claude AI Assistant"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-lg p-2 transition-colors ${
                showSettings
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              title="Settings"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* Fullscreen/Minimize toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              title={isFullscreen ? "Minimize" : "Expand fullscreen"}
            >
              {isFullscreen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
            {/* Close button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsFullscreen(false);
                setShowSettings(false);
                setShowConversationList(false);
              }}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              title="Close (Esc)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings Panel - slides in from right */}
        {showSettings && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
            {/* Settings Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Back to chat"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Assistant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Assistant Name
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Give your assistant a custom name
                </p>
                {showNameInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameInputValue}
                      onChange={(e) => setNameInputValue(e.target.value)}
                      placeholder="Enter a name..."
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveAssistantName();
                        if (e.key === "Escape") {
                          setShowNameInput(false);
                          setNameInputValue("");
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAssistantName}
                      className="rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white transition-all hover:scale-105"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowNameInput(false);
                        setNameInputValue("");
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customAssistantName || DEFAULT_ASSISTANT_NAME}
                      </div>
                      {customAssistantName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Custom name</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNameInputValue(customAssistantName);
                          setShowNameInput(true);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        title="Edit name"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {customAssistantName && (
                        <button
                          onClick={() => {
                            setAssistantName("");
                            setCustomAssistantName("");
                            announce("Assistant name reset to default");
                            track("assistant_name_reset");
                          }}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                          title="Reset to default"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Your Name
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Tell me your name for a personalized experience. Your name is stored only on your device and never shared.
                </p>
                {showUserNameInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userNameInputValue}
                      onChange={(e) => setUserNameInputValue(e.target.value)}
                      placeholder="Enter your name..."
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveUserName();
                        if (e.key === "Escape") {
                          setShowUserNameInput(false);
                          setUserNameInputValue("");
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUserName}
                      className="rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white transition-all hover:scale-105"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowUserNameInput(false);
                        setUserNameInputValue("");
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-600 dark:bg-gray-800">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {userName || "Not set"}
                      </div>
                      {userName ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">I&apos;ll use your name in conversations</div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">I&apos;ll ask for your name when we chat</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUserNameInputValue(userName);
                          setShowUserNameInput(true);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        title="Edit your name"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {userName && (
                        <button
                          onClick={() => {
                            setUserName("");
                            setUserNameState("");
                            announce("Your name has been cleared");
                            track("user_name_cleared");
                          }}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                          title="Clear your name"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Voice
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select a voice for text-to-speech responses
                </p>
                <div className="relative" ref={voiceMenuRef}>
                  <button
                    onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {voices.find(v => v.id === selectedVoice)?.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {voices.find(v => v.id === selectedVoice)?.description}
                      </div>
                    </div>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${showVoiceMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Voice dropdown */}
                  {showVoiceMenu && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                      {voices.map((voice) => (
                        <div
                          key={voice.id}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            selectedVoice === voice.id
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <button
                            onClick={() => {
                              setSelectedVoice(voice.id);
                              setShowVoiceMenu(false);
                              track("assistant_voice_changed", { voice: voice.id, voiceName: voice.name });
                            }}
                            className="flex-1 text-left"
                          >
                            <div className={`font-medium ${selectedVoice === voice.id ? "text-blue-600 dark:text-cyan-400" : "text-gray-900 dark:text-white"}`}>
                              {voice.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{voice.description}</div>
                          </button>
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={(e) => previewVoice(voice.id, e)}
                              className={`p-1.5 rounded-full transition-colors ${
                                previewingVoice === voice.id
                                  ? "bg-blue-500 text-white"
                                  : "hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              }`}
                              title={previewingVoice === voice.id ? "Stop preview" : "Preview voice"}
                            >
                              {previewingVoice === voice.id ? (
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                              ) : (
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                            {selectedVoice === voice.id && (
                              <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-speak Toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Auto-speak responses
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Automatically read assistant responses aloud
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoSpeak;
                      setAutoSpeak(newValue);
                      track("assistant_autospeak_toggled", { enabled: newValue });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoSpeak ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoSpeak ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Conversation Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Conversation
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleExportConversation();
                      setShowSettings(false);
                    }}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Export conversation</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Download as Markdown file</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleClearHistory();
                      setShowSettings(false);
                    }}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-3 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/50 dark:bg-gray-800 dark:hover:bg-red-900/20"
                  >
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div>
                      <div className="font-medium text-red-600 dark:text-red-400">Clear conversation</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Delete all messages</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Settings Footer */}
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Powered by Claude AI
              </p>
            </div>
          </div>
        )}

        {/* Conversation List Panel */}
        {showConversationList && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
            {/* Conversation List Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Conversations</h3>
              <div className="flex items-center gap-2">
                {/* New conversation button */}
                <button
                  onClick={handleNewConversation}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-105"
                  title="Start new conversation"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </button>
                {/* Close button */}
                <button
                  onClick={() => setShowConversationList(false)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  title="Back to chat"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conversation List Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {conversations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Start a new conversation to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`group w-full rounded-lg border p-3 text-left transition-all hover:border-blue-500/50 hover:shadow-md ${
                        activeConversationId === conv.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${
                            activeConversationId === conv.id
                              ? "text-blue-600 dark:text-cyan-400"
                              : "text-gray-900 dark:text-white"
                          }`}>
                            {conv.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} · {formatConversationTime(conv.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-100 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/30"
                          title="Delete conversation"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation List Footer */}
            {conversations.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <button
                  onClick={handleClearAllConversations}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear all conversations
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 select-text">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
                <svg
                  className="h-8 w-8 text-blue-500 dark:text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                How can I help you?
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Ask me anything about the documentation
              </p>

              {/* Suggested Questions */}
              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Suggested questions:
                </p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 select-text overflow-hidden ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white"
                        : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm select-text cursor-text">
                      {message.role === "assistant" ? (
                        <LinkifiedText text={markdownToDisplayText(message.content)} />
                      ) : (
                        message.content
                      )}
                    </p>
                    {/* Action buttons for assistant messages */}
                    {message.role === "assistant" && (
                      <div className="mt-2 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 pt-2">
                        {/* Copy button */}
                        <button
                          onClick={() => copyToClipboard(message.content, index)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            copiedMessageIndex === index
                              ? "text-green-500"
                              : "text-gray-400 hover:text-cyan-500"
                          }`}
                          title={copiedMessageIndex === index ? "Copied!" : "Copy to clipboard"}
                        >
                          {copiedMessageIndex === index ? (
                            <>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        {/* Speaker button */}
                        <button
                          onClick={() => speakMessage(message.content, index)}
                          disabled={isTTSLoading && speakingMessageIndex !== index}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            speakingMessageIndex === index
                              ? "text-cyan-500"
                              : "text-gray-400 hover:text-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                          title={speakingMessageIndex === index && isTTSLoading ? "Loading..." : speakingMessageIndex === index ? "Stop speaking" : "Read aloud"}
                        >
                          {speakingMessageIndex === index && isTTSLoading ? (
                            <>
                              <svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Loading...</span>
                            </>
                          ) : speakingMessageIndex === index ? (
                            <>
                              <svg
                                className="h-4 w-4 animate-pulse"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                              </svg>
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                              </svg>
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming response */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 dark:bg-gray-800 select-text overflow-hidden">
                    <p className="whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-white select-text cursor-text">
                      <LinkifiedText text={markdownToDisplayText(streamingContent)} />
                    </p>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Recommendations - shown below last message */}
              {showRecommendations && recommendations.length > 0 && !isLoading && !streamingContent && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Suggested follow-ups:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec, index) => (
                      <button
                        key={`${rec}-${index}`}
                        onClick={() => handleRecommendationClick(rec)}
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700 transition-all hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-cyan-400"
                      >
                        {rec}
                      </button>
                    ))}
                    <button
                      onClick={showNextRecommendations}
                      className="rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 transition-all hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
                    >
                      More...
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          {/* Listening indicator */}
          {isListening && (
            <div className="mb-3 flex items-center gap-2 text-sm text-cyan-500">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                <span>Listening...</span>
              </div>
              {interimTranscript && (
                <span className="text-gray-400 italic truncate">
                  &quot;{interimTranscript}&quot;
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Microphone button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                } disabled:opacity-50`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={isListening ? interimTranscript || input : input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Speak now..." : "Ask a question..."}
              disabled={isLoading || isListening}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || isListening || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 disabled:scale-100 disabled:opacity-50"
              title="Send message"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Powered by Claude AI</span>
            <span>
              <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
                Cmd + .
              </kbd>{" "}
              to toggle
            </span>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
