import type { Message } from "./claude-utils";

// Storage key for conversation history
const HISTORY_STORAGE_KEY = "claude-insider-assistant-history";
const MAX_HISTORY_MESSAGES = 20;

export interface AssistantState {
  isOpen: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  messages: Message[];
  currentPage: string;
  pageContent: string;
  visibleSection: string;
  error: string | null;
}

export const initialAssistantState: AssistantState = {
  isOpen: false,
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  messages: [],
  currentPage: "",
  pageContent: "",
  visibleSection: "",
  error: null,
};

/**
 * Get conversation history from localStorage
 */
export function getConversationHistory(): Message[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save conversation history to localStorage
 */
export function saveConversationHistory(messages: Message[]): void {
  if (typeof window === "undefined") return;

  try {
    // Keep only the last N messages
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail if localStorage is full
  }
}

/**
 * Clear conversation history
 */
export function clearConversationHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Extract visible section from scroll position
 * This looks for the heading that's currently visible in the viewport
 */
export function getVisibleSection(): string {
  if (typeof window === "undefined") return "";

  const headings = document.querySelectorAll("h1, h2, h3");
  let currentSection = "";

  for (const heading of headings) {
    const rect = heading.getBoundingClientRect();
    // Check if the heading is in the upper half of the viewport
    if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
      currentSection = heading.textContent || "";
      break;
    } else if (rect.top < 0) {
      // Keep track of headings we've scrolled past
      currentSection = heading.textContent || "";
    }
  }

  return currentSection;
}

/**
 * Get the main content of the current page
 * Strips out navigation, header, footer, etc.
 */
export function getPageContent(): string {
  if (typeof window === "undefined") return "";

  // Try to find the main content area
  const mainContent =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector('[role="main"]');

  if (!mainContent) return "";

  // Get text content, limiting to reasonable size
  const text = mainContent.textContent || "";

  // Limit to ~4000 characters to fit in context window
  return text.slice(0, 4000).trim();
}

/**
 * Format messages for display
 */
export function formatMessageTime(timestamp?: number): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

import { getContextAwareSuggestions, recordSuggestionShown } from "./context-tracker";

/**
 * Suggested questions based on current page and user context
 */
export function getSuggestedQuestions(currentPage: string): string[] {
  // First, try to get context-aware suggestions
  const contextAware = getContextAwareSuggestions(currentPage);
  if (contextAware.length > 0) {
    contextAware.forEach(recordSuggestionShown);
    return contextAware;
  }

  // Fall back to page-based suggestions
  const suggestions: Record<string, string[]> = {
    "/docs/getting-started": [
      "How do I install Claude Code?",
      "What are the system requirements?",
      "How do I get started quickly?",
    ],
    "/docs/getting-started/installation": [
      "What are the prerequisites?",
      "How do I verify the installation?",
      "What if I get an error during setup?",
    ],
    "/docs/configuration": [
      "What is CLAUDE.md?",
      "How do I configure Claude Code?",
      "What settings are available?",
    ],
    "/docs/configuration/claude-md": [
      "What should I put in CLAUDE.md?",
      "How does Claude read this file?",
      "Can you show me an example?",
    ],
    "/docs/tips-and-tricks": [
      "What are the best prompting techniques?",
      "How can I be more productive?",
      "What are common mistakes to avoid?",
    ],
    "/docs/tips-and-tricks/prompting": [
      "How do I write effective prompts?",
      "What's the ideal prompt structure?",
      "Can you give me examples?",
    ],
    "/docs/api": [
      "How do I authenticate with the API?",
      "What endpoints are available?",
      "How do I use tool calling?",
    ],
    "/docs/api/authentication": [
      "How do I get an API key?",
      "How do I secure my API key?",
      "What are the rate limits?",
    ],
    "/docs/api/tool-use": [
      "What is tool use?",
      "How do I define tools?",
      "Can you show me an example?",
    ],
    "/docs/integrations": [
      "What integrations are available?",
      "How do MCP servers work?",
      "Which IDE plugins exist?",
    ],
    "/docs/integrations/mcp-servers": [
      "What is MCP?",
      "How do I set up an MCP server?",
      "What are the best MCP servers?",
    ],
    "/docs/integrations/hooks": [
      "What are hooks?",
      "How do I create a hook?",
      "What events can I hook into?",
    ],
  };

  // Find matching suggestions or return defaults
  for (const [path, questions] of Object.entries(suggestions)) {
    if (currentPage.startsWith(path)) {
      return questions;
    }
  }

  // Default suggestions
  return [
    "What is Claude Code?",
    "How do I get started?",
    "What can you help me with?",
  ];
}
