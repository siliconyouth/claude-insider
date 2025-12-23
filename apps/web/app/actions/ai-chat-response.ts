"use server";

/**
 * AI Chat Response Server Action
 *
 * Generates AI responses when @claudeinsider is mentioned in DMs.
 * Uses the RAG system to provide contextual, helpful answers with
 * links to documentation and resources.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";
import { getRAGContext, searchDocuments } from "@/lib/rag";
import Anthropic from "@anthropic-ai/sdk";

// ============================================
// TYPES
// ============================================

interface AIResponseResult {
  success: boolean;
  message?: {
    id: string;
    content: string;
    createdAt: string;
  };
  error?: string;
}

interface TriggerMessageRow {
  content: string;
  sender_id: string;
}

interface ConversationMessageRow {
  content: string;
  sender_id: string;
  is_ai_generated?: boolean;
}

interface SavedMessageRow {
  id: string;
  content: string;
  created_at: string;
}

// ============================================
// SYSTEM PROMPT FOR DM RESPONSES
// ============================================

const DM_SYSTEM_PROMPT = `You are Claude Insider, the AI assistant for the Claude Insider documentation website.

You are responding to a @mention in a direct message conversation. Your role is to help users find relevant documentation, resources, and answers.

## Response Guidelines:

1. **Be brief and conversational** - Keep responses to 2-4 sentences max
2. **Include helpful links** - Link to relevant docs using markdown: [title](/docs/path)
3. **Be friendly** - Use a warm, helpful tone like you're chatting with a friend
4. **Focus on actionable help** - Point users to specific pages that will help them

## Available Documentation Sections:

- Getting Started: /docs/getting-started/installation, /docs/getting-started/quickstart
- Configuration: /docs/configuration/api-keys, /docs/configuration/settings
- Tutorials: /docs/tutorials/
- API Reference: /docs/api/
- Tips & Tricks: /docs/tips-and-tricks/
- Integrations: /docs/integrations/

## Other Pages:

- Resources: /resources (curated tools, MCP servers, prompts)
- Playground: /playground (live code examples)

## Format Example:

"Hey! For setting up API keys, check out the [API Keys guide](/docs/configuration/api-keys) - it walks you through the whole process. Let me know if you get stuck!"

## Important:
- Don't use headers or bullet points - this is casual chat
- Don't repeat the user's question back to them
- If you're unsure, suggest they check the main docs page at /docs
- Always be encouraging and helpful!`;

// ============================================
// GENERATE AI RESPONSE
// ============================================

export async function generateAIChatResponse(
  conversationId: string,
  triggerMessageId: string,
  _conversationContext?: string[]
): Promise<AIResponseResult> {
  try {
    const supabase = await createAdminClient();

    // Get the trigger message
    // Note: dm_messages table not in generated Supabase types
     
    const { data: triggerMessage, error: msgError } = await supabase
      .from("dm_messages")
      .select("content, sender_id")
      .eq("id", triggerMessageId)
      .single();

    if (msgError || !triggerMessage) {
      return { success: false, error: "Trigger message not found" };
    }

    const trigger = triggerMessage as TriggerMessageRow;

    // Get recent conversation context (last 5 messages)
     
    const { data: recentMessages } = await supabase
      .from("dm_messages")
      .select("content, sender_id, is_ai_generated")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6);

    // Build conversation context
    const contextMessages = ((recentMessages || []) as ConversationMessageRow[]).reverse();

    // Extract the user's question (remove @claudeinsider mention)
    const userQuestion = (trigger.content as string)
      .replace(/@claudeinsider/gi, "")
      .trim();

    // Get RAG context for better answers
    const ragContext = getRAGContext(userQuestion, 3);

    // Build messages for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    // Add conversation context
    for (const msg of contextMessages) {
      if (msg.is_ai_generated) {
        messages.push({ role: "assistant", content: msg.content });
      } else {
        messages.push({ role: "user", content: msg.content });
      }
    }

    // Add the current question with RAG context
    const enhancedQuestion = ragContext
      ? `User's question: "${userQuestion}"\n\nRelevant documentation context:\n${ragContext}`
      : `User's question: "${userQuestion}"`;

    // If the last message wasn't from the user, add the question
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (!lastMessage || lastMessage.role !== "user") {
      messages.push({ role: "user", content: enhancedQuestion });
    } else {
      // Update the last user message with RAG context
      lastMessage.content = enhancedQuestion;
    }

    // Generate response using Claude
    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300, // Keep responses brief
      system: DM_SYSTEM_PROMPT,
      messages,
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { success: false, error: "Failed to generate response" };
    }

    const aiResponseContent = textContent.text;

    // Parse @mentions from AI response
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = aiResponseContent.match(mentionRegex) || [];
    const mentionUsernames = mentionMatches.map((m) => m.slice(1).toLowerCase());
    const mentionedUserIds: string[] = [];

    // Look up user IDs for mentioned usernames
    if (mentionUsernames.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mentionedUsers } = await (supabase as any)
        .from("user")
        .select("id, username")
        .in("username", mentionUsernames);

      if (mentionedUsers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mentionedUsers.forEach((u: any) => {
          if (u.id) mentionedUserIds.push(u.id);
        });
      }
    }

    // Save the AI response as a message
     
    const { data: aiMessage, error: insertError } = await supabase
      .from("dm_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: AI_ASSISTANT_USER_ID,
        content: aiResponseContent,
        mentions: mentionedUserIds,
        is_ai_generated: true,
        ai_response_to: triggerMessageId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save AI response:", insertError);
      return { success: false, error: "Failed to save response" };
    }

    const savedMessage = aiMessage as SavedMessageRow;

    // Mark the trigger message as "Seen" by the AI
    // This creates a read receipt so the user sees "Seen" status on their message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("dm_message_read_receipts")
      .upsert({
        message_id: triggerMessageId,
        user_id: AI_ASSISTANT_USER_ID,
        read_at: new Date().toISOString(),
      }, {
        onConflict: "message_id,user_id",
        ignoreDuplicates: true,
      });

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      const { createNotification } = await import("./notifications");
      const preview = aiResponseContent.length > 50 ? aiResponseContent.slice(0, 50) + "..." : aiResponseContent;

      await Promise.all(
        mentionedUserIds.map((userId) =>
          createNotification({
            userId,
            type: "mention",
            title: "Claude Insider mentioned you",
            message: preview,
            actorId: AI_ASSISTANT_USER_ID,
            resourceType: "dm_message",
            resourceId: savedMessage.id,
            data: {
              conversationId,
              messageId: savedMessage.id,
            },
          })
        )
      );
    }

    return {
      success: true,
      message: {
        id: savedMessage.id,
        content: savedMessage.content,
        createdAt: savedMessage.created_at,
      },
    };
  } catch (error) {
    console.error("Generate AI response error:", error);
    return { success: false, error: "Failed to generate AI response" };
  }
}

// ============================================
// SEARCH DOCUMENTATION (for inline suggestions)
// ============================================

export async function searchDocumentation(
  query: string,
  limit: number = 5
): Promise<{
  success: boolean;
  results?: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
  error?: string;
}> {
  try {
    const results = searchDocuments(query, limit);

    return {
      success: true,
      results: results.map((r) => ({
        title: r.chunk.title,
        url: r.chunk.url,
        excerpt: r.chunk.content.substring(0, 150) + "...",
      })),
    };
  } catch (error) {
    console.error("Search documentation error:", error);
    return { success: false, error: "Search failed" };
  }
}
