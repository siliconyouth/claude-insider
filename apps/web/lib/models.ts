/**
 * Claude Model Configuration
 *
 * This file contains model constants that are shared across the application.
 * Extracted to prevent circular dependencies between claude.ts and system-prompt.ts
 */

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
