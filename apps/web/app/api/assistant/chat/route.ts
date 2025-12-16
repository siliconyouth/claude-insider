import { buildSystemPrompt, DEFAULT_MODEL } from "@/lib/claude";
import type { Message } from "@/lib/claude";
import { getRAGContext } from "@/lib/rag";
import { getSession } from "@/lib/auth";
import { getUserApiKey, logApiUsage } from "@/lib/get-user-api-key";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatRequest {
  messages: Message[];
  currentPage?: string;
  pageContent?: string;
  visibleSection?: string;
  customAssistantName?: string;
  userName?: string;
  shouldAskForName?: boolean;
  userContext?: string; // Context from behavior tracking
  // AI context from Ask AI buttons
  aiContext?: {
    type?: string;
    category?: string;
    code?: string;
    language?: string;
    title?: string;
  };
}

// SSE streaming timeout (30 seconds of inactivity)
const STREAM_TIMEOUT_MS = 30000;

// Message validation helper
function isValidMessage(msg: unknown): msg is Message {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return (
    typeof m.role === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.length > 0 &&
    m.content.length <= 100000 // Reasonable max length
  );
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, currentPage, pageContent, visibleSection, customAssistantName, userName, shouldAskForName, userContext, aiContext } = body;

    // Input validation for messages array
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (messages.length > 100) {
      return new Response(
        JSON.stringify({ error: "Too many messages (max 100)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate each message structure
    for (let i = 0; i < messages.length; i++) {
      if (!isValidMessage(messages[i])) {
        return new Response(
          JSON.stringify({ error: `Invalid message at index ${i}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get user's session and API key
    const session = await getSession();
    const userId = session?.user?.id || null;
    const apiKeyResult = await getUserApiKey(userId);

    // Create Anthropic client with user's key or default
    const anthropic = new Anthropic({ apiKey: apiKeyResult.apiKey });

    // Use user's preferred model or default
    const model = apiKeyResult.preferredModel || DEFAULT_MODEL;

    // Get the latest user message for RAG search
    const latestUserMessage = messages
      .filter((m) => m.role === "user")
      .pop()?.content || "";

    // Search documentation for relevant context with AI context for better ranking
    const ragContext = getRAGContext(latestUserMessage, 3, aiContext);

    // Build system prompt with context (async - fetches CMS settings)
    const systemPrompt = await buildSystemPrompt({
      currentPage,
      pageContent,
      visibleSection,
      ragContext,
      customAssistantName,
      userName,
      shouldAskForName,
      userContext,
    });

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let inputTokens = 0;
        let outputTokens = 0;
        let lastActivityTime = Date.now();
        let timeoutId: NodeJS.Timeout | null = null;
        let isTimedOut = false;

        // Setup timeout checker
        const checkTimeout = () => {
          if (Date.now() - lastActivityTime > STREAM_TIMEOUT_MS) {
            isTimedOut = true;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  content: "Stream timeout - no data received for 30 seconds",
                })}\n\n`
              )
            );
            controller.close();
          } else {
            timeoutId = setTimeout(checkTimeout, 5000); // Check every 5 seconds
          }
        };
        timeoutId = setTimeout(checkTimeout, STREAM_TIMEOUT_MS);

        try {
          for await (const event of stream) {
            // Check if we've timed out
            if (isTimedOut) break;

            // Update last activity time
            lastActivityTime = Date.now();

            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              // Send as Server-Sent Event format
              const data = JSON.stringify({ type: "text", content: text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Capture usage info from message_delta events
            if (event.type === "message_delta" && event.usage) {
              outputTokens = event.usage.output_tokens;
            }
          }

          // Clear timeout on successful completion
          if (timeoutId) clearTimeout(timeoutId);

          // Get final usage from stream
          const finalMessage = await stream.finalMessage();
          if (finalMessage.usage) {
            inputTokens = finalMessage.usage.input_tokens;
            outputTokens = finalMessage.usage.output_tokens;
          }

          // Log usage if user is using their own API key
          if (apiKeyResult.isUserKey && apiKeyResult.userId && apiKeyResult.apiKeyId) {
            logApiUsage(
              apiKeyResult.userId,
              apiKeyResult.apiKeyId,
              "assistant",
              model,
              inputTokens,
              outputTokens
            ).catch((err) => console.error("[Chat] Usage logging error:", err));
          }

          // Send completion event with usage info
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "done",
              usage: { inputTokens, outputTokens },
              model,
              usingOwnKey: apiKeyResult.isUserKey,
            })}\n\n`)
          );
          controller.close();
        } catch (error) {
          // Clear timeout on error
          if (timeoutId) clearTimeout(timeoutId);

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
    console.error("Chat API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
