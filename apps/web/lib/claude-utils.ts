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
 * - Convert code symbols to spoken words (e.g., `-g` → "dash g")
 * - Convert URL paths to spoken words (e.g., `/docs/configuration` → "docs configuration")
 */
export function markdownToSpeakableText(text: string): string {
  return text
    // Extract code blocks and convert to speakable text (fallback if AI still uses them)
    // Remove language identifier and convert content to speech
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_match, code: string) => {
      // Convert each line of code to speakable text
      return code
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => convertCodeToSpeech(line))
        .join(', ');
    })
    // Extract and convert inline code - handle symbols for speech
    .replace(/`([^`]+)`/g, (_match, code: string) => convertCodeToSpeech(code))
    // Convert headers to spoken form - use comma for light pause, not period
    .replace(/^#{1,6}\s+(.+)$/gm, "$1,")
    // Remove bold markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // Convert URL paths to spoken form (e.g., /docs/configuration → docs configuration)
    // This must come after removing bold/italic markers but before link removal
    .replace(/(?:^|\s)(\/[\w-]+(?:\/[\w-]+)+)(?=[\s.,!?]|$)/g, (_match, path: string) => {
      // Remove leading/trailing slashes and split into words
      return " " + path.replace(/^\/|\/$/g, "").replace(/\//g, " ").replace(/-/g, " ");
    })
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

/**
 * Convert code/command text to speakable form.
 * Handles common CLI symbols and patterns.
 */
function convertCodeToSpeech(code: string): string {
  return code
    // Common CLI flags: -g, --global, -v, etc.
    .replace(/\s--([a-z-]+)/gi, " dash dash $1")
    .replace(/\s-([a-zA-Z])\b/g, " dash $1")
    .replace(/^--([a-z-]+)/gi, "dash dash $1")
    .replace(/^-([a-zA-Z])\b/g, "dash $1")
    // @ symbol in package names
    .replace(/@/g, " at ")
    // Forward slashes in paths/packages
    .replace(/\//g, " slash ")
    // Underscores
    .replace(/_/g, " underscore ")
    // Dots in commands/packages (but not at end of sentences)
    .replace(/\.([a-zA-Z])/g, " dot $1")
    // Clean up multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}
