/**
 * Chat Page Content Component
 *
 * Full-page chat experience with AI assistant.
 * Includes @ mention autocomplete, voice support, and conversation history.
 */

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
  getActiveConversationId,
  setActiveConversationId,
  formatConversationTime,
  type Conversation,
} from "@/lib/assistant-storage";
import {
  VoiceRecognizer,
  isSpeechRecognitionSupported,
} from "@/lib/speech-recognition";
import { triggerCreditsRefresh } from "@/hooks/use-api-credits";
import { LinkifiedText } from "@/components/linkified-text";
import { MentionInput } from "./mention-input";
import { cn } from "@/lib/design-system";

interface StreamEvent {
  type: "text" | "done" | "error";
  content?: string;
}

export function ChatPageContent() {
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
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("sarah");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);
  const lastSpokenIndexRef = useRef(0);
  const streamingCompleteRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

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

  // Load preferences on mount
  useEffect(() => {
    setMounted(true);
    const savedVoice = localStorage.getItem("claude-insider-voice");
    const savedAutoSpeak = localStorage.getItem("claude-insider-auto-speak");
    if (savedVoice) setSelectedVoice(savedVoice);
    if (savedAutoSpeak !== null) setAutoSpeak(savedAutoSpeak === "true");

    // Load conversations
    const savedConversations = getAllConversations();
    setConversations(savedConversations);

    // Load active conversation
    const activeId = getActiveConversationId();
    if (activeId && savedConversations.some(c => c.id === activeId)) {
      setActiveConvId(activeId);
      const activeConv = savedConversations.find(c => c.id === activeId);
      if (activeConv) setMessages(activeConv.messages);
    }

    // Check speech recognition support
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Save preferences
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("claude-insider-voice", selectedVoice);
      localStorage.setItem("claude-insider-auto-speak", String(autoSpeak));
    }
  }, [selectedVoice, autoSpeak, mounted]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close voice menu on outside click
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

  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    }
  }, []);

  // Browser TTS fallback
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
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }, [getPreferredVoice]);

  // Stop streaming TTS
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

  // Process speech queue
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
    } catch {
      isSpeakingQueueRef.current = false;
      speakWithBrowserTTSQueue(textToSpeak, () => {
        processSpeechQueue();
      });
    }
  }, [speakWithBrowserTTSQueue]);

  // Split into sentences
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

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    track("chat_message_sent", { page: pathname, messageLength: content.trim().length });
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
      triggerCreditsRefresh();

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

        // Update conversation storage
        if (activeConversationId) {
          updateConversationMessages(activeConversationId, newMessages);
        } else {
          const newConv = createConversation();
          updateConversationMessages(newConv.id, newMessages);
          setActiveConvId(newConv.id);
          setActiveConversationId(newConv.id);
          setConversations(getAllConversations());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      stopStreamingTTS();
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  }, [messages, isLoading, pathname, activeConversationId, stopStreamingTTS, splitIntoSentences, processSpeechQueue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Stop speaking
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

  // Voice recording
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
    track("chat_voice_input_started");
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

  // Browser TTS
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

  // TTS for message
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
    track("chat_tts_played", { voice: selectedVoice, textLength: text.length });
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
    } catch {
      setIsTTSLoading(false);
      speakWithBrowserTTS(text, messageIndex);
    }
  }, [isSpeaking, speakingMessageIndex, speakWithBrowserTTS, selectedVoice]);

  // Preview voice
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
          text: "Hello! This is how I sound.",
          voice: voiceId,
        }),
      });
      if (!response.ok) throw new Error("Failed");
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
    } catch {
      setPreviewingVoice(null);
    }
  }, [previewingVoice]);

  // Conversation management
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setActiveConvId(null);
    setActiveConversationId(null);
    track("chat_new_conversation");
  }, []);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setMessages(conv.messages);
    setActiveConvId(conv.id);
    setActiveConversationId(conv.id);
    track("chat_conversation_selected");
  }, []);

  const handleDeleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
    setConversations(getAllConversations());
    if (activeConversationId === id) {
      setMessages([]);
      setActiveConvId(null);
      setActiveConversationId(null);
    }
    track("chat_conversation_deleted");
  }, [activeConversationId]);

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    if (activeConversationId) {
      updateConversationMessages(activeConversationId, []);
    }
    track("chat_history_cleared", { messageCount: messages.length });
  }, [activeConversationId, messages.length]);

  // Export conversation
  const handleExportConversation = useCallback(() => {
    if (messages.length === 0) return;
    track("chat_exported", { messageCount: messages.length });
    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString("en-US", { hour12: false }).replace(/:/g, "-");
    const filename = `claude-insider-chat-${date}-${time}.md`;
    let markdown = `# Claude Insider Chat\n\n`;
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
    <div className="flex-1 flex h-[calc(100vh-64px-80px)]">
      {/* Sidebar - Conversations */}
      {showSidebar && (
        <aside className="w-64 border-r border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-[#262626]">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No conversations yet
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group",
                      activeConversationId === conv.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-cyan-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatConversationTime(conv.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0a0a0a]">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#262626] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ask anything about Claude</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice selector */}
            <div className="relative" ref={voiceMenuRef}>
              <button
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {voices.find(v => v.id === selectedVoice)?.name}
              </button>
              {showVoiceMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {voices.map((voice) => (
                      <div
                        key={voice.id}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
                          selectedVoice === voice.id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                        onClick={() => {
                          setSelectedVoice(voice.id);
                          setShowVoiceMenu(false);
                        }}
                      >
                        <div>
                          <div className={cn(
                            "font-medium text-sm",
                            selectedVoice === voice.id ? "text-blue-600 dark:text-cyan-400" : "text-gray-900 dark:text-white"
                          )}>
                            {voice.name}
                          </div>
                          <div className="text-xs text-gray-500">{voice.description}</div>
                        </div>
                        <button
                          onClick={(e) => previewVoice(voice.id, e)}
                          className={cn(
                            "p-1.5 rounded-full transition-colors",
                            previewingVoice === voice.id ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                          )}
                        >
                          {previewingVoice === voice.id ? (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
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
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                autoSpeak ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title={autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
            >
              <svg className="w-5 h-5" fill={autoSpeak ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            {/* Export */}
            {messages.length > 0 && (
              <button
                onClick={handleExportConversation}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Export conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            {/* Clear */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Ask me anything about Claude AI, Claude Code, or our documentation
              </p>
              <div className="grid gap-3 w-full max-w-md">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111] text-gray-700 dark:text-gray-300 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
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
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white"
                        : "bg-gray-100 dark:bg-[#111111] text-gray-900 dark:text-white border border-gray-200 dark:border-[#262626]"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.role === "assistant" ? (
                        <LinkifiedText text={markdownToDisplayText(message.content)} />
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => copyToClipboard(message.content, index)}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            copiedMessageIndex === index ? "text-green-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          )}
                        >
                          {copiedMessageIndex === index ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => speakMessage(message.content, index)}
                          disabled={isTTSLoading && speakingMessageIndex !== index}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            speakingMessageIndex === index ? "text-cyan-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                          )}
                        >
                          {speakingMessageIndex === index && isTTSLoading ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Loading
                            </>
                          ) : speakingMessageIndex === index ? (
                            <>
                              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                              Stop
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              Listen
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
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      <LinkifiedText text={markdownToDisplayText(streamingContent)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {error && (
            <div className="max-w-3xl mx-auto mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-[#262626] p-4 bg-white dark:bg-[#0a0a0a]">
          {isListening && (
            <div className="flex items-center gap-2 text-sm text-cyan-500 mb-3 max-w-3xl mx-auto">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span>Listening...</span>
              {interimTranscript && (
                <span className="text-gray-400 italic truncate">&quot;{interimTranscript}&quot;</span>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 dark:bg-[#111111] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800",
                  "disabled:opacity-50"
                )}
                title={isListening ? "Stop" : "Voice input"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
            <MentionInput
              ref={inputRef}
              value={isListening ? interimTranscript || input : input}
              onChange={setInput}
              onSubmit={() => sendMessage(input)}
              placeholder={isListening ? "Speak now..." : "Type @ to mention, or ask a question..."}
              disabled={isLoading || isListening}
            />
            <button
              type="submit"
              disabled={isLoading || isListening || !input.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white transition-all hover:opacity-90 disabled:opacity-50"
              title="Send"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
