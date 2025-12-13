"use client";

/**
 * Ask AI Provider
 *
 * Global context for the Ask AI functionality with conversation persistence.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type AIContext,
  generateContextualQuestion,
  generateSuggestedQuestions,
  getPageContext,
} from "@/lib/ai-context";
import type { AIConversation, AIMessage } from "@/app/actions/ai-conversations";

interface AskAIContextType {
  isOpen: boolean;
  openWithContext: (context: AIContext, question?: string) => void;
  openWithQuestion: (question: string) => void;
  close: () => void;
  currentContext: AIContext | null;
  currentQuestion: string;
  suggestedQuestions: string[];
  setQuestion: (question: string) => void;
  // Conversation history
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  conversations: AIConversation[];
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<AIMessage[]>;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

const AskAIContext = createContext<AskAIContextType | null>(null);

export function useAskAI() {
  const context = useContext(AskAIContext);
  if (!context) {
    throw new Error("useAskAI must be used within AskAIProvider");
  }
  return context;
}

interface AskAIProviderProps {
  children: ReactNode;
}

export function AskAIProvider({ children }: AskAIProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<AIContext | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Conversation history state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const openWithContext = useCallback((context: AIContext, question?: string) => {
    setCurrentContext(context);
    const fullQuestion = generateContextualQuestion(context, question);
    setCurrentQuestion(fullQuestion);
    setSuggestedQuestions(generateSuggestedQuestions(context));
    setCurrentConversationId(null); // Start fresh conversation
    setShowHistory(false);
    setIsOpen(true);
  }, []);

  const openWithQuestion = useCallback((question: string) => {
    const pageContext = getPageContext();
    const context: AIContext = { page: pageContext };
    setCurrentContext(context);
    setCurrentQuestion(question);
    setSuggestedQuestions([]);
    setCurrentConversationId(null); // Start fresh conversation
    setShowHistory(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setShowHistory(false);
  }, []);

  const setQuestion = useCallback((question: string) => {
    setCurrentQuestion(question);
  }, []);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const { getConversations } = await import("@/app/actions/ai-conversations");
      const result = await getConversations({ limit: 50 });
      if (result.data) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  // Load a specific conversation's messages
  const loadConversation = useCallback(async (id: string): Promise<AIMessage[]> => {
    try {
      const { getConversation } = await import("@/app/actions/ai-conversations");
      const result = await getConversation(id);
      if (result.data?.messages) {
        return result.data.messages;
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
    return [];
  }, []);

  // Load conversations when modal opens with history view
  useEffect(() => {
    if (isOpen && showHistory) {
      loadConversations();
    }
  }, [isOpen, showHistory, loadConversations]);

  return (
    <AskAIContext.Provider
      value={{
        isOpen,
        openWithContext,
        openWithQuestion,
        close,
        currentContext,
        currentQuestion,
        suggestedQuestions,
        setQuestion,
        // Conversation history
        currentConversationId,
        setCurrentConversationId,
        conversations,
        loadConversations,
        loadConversation,
        showHistory,
        setShowHistory,
      }}
    >
      {children}
    </AskAIContext.Provider>
  );
}
