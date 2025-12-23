/**
 * Shared utility functions for Claude - safe to use in client components
 */

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
 *
 * FLUENCY OPTIMIZATION (v1.12.0):
 * - Use spaces instead of periods for paragraph breaks to avoid TTS pauses
 * - ElevenLabs v3 naturally handles sentence flow without extra punctuation
 * - Let the AI's natural punctuation control pauses
 */
export function markdownToSpeakableText(text: string): string {
  return text
    // Remove code blocks entirely (not useful for TTS)
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "")
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, "$1")
    // Convert headers to spoken form - use comma for light pause, not period
    .replace(/^#{1,6}\s+(.+)$/gm, "$1,")
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
    // Convert list items to natural speech - add "and" for flow
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // FLUENCY: Use single space for paragraph breaks instead of periods
    // This lets ElevenLabs v3 maintain natural flow without artificial pauses
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
