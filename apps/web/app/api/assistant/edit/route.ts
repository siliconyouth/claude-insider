import { DEFAULT_MODEL } from "@/lib/claude";
import { getSession } from "@/lib/auth";
import { getUserApiKey, logApiUsage } from "@/lib/get-user-api-key";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import { pool } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// AI Writing Commands
type EditCommand =
  | "improve" // Improve clarity and readability
  | "expand" // Add more detail and context
  | "simplify" // Make easier to understand
  | "examples" // Add code examples
  | "grammar" // Fix grammar and typos
  | "summarize" // Create a concise summary
  | "technical" // Make more technical/precise
  | "friendly" // Make more conversational
  | "custom"; // Custom instructions

interface EditRequest {
  content: string; // Original content to edit
  command: EditCommand;
  customPrompt?: string; // For custom command
  selection?: {
    // If only editing a selection
    start: number;
    end: number;
    text: string;
  };
  context?: {
    // Document context
    title?: string;
    category?: string;
    fullContent?: string; // Full document for context
  };
}

// Command-specific prompts
const COMMAND_PROMPTS: Record<EditCommand, string> = {
  improve: `Improve this content for clarity, readability, and flow.
- Fix awkward phrasing
- Improve sentence structure
- Enhance word choice
- Maintain the original meaning and technical accuracy
- Keep the same markdown/MDX formatting`,

  expand: `Expand this content with more detail and context.
- Add relevant explanations
- Include helpful examples where appropriate
- Elaborate on key concepts
- Maintain consistency with the existing style
- Keep the same markdown/MDX formatting`,

  simplify: `Simplify this content to make it easier to understand.
- Use simpler words and shorter sentences
- Remove unnecessary jargon
- Break down complex concepts
- Keep technical accuracy while improving accessibility
- Keep the same markdown/MDX formatting`,

  examples: `Add practical code examples to illustrate this content.
- Add relevant, working code examples
- Include comments explaining key parts
- Show common use cases
- Use appropriate syntax highlighting with language tags
- Keep the same markdown/MDX formatting`,

  grammar: `Fix grammar, spelling, and punctuation in this content.
- Correct grammatical errors
- Fix spelling mistakes
- Improve punctuation
- Do NOT change the meaning or technical content
- Keep the same markdown/MDX formatting`,

  summarize: `Create a concise summary of this content.
- Extract the key points
- Reduce length while preserving essential information
- Use clear, direct language
- Keep the same markdown/MDX formatting`,

  technical: `Make this content more technically precise.
- Add technical details and specifications
- Use proper terminology
- Include relevant technical notes
- Reference best practices where applicable
- Keep the same markdown/MDX formatting`,

  friendly: `Make this content more conversational and approachable.
- Use a warmer, friendlier tone
- Add helpful tips and encouragement
- Make technical content more accessible
- Keep accuracy while improving approachability
- Keep the same markdown/MDX formatting`,

  custom: "", // Will use customPrompt
};

export async function POST(request: Request) {
  try {
    const body: EditRequest = await request.json();
    const { content, command, customPrompt, selection, context } = body;

    // Validate input
    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (content.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Content too long (max 50,000 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!command || !Object.keys(COMMAND_PROMPTS).includes(command)) {
      return new Response(
        JSON.stringify({ error: "Invalid command" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (command === "custom" && (!customPrompt || customPrompt.length > 1000)) {
      return new Response(
        JSON.stringify({ error: "Custom prompt required (max 1000 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user session - editing requires authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check user role for editing permissions
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    const canEditDirectly = hasMinRole(userRole, ROLES.EDITOR);

    // Get user's API key
    const apiKeyResult = await getUserApiKey(session.user.id);
    const anthropic = new Anthropic({ apiKey: apiKeyResult.apiKey });
    const model = apiKeyResult.preferredModel || DEFAULT_MODEL;

    // Build the editing prompt
    const commandPrompt =
      command === "custom" ? customPrompt! : COMMAND_PROMPTS[command];

    // Determine what content to edit
    const contentToEdit = selection ? selection.text : content;

    // Build context string
    let contextInfo = "";
    if (context?.title) {
      contextInfo += `Document title: ${context.title}\n`;
    }
    if (context?.category) {
      contextInfo += `Category: ${context.category}\n`;
    }
    if (selection && context?.fullContent) {
      // Provide surrounding context for selections
      const before = context.fullContent.slice(
        Math.max(0, selection.start - 200),
        selection.start
      );
      const after = context.fullContent.slice(
        selection.end,
        Math.min(context.fullContent.length, selection.end + 200)
      );
      if (before) contextInfo += `\nContent before selection:\n...${before}\n`;
      if (after) contextInfo += `\nContent after selection:\n${after}...\n`;
    }

    const systemPrompt = `You are an expert technical writer and editor for Claude Insider, a documentation hub for Claude AI.

Your task is to edit the provided content according to the given instructions.

IMPORTANT RULES:
1. Return ONLY the edited content - no explanations, no markdown code blocks wrapping the output
2. Preserve all MDX components (like <ContentMeta>, <ResourceEmbed>, etc.)
3. Maintain consistent formatting with the original
4. Keep code blocks with their original language tags
5. Do not add or remove sections unless specifically asked
6. Preserve frontmatter if present

${contextInfo ? `CONTEXT:\n${contextInfo}\n` : ""}
EDITING INSTRUCTIONS:
${commandPrompt}`;

    // Stream the edited content
    const stream = await anthropic.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please edit the following content:\n\n${contentToEdit}`,
        },
      ],
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let inputTokens = 0;
        let outputTokens = 0;

        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({
                type: "text",
                content: event.delta.text,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (event.type === "message_delta" && event.usage) {
              outputTokens = event.usage.output_tokens;
            }
          }

          // Get final usage
          const finalMessage = await stream.finalMessage();
          if (finalMessage.usage) {
            inputTokens = finalMessage.usage.input_tokens;
            outputTokens = finalMessage.usage.output_tokens;
          }

          // Log usage if using own API key
          if (
            apiKeyResult.isUserKey &&
            apiKeyResult.userId &&
            apiKeyResult.apiKeyId
          ) {
            logApiUsage(
              apiKeyResult.userId,
              apiKeyResult.apiKeyId,
              "edit",
              model,
              inputTokens,
              outputTokens
            ).catch((err) => console.error("[Edit] Usage logging error:", err));
          }

          // Send completion with metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                usage: { inputTokens, outputTokens },
                model,
                usingOwnKey: apiKeyResult.isUserKey,
                canEditDirectly,
                command,
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", content: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Edit API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
