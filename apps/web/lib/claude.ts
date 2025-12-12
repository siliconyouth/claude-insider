/**
 * Server-only Claude utilities
 * This file should only be imported from server-side code (API routes, server components)
 *
 * The system prompt is now loaded from data/system-prompt.ts which contains:
 * - Complete assistant persona and personality
 * - Project knowledge (author, tech stack, features)
 * - Documentation structure awareness
 * - Voice assistant capabilities
 *
 * Project info is dynamically loaded from Payload CMS Site Settings
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getSiteSettings } from "./site-settings";
import type { SiteSetting } from "../payload-types";

// Re-export client-safe types and utilities
export type { Message, AssistantContext } from "./claude-utils";
export { markdownToDisplayText, markdownToSpeakableText } from "./claude-utils";

// Re-export site settings type
export type { SiteSetting };

// Re-export model configuration from shared models file (prevents circular deps)
export {
  CLAUDE_MODELS,
  DEFAULT_MODEL,
  DEFAULT_MODEL_NAME,
  DEFAULT_MODEL_ID,
} from "./models";

// Initialize Anthropic client
// API key is read from ANTHROPIC_API_KEY environment variable
export const anthropic = new Anthropic();

// Import the comprehensive system prompt builder
import buildComprehensiveSystemPrompt from "../data/system-prompt";

// System prompt for the documentation assistant
// Now uses the comprehensive prompt from data/system-prompt.ts with CMS settings
export async function buildSystemPrompt(context: {
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  ragContext?: string;
}): Promise<string> {
  // Fetch site settings from CMS (cached)
  const siteSettings = await getSiteSettings();

  return buildComprehensiveSystemPrompt({
    ...context,
    siteSettings,
  });
}

// Synchronous version for cases where async isn't possible
// Uses cached settings or defaults
export function buildSystemPromptSync(context: {
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  ragContext?: string;
}): string {
  return buildComprehensiveSystemPrompt(context);
}
