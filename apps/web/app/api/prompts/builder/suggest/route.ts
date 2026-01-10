/**
 * Prompt Builder Suggestions API
 *
 * AI-powered suggestions for variable values.
 * Provides contextual suggestions based on:
 * - Variable name and description
 * - Prompt content and category
 * - Previously filled values
 * - User's recent values (from localStorage, passed by client)
 *
 * @see components/prompts/builder/enhanced-variable-modal.tsx
 */

import { getSession } from "@/lib/auth";
import { getUserApiKey, logApiUsage } from "@/lib/get-user-api-key";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Variable {
  name: string;
  description?: string;
  required?: boolean;
  default_value?: string;
  input_type?: string;
  options?: string[];
}

// Model to use for suggestions (fast)
const SUGGEST_MODEL = "claude-3-5-haiku-20241022";

interface SuggestRequest {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variable: Variable;
  currentValues: Record<string, string>;
  recentValues?: string[];
  category?: string;
}

// Build a focused system prompt for suggestions
function buildSuggestSystemPrompt(
  promptTitle: string,
  promptContent: string,
  variable: Variable,
  currentValues: Record<string, string>,
  category?: string
): string {
  const contextSummary = Object.entries(currentValues)
    .filter(([_, v]) => v?.trim())
    .map(([k, v]) => `${k}: "${v}"`)
    .join(", ") || "None yet";

  return `You are a helpful assistant generating suggestions for a prompt variable.

<prompt>
Title: ${promptTitle}
Category: ${category || "General"}
Content Preview: ${promptContent.slice(0, 500)}${promptContent.length > 500 ? "..." : ""}
</prompt>

<variable>
Name: ${variable.name}
Description: ${variable.description || "No description provided"}
Type: ${variable.input_type || "text"}
Required: ${variable.required ? "Yes" : "No"}
Default: ${variable.default_value || "None"}
${variable.options ? `Options: ${variable.options.join(", ")}` : ""}
</variable>

<context>
Already filled values: ${contextSummary}
</context>

<task>
Generate 5 diverse, high-quality suggestions for the variable "${variable.name}".
Consider the prompt's purpose and any already-filled values.
Make suggestions specific, practical, and varied in approach.
</task>

<response_format>
Return ONLY a JSON array of 5 strings. No other text.
Example: ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4", "Suggestion 5"]
</response_format>`;
}

export async function POST(request: Request) {
  try {
    const body: SuggestRequest = await request.json();
    const {
      promptId: _promptId,
      promptTitle,
      promptContent,
      variable,
      currentValues,
      recentValues,
      category,
    } = body;

    // Validation
    if (!promptTitle || !promptContent || !variable) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get session and API key
    const session = await getSession();
    const apiKeyResult = await getUserApiKey(session?.user?.id ?? null);

    if (!apiKeyResult.apiKey) {
      return new Response(
        JSON.stringify({ error: "No API key available" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build system prompt
    const systemPrompt = buildSuggestSystemPrompt(
      promptTitle,
      promptContent,
      variable,
      currentValues,
      category
    );

    // Call Claude API with Haiku for speed
    const anthropic = new Anthropic({ apiKey: apiKeyResult.apiKey });
    const response = await anthropic.messages.create({
      model: SUGGEST_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate 5 suggestions for the "${variable.name}" variable.`,
        },
      ],
    });

    // Extract text response
    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

    // Parse suggestions
    let suggestions: string[] = [];
    try {
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          suggestions = parsed.slice(0, 5).map(String);
        }
      }
    } catch {
      // Parse error - return empty suggestions
      suggestions = [];
    }

    // Prepend recent values if available (deduplicated)
    if (recentValues && recentValues.length > 0) {
      const uniqueRecent = recentValues.filter(
        (v) => !suggestions.includes(v)
      );
      suggestions = [...uniqueRecent.slice(0, 3), ...suggestions].slice(0, 8);
    }

    // Add default value if not in suggestions
    if (
      variable.default_value &&
      !suggestions.includes(variable.default_value)
    ) {
      suggestions.unshift(variable.default_value);
    }

    // Log API usage if using user's key
    if (session?.user?.id && apiKeyResult.isUserKey && apiKeyResult.apiKeyId) {
      await logApiUsage(
        session.user.id,
        apiKeyResult.apiKeyId,
        "prompt_builder_suggest",
        SUGGEST_MODEL,
        response.usage?.input_tokens || 0,
        response.usage?.output_tokens || 0
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions.slice(0, 8), // Max 8 suggestions
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Prompt builder suggest error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
