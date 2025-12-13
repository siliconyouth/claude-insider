"use server";

/**
 * Mentions Server Actions
 *
 * Handle mention processing and notifications.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { extractMentions } from "@/lib/mentions";

/**
 * Process mentions in content and create notifications
 */
export async function processMentions(
  content: string,
  context: {
    type: "comment" | "reply" | "review";
    resourceType: string;
    resourceId: string;
    contextTitle?: string;
  }
): Promise<{ mentionedUsers?: string[]; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const usernames = extractMentions(content);
    if (usernames.length === 0) {
      return { mentionedUsers: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get user IDs for mentioned usernames
    const { data: mentionedUsers } = await supabase
      .from("user")
      .select("id, username")
      .in("username", usernames)
      .neq("id", session.user.id); // Don't notify self

    if (!mentionedUsers || mentionedUsers.length === 0) {
      return { mentionedUsers: [] };
    }

    // Get current user's name for notification
    const { data: currentUser } = await supabase
      .from("user")
      .select("name, username")
      .eq("id", session.user.id)
      .single();

    // Create notifications for each mentioned user
    const notifications = mentionedUsers.map((user: { id: string; username: string }) => ({
      user_id: user.id,
      type: "mention",
      title: `${currentUser?.name || "Someone"} mentioned you`,
      message: getNotificationMessage(context, content),
      link: getNotificationLink(context),
      metadata: {
        mentionedBy: session.user.id,
        mentionedByName: currentUser?.name,
        mentionedByUsername: currentUser?.username,
        contextType: context.type,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
      },
    }));

    // Insert notifications
    await supabase.from("notifications").insert(notifications);

    return {
      mentionedUsers: mentionedUsers.map((u: { username: string }) => u.username),
    };
  } catch (error) {
    console.error("[Mentions] Process error:", error);
    return { error: "Failed to process mentions" };
  }
}

/**
 * Get users matching a partial username for autocomplete
 */
export async function searchUsersForMention(query: string): Promise<{
  users?: Array<{
    id: string;
    username: string;
    name: string;
    image: string | null;
  }>;
  error?: string;
}> {
  try {
    if (!query || query.length < 1) {
      return { users: [] };
    }

    const session = await getSession();
    const currentUserId = session?.user?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Search for users with matching username
    const { data: users, error } = await supabase
      .from("user")
      .select("id, username, name, image")
      .ilike("username", `${query}%`)
      .not("username", "is", null)
      .neq("id", currentUserId || "")
      .limit(5);

    if (error) throw error;

    return {
      users: users || [],
    };
  } catch (error) {
    console.error("[Mentions] Search error:", error);
    return { error: "Failed to search users" };
  }
}

/**
 * Validate that mentioned usernames exist
 */
export async function validateMentions(
  usernames: string[]
): Promise<{ valid: string[]; invalid: string[] }> {
  try {
    if (usernames.length === 0) {
      return { valid: [], invalid: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("user")
      .select("username")
      .in("username", usernames);

    const validUsernames = new Set(
      (data || []).map((u: { username: string }) => u.username.toLowerCase())
    );

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const username of usernames) {
      if (validUsernames.has(username.toLowerCase())) {
        valid.push(username);
      } else {
        invalid.push(username);
      }
    }

    return { valid, invalid };
  } catch (error) {
    console.error("[Mentions] Validate error:", error);
    return { valid: [], invalid: usernames };
  }
}

// Helper functions
function getNotificationMessage(
  context: { type: string; contextTitle?: string },
  content: string
): string {
  const preview = content.length > 100 ? content.slice(0, 100) + "..." : content;

  switch (context.type) {
    case "comment":
      return `In a comment: "${preview}"`;
    case "reply":
      return `In a reply: "${preview}"`;
    case "review":
      return `In a review: "${preview}"`;
    default:
      return preview;
  }
}

function getNotificationLink(context: {
  type: string;
  resourceType: string;
  resourceId: string;
}): string {
  switch (context.resourceType) {
    case "doc":
      return `/docs/${context.resourceId}`;
    case "resource":
      return `/resources?id=${context.resourceId}`;
    default:
      return "/";
  }
}
