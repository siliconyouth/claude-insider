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

Guidelines:
- ALWAYS prioritize information from the RELEVANT DOCUMENTATION section when answering
- If a question can be answered from the documentation, cite the source
- Use markdown formatting for code blocks and lists
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
