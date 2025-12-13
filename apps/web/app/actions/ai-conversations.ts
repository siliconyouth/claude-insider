"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  summary?: string;
  context?: {
    page?: { path: string; title: string; section?: string };
    content?: { type: string; title?: string };
  };
  message_count: number;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Get all conversations for the current user
 */
export async function getConversations(options?: {
  starred?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<AIConversation[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("ai_conversations")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (options?.starred !== undefined) {
      query = query.eq("is_starred", options.starred);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching conversations:", error);
      return { data: null, error: "Failed to fetch conversations" };
    }

    return { data: data as AIConversation[], error: null };
  } catch (error) {
    console.error("Error in getConversations:", error);
    return { data: null, error: "Failed to fetch conversations" };
  }
}

/**
 * Get a single conversation with messages
 */
export async function getConversation(
  conversationId: string
): Promise<ActionResult<AIConversation>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversation, error: convError } = await (supabase as any)
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (convError || !conversation) {
      return { data: null, error: "Conversation not found" };
    }

    // Get messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error: msgError } = await (supabase as any)
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Error fetching messages:", msgError);
      return { data: null, error: "Failed to fetch messages" };
    }

    return {
      data: {
        ...conversation,
        messages: messages as AIMessage[],
      } as AIConversation,
      error: null,
    };
  } catch (error) {
    console.error("Error in getConversation:", error);
    return { data: null, error: "Failed to fetch conversation" };
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  context?: AIConversation["context"]
): Promise<ActionResult<AIConversation>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_conversations")
      .insert({
        user_id: session.user.id,
        context,
        title: context?.content?.title || context?.page?.title || "New Conversation",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return { data: null, error: "Failed to create conversation" };
    }

    return { data: data as AIConversation, error: null };
  } catch (error) {
    console.error("Error in createConversation:", error);
    return { data: null, error: "Failed to create conversation" };
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  tokensUsed?: number
): Promise<ActionResult<AIMessage>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conv } = await (supabase as any)
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!conv) {
      return { data: null, error: "Conversation not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
        tokens_used: tokensUsed,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding message:", error);
      return { data: null, error: "Failed to add message" };
    }

    return { data: data as AIMessage, error: null };
  } catch (error) {
    console.error("Error in addMessage:", error);
    return { data: null, error: "Failed to add message" };
  }
}

/**
 * Toggle starred status
 */
export async function toggleConversationStar(
  conversationId: string
): Promise<ActionResult<{ is_starred: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get current status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conv } = await (supabase as any)
      .from("ai_conversations")
      .select("is_starred")
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .single();

    if (!conv) {
      return { data: null, error: "Conversation not found" };
    }

    // Toggle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_conversations")
      .update({ is_starred: !conv.is_starred })
      .eq("id", conversationId)
      .select("is_starred")
      .single();

    if (error) {
      console.error("Error toggling star:", error);
      return { data: null, error: "Failed to update conversation" };
    }

    return { data: { is_starred: data.is_starred }, error: null };
  } catch (error) {
    console.error("Error in toggleConversationStar:", error);
    return { data: null, error: "Failed to update conversation" };
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<ActionResult<{ title: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    if (!title.trim()) {
      return { data: null, error: "Title cannot be empty" };
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_conversations")
      .update({ title: title.trim() })
      .eq("id", conversationId)
      .eq("user_id", session.user.id)
      .select("title")
      .single();

    if (error) {
      console.error("Error updating title:", error);
      return { data: null, error: "Failed to update title" };
    }

    return { data: { title: data?.title || title }, error: null };
  } catch (error) {
    console.error("Error in updateConversationTitle:", error);
    return { data: null, error: "Failed to update title" };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("ai_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting conversation:", error);
      return { data: null, error: "Failed to delete conversation" };
    }

    return { data: { deleted: true }, error: null };
  } catch (error) {
    console.error("Error in deleteConversation:", error);
    return { data: null, error: "Failed to delete conversation" };
  }
}
