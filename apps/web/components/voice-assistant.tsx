"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { Message } from "@/lib/claude";
import {
  getConversationHistory,
  saveConversationHistory,
  clearConversationHistory,
  getPageContent,
  getVisibleSection,
  getSuggestedQuestions,
} from "@/lib/assistant-context";
import {
  VoiceRecognizer,
  isSpeechRecognitionSupported,
} from "@/lib/speech-recognition";
import {
  WakeWordDetector,
  isWakeWordSupported,
} from "@/lib/wake-word";

interface StreamEvent {
  type: "text" | "done" | "error";
  content?: string;
}

export function VoiceAssistant() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>("nova");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Available OpenAI TTS voices
  const voices = [
    { id: "alloy", name: "Alloy", description: "Neutral & balanced" },
    { id: "echo", name: "Echo", description: "Warm & clear" },
    { id: "fable", name: "Fable", description: "Expressive & dramatic" },
    { id: "onyx", name: "Onyx", description: "Deep & authoritative" },
    { id: "nova", name: "Nova", description: "Friendly & upbeat" },
    { id: "shimmer", name: "Shimmer", description: "Soft & gentle" },
  ];
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Streaming TTS state
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);
  const lastSpokenIndexRef = useRef(0);
  const streamingCompleteRef = useRef(false); // Track if streaming is done

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Load conversation history on mount
  useEffect(() => {
    const history = getConversationHistory();
    if (history.length > 0) {
      setMessages(history);
    }
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory(messages);
    }
  }, [messages]);

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

  // Initialize speech recognition and wake word support
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
    // Check if wake word is supported
    if (isWakeWordSupported()) {
      setWakeWordEnabled(true);
    }
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

  // Process speech queue - simple sequential processing, one audio at a time
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
        body: JSON.stringify({ text: textToSpeak, voice: selectedVoiceRef.current }),
      });

      if (!response.ok) {
        // Fallback to browser TTS
        speakWithBrowserTTSQueue(textToSpeak, () => {
          isSpeakingQueueRef.current = false;
          processSpeechQueue();
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
        // Process next chunk if available
        if (speechQueueRef.current.length > 0) {
          processSpeechQueue();
        } else if (streamingCompleteRef.current) {
          setIsSpeaking(false);
          setSpeakingMessageIndex(null);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        isSpeakingQueueRef.current = false;
        processSpeechQueue();
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      isSpeakingQueueRef.current = false;
      // Fallback to browser TTS
      speakWithBrowserTTSQueue(textToSpeak, () => {
        processSpeechQueue();
      });
    }
  }, [speakWithBrowserTTSQueue]);

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

  // Add text to speech queue (splits by sentences)
  const queueSpeech = useCallback((text: string) => {
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
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Ref to store toggleVoiceRecording for wake word callback
  const toggleVoiceRecordingRef = useRef<(() => void) | null>(null);

  // Initialize wake word detector
  useEffect(() => {
    if (!wakeWordEnabled || !mounted) return;

    // Only initialize if not already initialized
    if (!wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current = new WakeWordDetector({
        onWakeWord: () => {
          // Wake word detected! Open the assistant and start voice recording
          setIsOpen(true);
          // Small delay to ensure the panel is open before starting voice
          setTimeout(() => {
            toggleVoiceRecordingRef.current?.();
          }, 300);
        },
        onError: (error) => {
          console.warn("Wake word error:", error);
        },
        onListeningChange: (listening) => {
          setWakeWordListening(listening);
        },
      });
    }

    // Start wake word detection when assistant is closed
    if (!isOpen && !isListening && !isSpeaking) {
      wakeWordDetectorRef.current.resume();
    } else {
      // Pause wake word detection when assistant is open or speaking
      wakeWordDetectorRef.current.pause();
    }

    return () => {
      // Don't destroy on every effect, just pause
      wakeWordDetectorRef.current?.pause();
    };
  }, [wakeWordEnabled, mounted, isOpen, isListening, isSpeaking]);

  // Cleanup wake word detector on unmount
  useEffect(() => {
    return () => {
      wakeWordDetectorRef.current?.destroy();
      wakeWordDetectorRef.current = null;
    };
  }, []);

  // Ref for autoSpeak to avoid stale closure in sendMessage
  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);
      setStreamingContent("");

      // Reset streaming TTS state
      stopStreamingTTS();
      lastSpokenIndexRef.current = 0;
      streamingCompleteRef.current = false;

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

        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            currentPage: pathname,
            pageContent,
            visibleSection,
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
                  // Don't speak during streaming - wait for complete message
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

        // Auto-speak the complete message (not during streaming to avoid pauses)
        if (autoSpeakRef.current && assistantContent.trim()) {
          setSpeakingMessageIndex(assistantMessageIndex);
          setIsSpeaking(true);

          try {
            const ttsResponse = await fetch("/api/assistant/speak", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: assistantContent, voice: selectedVoiceRef.current }),
            });

            if (ttsResponse.ok) {
              const audioBlob = await ttsResponse.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              audioRef.current = audio;

              audio.onended = () => {
                setIsSpeaking(false);
                setSpeakingMessageIndex(null);
                URL.revokeObjectURL(audioUrl);
              };

              audio.onerror = () => {
                setIsSpeaking(false);
                setSpeakingMessageIndex(null);
                URL.revokeObjectURL(audioUrl);
              };

              await audio.play();
            } else {
              setIsSpeaking(false);
              setSpeakingMessageIndex(null);
            }
          } catch {
            setIsSpeaking(false);
            setSpeakingMessageIndex(null);
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        stopStreamingTTS();
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [messages, isLoading, pathname, stopStreamingTTS]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClearHistory = () => {
    setMessages([]);
    clearConversationHistory();
  };

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

  // Keep toggleVoiceRecording ref updated for wake word callback
  useEffect(() => {
    toggleVoiceRecordingRef.current = toggleVoiceRecording;
  }, [toggleVoiceRecording]);

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

  // Text-to-speech function with OpenAI + browser fallback
  const speakMessage = useCallback(async (text: string, messageIndex: number) => {
    // Stop any currently playing audio or speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // If clicking the same message that's speaking, just stop
    if (isSpeaking && speakingMessageIndex === messageIndex) {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      return;
    }

    setIsSpeaking(true);
    setSpeakingMessageIndex(messageIndex);

    try {
      // Try OpenAI TTS first
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (!response.ok) {
        // Fallback to browser TTS
        console.warn("OpenAI TTS failed, falling back to browser TTS");
        speakWithBrowserTTS(text, messageIndex);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        // Fallback to browser TTS on audio error
        console.warn("Audio playback failed, falling back to browser TTS");
        URL.revokeObjectURL(audioUrl);
        speakWithBrowserTTS(text, messageIndex);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      // Fallback to browser TTS
      speakWithBrowserTTS(text, messageIndex);
    }
  }, [isSpeaking, speakingMessageIndex, speakWithBrowserTTS, selectedVoice]);

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
      <div className={`fixed bottom-6 right-6 z-40 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"} transition-all`}>
        {/* Tooltip Balloon */}
        <div className="absolute bottom-full right-0 mb-3 w-64 animate-bounce">
          <div className="relative rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow-lg dark:bg-gray-800 dark:text-white">
            {wakeWordEnabled && wakeWordListening ? (
              <>
                <span className="font-semibold text-orange-500">Say &quot;Hey Insider!&quot;</span>
                <span className="text-gray-600 dark:text-gray-300"> or Cmd + . or click</span>
                <div className="mt-1 flex items-center gap-1 text-xs text-green-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
                  Listening for wake word...
                </div>
              </>
            ) : (
              <>
                <span className="font-semibold text-orange-500">AI Assistant</span>
                <span className="text-gray-600 dark:text-gray-300"> (Cmd + . or click)</span>
              </>
            )}
            {/* Arrow */}
            <div className="absolute -bottom-2 right-6 h-0 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800" />
          </div>
        </div>

        {/* Main Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${wakeWordListening ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
          aria-label="Open AI Assistant"
          title={wakeWordEnabled ? "Say 'Hey Insider!' or Cmd + . or click" : "AI Assistant (Cmd + . or click)"}
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

      {/* Assistant Panel */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-gray-700 dark:bg-gray-900 sm:bottom-6 sm:right-6 sm:rounded-2xl ${
          isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-[calc(100%+2rem)]"
        }`}
        role="dialog"
        aria-label="AI Assistant"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-white">Claude Insider Assistant</h2>
              <p className="text-xs text-white/80">Powered by Claude AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Voice selector */}
            <div className="relative" ref={voiceMenuRef}>
              <button
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                title="Select voice"
              >
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
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <span className="hidden sm:inline">{voices.find(v => v.id === selectedVoice)?.name}</span>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Voice dropdown menu */}
              {showVoiceMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Select Voice
                  </div>
                  {voices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoice(voice.id);
                        setShowVoiceMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedVoice === voice.id
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{voice.description}</div>
                      </div>
                      {selectedVoice === voice.id && (
                        <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-speak toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`rounded-lg p-2 transition-colors ${
                autoSpeak
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
              title={autoSpeak ? "Auto-speak: ON" : "Auto-speak: OFF"}
            >
              <svg
                className="h-5 w-5"
                fill={autoSpeak ? "currentColor" : "none"}
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
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                title="Clear conversation"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
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

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
                <svg
                  className="h-8 w-8 text-orange-500"
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
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  Suggested questions:
                </p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-600 dark:hover:bg-orange-900/20"
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
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                        : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {/* Speaker button for assistant messages */}
                    {message.role === "assistant" && (
                      <button
                        onClick={() => speakMessage(message.content, index)}
                        className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                          speakingMessageIndex === index
                            ? "text-orange-500"
                            : "text-gray-400 hover:text-orange-500"
                        }`}
                        title={speakingMessageIndex === index ? "Stop speaking" : "Read aloud"}
                      >
                        {speakingMessageIndex === index ? (
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
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming response */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 dark:bg-gray-800">
                    <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                      {streamingContent}
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
            <div className="mb-3 flex items-center gap-2 text-sm text-orange-500">
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
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || isListening || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white transition-all hover:scale-105 disabled:scale-100 disabled:opacity-50"
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

          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            Press{" "}
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
              Cmd + .
            </kbd>{" "}
            to toggle
          </p>
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
