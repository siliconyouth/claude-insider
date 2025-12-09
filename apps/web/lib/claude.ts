/**
 * Server-only Claude utilities
 * This file should only be imported from server-side code (API routes, server components)
 *
 * The system prompt is now loaded from data/system-prompt.ts which contains:
 * - Complete assistant persona and personality
 * - Project knowledge (author, tech stack, features)
 * - Documentation structure awareness
 * - Voice assistant capabilities
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Re-export client-safe types and utilities
export type { Message, AssistantContext } from "./claude-utils";
export { markdownToDisplayText, markdownToSpeakableText } from "./claude-utils";

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

// Human-readable model name for display
export const DEFAULT_MODEL_NAME = "Claude Sonnet 4";
export const DEFAULT_MODEL_ID = DEFAULT_MODEL;

// Import the comprehensive system prompt builder
import buildComprehensiveSystemPrompt from "../data/system-prompt";

// System prompt for the documentation assistant
// Now uses the comprehensive prompt from data/system-prompt.ts
export function buildSystemPrompt(context: {
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  ragContext?: string;
}): string {
  return buildComprehensiveSystemPrompt(context);
}
