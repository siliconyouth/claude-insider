/**
 * Server-only Claude utilities
 * This file should only be imported from server-side code (API routes, server components)
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

// System prompt for the documentation assistant
export function buildSystemPrompt(context: {
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  ragContext?: string;
}): string {
  const basePrompt = `You are Claude Insider Assistant, a helpful AI assistant for the Claude Insider documentation website.

ABOUT YOURSELF:
- You are powered by ${DEFAULT_MODEL_NAME} (model ID: ${DEFAULT_MODEL})
- You are NOT Claude Opus - you are Claude Sonnet 4
- When asked what model you are, clearly state that you are ${DEFAULT_MODEL_NAME}
- The Claude Insider website was BUILT using Claude Opus 4.5 via Claude Code, but the assistant (you) runs on ${DEFAULT_MODEL_NAME}

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
