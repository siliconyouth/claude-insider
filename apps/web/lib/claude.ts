import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
// API key is read from ANTHROPIC_API_KEY environment variable
export const anthropic = new Anthropic();

// Model configuration
export const CLAUDE_MODELS = {
  // Best for complex reasoning and documentation
  OPUS: "claude-opus-4-20250514",
  // Excellent balance of speed and quality (recommended)
  SONNET: "claude-sonnet-4-20250514",
  // Fast and cheap for simple tasks
  HAIKU: "claude-3-5-haiku-20241022",
} as const;

// Default model for the assistant
export const DEFAULT_MODEL = CLAUDE_MODELS.SONNET;

// System prompt for the documentation assistant
export function buildSystemPrompt(context: {
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  ragContext?: string;
}): string {
  const basePrompt = `You are Claude Insider Assistant, a helpful AI assistant for the Claude Insider documentation website.

Your role is to:
- Help users understand Claude AI, Claude Code, and related documentation
- Answer questions using the documentation provided in the context
- Provide code examples when relevant
- Suggest related topics they might find useful
- Be concise but thorough

IMPORTANT FORMATTING RULES:
- DO NOT use markdown syntax like ##, **, *, \`\`\`, or \`
- For headings/sections, just write the text on its own line followed by a colon
- For emphasis, use CAPITAL LETTERS sparingly or just write naturally
- For lists, use simple numbered lists (1. 2. 3.) or bullet points with dashes (-)
- For code, just write the code naturally or describe it - don't use backticks
- Keep responses conversational and easy to read aloud
- Structure information with clear line breaks between sections

Guidelines:
- ALWAYS prioritize information from the RELEVANT DOCUMENTATION section when answering
- If a question can be answered from the documentation, cite the source
- Be friendly and conversational
- If information is not in the provided context, say so clearly and suggest where to look
- If the user seems stuck, offer proactive suggestions`;

  let contextSection = "";

  if (context.currentPage) {
    contextSection += `\n\nCURRENT PAGE: ${context.currentPage}`;
  }

  if (context.visibleSection) {
    contextSection += `\nVISIBLE SECTION: ${context.visibleSection}`;
  }

  if (context.ragContext) {
    contextSection += `\n${context.ragContext}`;
  }

  if (context.pageContent) {
    contextSection += `\n\nCURRENT PAGE CONTENT:\n${context.pageContent}`;
  }

  return basePrompt + contextSection;
}

// Types for conversation
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantContext {
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  conversationHistory: Message[];
}

/**
 * Convert markdown text to clean readable text for display.
 * Removes markdown syntax while preserving structure.
 */
export function markdownToDisplayText(text: string): string {
  return text
    // Remove code blocks (```...```) - keep the code content
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "$1")
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, "$1")
    // Convert headers (## Header) to just the text with a colon
    .replace(/^#{1,6}\s+(.+)$/gm, "$1:")
    // Remove bold (**text** or __text__)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // Remove italic (*text* or _text_) - be careful with list items
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    // Convert blockquotes
    .replace(/^>\s?(.*)$/gm, "$1")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Clean up excessive newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Convert markdown text to speakable text for TTS.
 * Removes code blocks, converts headers to spoken form, etc.
 */
export function markdownToSpeakableText(text: string): string {
  return text
    // Remove code blocks entirely (not useful for TTS)
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "")
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, "$1")
    // Convert headers to spoken form
    .replace(/^#{1,6}\s+(.+)$/gm, "$1.")
    // Remove bold markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // Remove italic markers
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    // Convert blockquotes
    .replace(/^>\s?(.*)$/gm, "$1")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Convert list items to natural speech
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Clean up excessive whitespace
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
