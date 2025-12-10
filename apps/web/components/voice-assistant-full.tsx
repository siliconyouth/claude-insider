"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import type { Message } from "@/lib/claude-utils";
import { markdownToSpeakableText, markdownToDisplayText } from "@/lib/claude-utils";
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

export function VoiceAssistantFull() {
  const [mounted, setMounted] = useState(false);
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

  // Available ElevenLabs voices
  const voices = useMemo(() => [
    { id: "sarah", name: "Sarah", description: "Soft, young female" },
    { id: "rachel", name: "Rachel", description: "Calm, young female" },
    { id: "emily", name: "Emily", description: "Calm, young female" },
    { id: "matilda", name: "Matilda", description: "Warm, young female" },
    { id: "daniel", name: "Daniel", description: "Deep, authoritative" },
    { id: "brian", name: "Brian", description: "Deep, middle-aged" },
    { id: "josh", name: "Josh", description: "Deep, young male" },
    { id: "liam", name: "Liam", description: "Articulate, male" },
  ], []);

  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);
  const lastSpokenIndexRef = useRef(0);
  const streamingCompleteRef = useRef(false);
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

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Preview a voice
  const previewVoice = useCallback(async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
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
      if (!response.ok) throw new Error("Failed to preview voice");
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

  const selectedVoiceRef = useRef(selectedVoice);
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  const getPreferredVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
           voices.find((v) => v.lang.startsWith("en") && v.name.includes("Samantha")) ||
           voices.find((v) => v.lang.startsWith("en")) ||
           null;
  }, []);

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

  const processSpeechQueue = useCallback(async () => {
    if (isSpeakingQueueRef.current) return;
    if (speechQueueRef.current.length === 0) {
      if (streamingCompleteRef.current) {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      }
      return;
    }
    const textToSpeak = speechQueueRef.current.join(" ");
    speechQueueRef.current = [];
    if (!textToSpeak.trim()) {
      if (streamingCompleteRef.current) {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      }
      return;
    }
    isSpeakingQueueRef.current = true;
    setIsSpeaking(true);
    try {
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markdownToSpeakableText(textToSpeak), voice: selectedVoiceRef.current }),
      });
      if (!response.ok) {
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
      speakWithBrowserTTSQueue(textToSpeak, () => {
        processSpeechQueue();
      });
    }
  }, [speakWithBrowserTTSQueue]);

  const splitIntoSentences = useCallback((text: string): string[] => {
    const sentences: string[] = [];
    let current = "";
    let i = 0;
    const pushCurrent = () => {
      const trimmed = current.trim();
      if (trimmed.length > 0) sentences.push(trimmed);
      current = "";
    };
    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === "\n" && nextChar === "\n") {
        current += char;
        pushCurrent();
        while (text[i + 1] === "\n") i++;
        i++;
        continue;
      }
      current += char;
      if (char === "." || char === "!" || char === "?") {
        const isRealEnd = nextChar === undefined || nextChar === " " || nextChar === "\n";
        if (isRealEnd) {
          while (text[i + 1] === " ") i++;
          pushCurrent();
        }
      }
      i++;
    }
    pushCurrent();
    return sentences;
  }, []);

  const stopStreamingTTS = useCallback(() => {
    speechQueueRef.current = [];
    isSpeakingQueueRef.current = false;
    lastSpokenIndexRef.current = 0;
    streamingCompleteRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
  }, []);

  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      track("assistant_message_sent", { page: pathname, messageLength: content.trim().length });
      setError(null);
      setIsLoading(true);
      setStreamingContent("");
      stopStreamingTTS();
      lastSpokenIndexRef.current = 0;
      streamingCompleteRef.current = false;
      const userMessage: Message = { role: "user", content: content.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      const assistantMessageIndex = updatedMessages.length;
      try {
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
                  if (autoSpeakRef.current) {
                    const sentences = splitIntoSentences(assistantContent);
                    const newSentences = sentences.slice(lastSpokenIndexRef.current);
                    if (newSentences.length > 0) {
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
                // Ignore parse errors
              }
            }
          }
        }
        streamingCompleteRef.current = true;
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
        if (assistantContent) {
          const assistantMessage: Message = { role: "assistant", content: assistantContent };
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

  const handleExportConversation = useCallback(() => {
    if (messages.length === 0) return;
    track("assistant_chat_exported", { messageCount: messages.length });
    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString("en-US", { hour12: false }).replace(/:/g, "-");
    const filename = `claude-insider-chat-${date}-${time}.md`;
    let markdown = `# Claude Insider Assistant Chat\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n---\n\n`;
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

  const stopSpeaking = useCallback(() => {
    stopStreamingTTS();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
  }, [stopStreamingTTS]);

  const toggleVoiceRecording = useCallback(() => {
    if (!speechSupported) {
      setError("Speech recognition is not supported in your browser");
      return;
    }
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
      return;
    }
    track("assistant_voice_input_started");
    stopSpeaking();
    if (!recognizerRef.current) {
      recognizerRef.current = new VoiceRecognizer({
        language: "en-US",
        continuous: false,
        interimResults: true,
        onResult: (transcript, isFinal) => {
          stopSpeaking();
          if (isFinal) {
            setInput(transcript);
            setInterimTranscript("");
            setIsListening(false);
            setTimeout(() => sendMessage(transcript), 100);
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
          stopSpeaking();
        },
        onEnd: () => setIsListening(false),
      });
    }
    recognizerRef.current.start();
  }, [speechSupported, isListening, sendMessage, stopSpeaking]);

  const speakWithBrowserTTS = useCallback((text: string, messageIndex: number) => {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in your browser");
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    const preferredVoice = getPreferredVoice();
    if (preferredVoice) utterance.voice = preferredVoice;
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
  }, [getPreferredVoice]);

  const speakMessage = useCallback(async (text: string, messageIndex: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isSpeaking && speakingMessageIndex === messageIndex) {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      setIsTTSLoading(false);
      return;
    }
    track("assistant_tts_played", { voice: selectedVoice, textLength: text.length });
    setIsSpeaking(true);
    setSpeakingMessageIndex(messageIndex);
    setIsTTSLoading(true);
    try {
      const response = await fetch("/api/assistant/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markdownToSpeakableText(text), voice: selectedVoice }),
      });
      if (!response.ok) {
        setIsTTSLoading(false);
        speakWithBrowserTTS(text, messageIndex);
        return;
      }
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.oncanplaythrough = () => setIsTTSLoading(false);
      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
        setIsTTSLoading(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsTTSLoading(false);
        speakWithBrowserTTS(text, messageIndex);
      };
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsTTSLoading(false);
      speakWithBrowserTTS(text, messageIndex);
    }
  }, [isSpeaking, speakingMessageIndex, speakWithBrowserTTS, selectedVoice]);

  // Cleanup
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

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white">Claude Insider Assistant</h2>
            <p className="text-xs text-white/80">Powered by Claude AI + ElevenLabs</p>
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{voices.find(v => v.id === selectedVoice)?.name}</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showVoiceMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Select Voice</div>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedVoice === voice.id ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-cyan-400" : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedVoice(voice.id);
                          setShowVoiceMenu(false);
                          track("assistant_voice_changed", { voice: voice.id });
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{voice.description}</div>
                      </button>
                      <button
                        onClick={(e) => previewVoice(voice.id, e)}
                        className={`p-1.5 rounded-full transition-colors ml-2 ${
                          previewingVoice === voice.id ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                        }`}
                        title="Preview voice"
                      >
                        {previewingVoice === voice.id ? (
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Auto-speak toggle */}
          <button
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              track("assistant_autospeak_toggled", { enabled: !autoSpeak });
            }}
            className={`rounded-lg p-2 transition-colors ${autoSpeak ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            title={autoSpeak ? "Auto-speak: ON" : "Auto-speak: OFF"}
          >
            <svg className="h-5 w-5" fill={autoSpeak ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          {messages.length > 0 && (
            <>
              <button onClick={handleExportConversation} className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white" title="Export" aria-label="Export conversation">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button onClick={handleClearHistory} className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white" title="Clear" aria-label="Clear conversation history">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
              <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 font-medium text-gray-900 dark:text-white">How can I help you?</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Ask me anything about Claude AI, Claude Code, or the documentation</p>
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Suggested questions:</p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-cyan-600 dark:hover:bg-blue-900/20"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                }`}>
                  <p className="whitespace-pre-wrap text-sm">
                    {message.role === "assistant" ? markdownToDisplayText(message.content) : message.content}
                  </p>
                  {message.role === "assistant" && (
                    <button
                      onClick={() => speakMessage(message.content, index)}
                      disabled={isTTSLoading && speakingMessageIndex !== index}
                      className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                        speakingMessageIndex === index ? "text-cyan-500" : "text-gray-400 hover:text-cyan-500"
                      }`}
                    >
                      {speakingMessageIndex === index && isTTSLoading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading...</span>
                        </>
                      ) : speakingMessageIndex === index ? (
                        <>
                          <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2 dark:bg-gray-800">
                  <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">{markdownToDisplayText(streamingContent)}</p>
                </div>
              </div>
            )}
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
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        {isListening && (
          <div className="mb-3 flex items-center gap-2 text-sm text-cyan-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
            <span>Listening...</span>
            {interimTranscript && <span className="text-gray-400 italic truncate">&quot;{interimTranscript}&quot;</span>}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
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
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white transition-all hover:scale-105 disabled:scale-100 disabled:opacity-50"
            title="Send message"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
