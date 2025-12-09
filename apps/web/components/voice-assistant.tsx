"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
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
  const [selectedVoice, setSelectedVoice] = useState<string>("sarah");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);

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

  // Available ElevenLabs voices (all pre-made voices)
  const voices = [
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

  // Initialize speech recognition
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
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

  // Ref for autoSpeak to avoid stale closure in sendMessage
  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Track message sent
      track("assistant_message_sent", { page: pathname, messageLength: content.trim().length });

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

                  // Stream TTS: speak sentences as they complete during streaming
                  if (autoSpeakRef.current) {
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

        // Queue any remaining text that wasn't spoken during streaming
        if (autoSpeakRef.current && assistantContent.trim()) {
          const sentences = splitIntoSentences(assistantContent);
          const remainingSentences = sentences.slice(lastSpokenIndexRef.current);
          if (remainingSentences.length > 0) {
            setSpeakingMessageIndex(assistantMessageIndex);
            remainingSentences.forEach(sentence => {
              speechQueueRef.current.push(sentence);
            });
            processSpeechQueue();
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
    [messages, isLoading, pathname, stopStreamingTTS, splitIntoSentences, processSpeechQueue]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClearHistory = () => {
    track("assistant_history_cleared", { messageCount: messages.length });
    setMessages([]);
    clearConversationHistory();
  };

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
      setIsTTSLoading(false);
      return;
    }

    // Track TTS playback
    track("assistant_tts_played", { voice: selectedVoice, textLength: text.length });

    setIsSpeaking(true);
    setSpeakingMessageIndex(messageIndex);
    setIsTTSLoading(true);

    try {
      // Try ElevenLabs TTS first
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice }),
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

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        setIsTTSLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
        setIsTTSLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        // Fallback to browser TTS on audio error
        console.warn("Audio playback failed, falling back to browser TTS");
        URL.revokeObjectURL(audioUrl);
        setIsTTSLoading(false);
        speakWithBrowserTTS(text, messageIndex);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsTTSLoading(false);
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
        <div className="absolute bottom-full right-0 mb-3 w-56 animate-bounce">
          <div className="relative rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow-lg dark:bg-gray-800 dark:text-white">
            <span className="font-semibold text-orange-500">AI Assistant</span>
            <span className="text-gray-600 dark:text-gray-300"> (Cmd + . or click)</span>
            {/* Arrow */}
            <div className="absolute -bottom-2 right-6 h-0 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800" />
          </div>
        </div>

        {/* Main Button */}
        <button
          onClick={() => {
            setIsOpen(true);
            track("assistant_opened", { page: pathname });
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          aria-label="Open AI Assistant"
          title="AI Assistant (Cmd + . or click to activate)"
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
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Select Voice
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {voices.length} voices available
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {voices.map((voice) => (
                      <div
                        key={voice.id}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedVoice === voice.id
                            ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                            : "text-gray-700 dark:text-gray-300"
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
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{voice.description}</div>
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          {/* Preview button */}
                          <button
                            onClick={(e) => previewVoice(voice.id, e)}
                            className={`p-1.5 rounded-full transition-colors ${
                              previewingVoice === voice.id
                                ? "bg-orange-500 text-white"
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
                          {/* Checkmark for selected voice */}
                          {selectedVoice === voice.id && (
                            <svg className="h-4 w-4 flex-shrink-0 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auto-speak toggle */}
            <button
              onClick={() => {
                const newValue = !autoSpeak;
                setAutoSpeak(newValue);
                track("assistant_autospeak_toggled", { enabled: newValue });
              }}
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
              <>
                <button
                  onClick={handleExportConversation}
                  className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  title="Export conversation"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
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
              </>
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
                        disabled={isTTSLoading && speakingMessageIndex !== index}
                        className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                          speakingMessageIndex === index
                            ? "text-orange-500"
                            : "text-gray-400 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
