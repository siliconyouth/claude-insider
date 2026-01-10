/**
 * Prompt Builder Chat API
 *
 * AI-powered conversational interface for filling prompt variables.
 * Claude guides users through filling variables with natural conversation,
 * extracting values from user responses and asking contextual follow-ups.
 *
 * Features:
 * - Context-aware questions based on prompt content
 * - Variable value extraction from natural language
 * - Progress tracking with filled values
 * - Quick reply suggestions for common responses
 *
 * @see components/prompts/builder/chat-builder.tsx
 */

import { getSession } from "@/lib/auth";
import { getUserApiKey, logApiUsage } from "@/lib/get-user-api-key";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Variable {
  name: string;
  description?: string;
  required?: boolean;
  default_value?: string;
}

// Model to use for chat builder
const CHAT_BUILDER_MODEL = "claude-sonnet-4-20250514";

interface ChatRequest {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  variables: Variable[];
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  currentValues: Record<string, string>;
  userMessage?: string;
}

interface ExtractedValue {
  variable: string;
  value: string;
  confidence: number;
}

// System prompt for the builder assistant
function buildBuilderSystemPrompt(
  promptTitle: string,
  promptContent: string,
  variables: Variable[],
  currentValues: Record<string, string>
): string {
  const filledVars = Object.keys(currentValues).filter((k) => currentValues[k]?.trim());
  const unfilledVars = variables.filter((v) => !filledVars.includes(v.name));

  const variableList = variables
    .map((v) => {
      const isFilled = filledVars.includes(v.name);
      const status = isFilled ? `✓ FILLED: "${currentValues[v.name]}"` : "⊘ UNFILLED";
      const req = v.required ? "(required)" : "(optional)";
      return `- ${v.name} ${req}: ${v.description || "No description"} [${status}]`;
    })
    .join("\n");

  return `You are a helpful prompt builder assistant. Your goal is to help the user fill in variables for the prompt "${promptTitle}".

<prompt_content>
${promptContent}
</prompt_content>

<variables>
${variableList}
</variables>

<instructions>
1. Guide the user through filling unfilled variables one at a time
2. Ask friendly, contextual questions that help them provide good values
3. Extract variable values from their responses - users don't need to be formal
4. Confirm values you've extracted before moving on
5. When all required variables are filled, congratulate them and summarize
6. Be encouraging and helpful - this should feel like a conversation, not a form

Current progress: ${filledVars.length}/${variables.length} variables filled
${unfilledVars.length > 0 && unfilledVars[0] ? `Next unfilled: ${unfilledVars[0].name}` : "All filled!"}
</instructions>

<response_format>
Always respond with a JSON object in this exact format:
{
  "message": "Your conversational response to the user",
  "extracted_values": [
    {"variable": "var_name", "value": "extracted_value", "confidence": 0.95}
  ],
  "quick_replies": ["Option 1", "Option 2", "Option 3"],
  "is_complete": false
}

Guidelines for extracted_values:
- Only extract values when the user clearly provides them
- Confidence should be 0.8+ to auto-fill, lower values should be confirmed
- Empty array if no values were provided in the user's message

Guidelines for quick_replies:
- Provide 2-4 helpful suggestions for common responses
- Make them specific to the current variable being asked about
- Include "Skip (optional)" for non-required variables
</response_format>`;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const {
      promptId: _promptId,
      promptTitle,
      promptContent,
      variables,
      conversationHistory,
      currentValues,
      userMessage,
    } = body;

    // Validation
    if (!promptTitle || !promptContent || !variables) {
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
    const systemPrompt = buildBuilderSystemPrompt(
      promptTitle,
      promptContent,
      variables,
      currentValues
    );

    // Build messages
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...conversationHistory,
    ];

    if (userMessage) {
      messages.push({ role: "user", content: userMessage });
    }

    // If no messages, start the conversation
    if (messages.length === 0) {
      messages.push({
        role: "user",
        content: "Hi! I'd like help filling in this prompt.",
      });
    }

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: apiKeyResult.apiKey });
    const response = await anthropic.messages.create({
      model: CHAT_BUILDER_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Extract text response
    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

    // Try to parse as JSON
    let parsedResponse: {
      message: string;
      extracted_values: ExtractedValue[];
      quick_replies: string[];
      is_complete: boolean;
    };

    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: treat entire response as message
        parsedResponse = {
          message: responseText,
          extracted_values: [],
          quick_replies: [],
          is_complete: false,
        };
      }
    } catch {
      // Parse error - use raw response
      parsedResponse = {
        message: responseText,
        extracted_values: [],
        quick_replies: [],
        is_complete: false,
      };
    }

    // Log API usage if using user's key
    if (session?.user?.id && apiKeyResult.isUserKey && apiKeyResult.apiKeyId) {
      await logApiUsage(
        session.user.id,
        apiKeyResult.apiKeyId,
        "prompt_builder_chat",
        CHAT_BUILDER_MODEL,
        response.usage?.input_tokens || 0,
        response.usage?.output_tokens || 0
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: parsedResponse,
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
    console.error("Prompt builder chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
