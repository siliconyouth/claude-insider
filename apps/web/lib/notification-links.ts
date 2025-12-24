/**
 * Notification Deep Linking Utility
 *
 * Centralized URL generation for notification deep links.
 * Used by notification-bell.tsx, notification-popup.tsx, and notifications/page.tsx
 *
 * Each notification type has a specific destination:
 * - follow → follower's profile
 * - comment/reply → document comments section
 * - mention → exact message in chat or document
 * - suggestion_* → user's suggestions page
 * - admin_notification → custom link or notifications
 * - version_update → changelog
 * - system (achievement) → profile achievements
 * - dm_message → chat window with message highlighted
 */

export interface NotificationLinkData {
  type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  data?: Record<string, unknown> | null;
  actor?: {
    id?: string;
    name: string;
    username?: string | null;
    image?: string | null;
  } | null;
}

/**
 * Get the appropriate deep link URL for a notification
 *
 * @param notification - The notification data object
 * @returns The URL to navigate to when clicking the notification
 *
 * @example
 * // For a mention in a DM
 * getNotificationUrl({
 *   type: "mention",
 *   resource_type: "dm_message",
 *   resource_id: "msg-123",
 *   data: { conversationId: "conv-456", messageId: "msg-123" }
 * });
 * // Returns: "/?openChat=messages&conversation=conv-456&message=msg-123"
 */
export function getNotificationUrl(notification: NotificationLinkData): string {
  const { type, resource_type, resource_id, data, actor } = notification;

  switch (type) {
    // ═══════════════════════════════════════════════════════════════════
    // Social Notifications
    // ═══════════════════════════════════════════════════════════════════
    case "follow":
      // Link to the follower's profile page
      if (actor?.username) {
        return `/users/${actor.username}`;
      }
      if (data?.actorUsername) {
        return `/users/${data.actorUsername}`;
      }
      return "/notifications";

    // ═══════════════════════════════════════════════════════════════════
    // Comment Notifications
    // ═══════════════════════════════════════════════════════════════════
    case "comment":
    case "reply":
      // Link to the document's comments section
      if (resource_type === "doc" && resource_id) {
        return `/docs/${resource_id}#comments`;
      }
      return "/notifications";

    // ═══════════════════════════════════════════════════════════════════
    // Suggestion Notifications
    // ═══════════════════════════════════════════════════════════════════
    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      // Link to user's suggestions page
      return "/profile/suggestions";

    // ═══════════════════════════════════════════════════════════════════
    // Mention Notifications (Most Complex)
    // ═══════════════════════════════════════════════════════════════════
    case "mention":
      // Mentions in DM messages - deep link to exact message in chat
      if (resource_type === "dm_message" && data?.conversationId) {
        const conversationId = data.conversationId;
        const messageId = data.messageId || resource_id;
        return `/?openChat=messages&conversation=${conversationId}&message=${messageId}`;
      }
      // Mentions in group messages
      if (resource_type === "group_message" && data?.groupId) {
        const groupId = data.groupId;
        const messageId = data.messageId || resource_id;
        return `/?openChat=messages&group=${groupId}&message=${messageId}`;
      }
      // Mentions in document comments
      if (resource_type === "doc" && resource_id) {
        return `/docs/${resource_id}#comments`;
      }
      // Mentions in resources
      if (resource_type === "resource" && resource_id) {
        return `/resources?highlight=${resource_id}`;
      }
      return "/notifications";

    // ═══════════════════════════════════════════════════════════════════
    // Direct Message Notifications
    // ═══════════════════════════════════════════════════════════════════
    case "dm_message":
    case "new_message":
      // New DM received - open chat to that conversation
      if (data?.conversationId) {
        const conversationId = data.conversationId;
        const messageId = data.messageId || resource_id;
        if (messageId) {
          return `/?openChat=messages&conversation=${conversationId}&message=${messageId}`;
        }
        return `/?openChat=messages&conversation=${conversationId}`;
      }
      // Fallback to inbox
      return "/inbox";

    // ═══════════════════════════════════════════════════════════════════
    // Group Chat Notifications
    // ═══════════════════════════════════════════════════════════════════
    case "group_message":
    case "group_invitation":
    case "group_join":
    case "group_leave":
      if (data?.groupId) {
        const groupId = data.groupId;
        return `/?openChat=messages&group=${groupId}`;
      }
      return "/inbox";

    // ═══════════════════════════════════════════════════════════════════
    // Admin/System Notifications
    // ═══════════════════════════════════════════════════════════════════
    case "admin_notification":
      // Admin notifications can include a custom link
      if (data?.link && typeof data.link === "string") {
        return data.link;
      }
      return "/notifications";

    case "version_update":
      // Version updates link to changelog
      return "/changelog";

    case "system":
      // System notifications (e.g., achievements, version updates)
      if (resource_type === "achievement") {
        return "/profile#achievements";
      }
      // Version update notifications should go to changelog
      // These are sent with type: "system" and data.type: "version_update"
      if (data?.type === "version_update") {
        return "/changelog";
      }
      // Custom link in data
      if (data?.link && typeof data.link === "string") {
        return data.link;
      }
      return "/notifications";

    // ═══════════════════════════════════════════════════════════════════
    // Resource-based fallbacks
    // ═══════════════════════════════════════════════════════════════════
    default:
      // Try to determine link from resource_type
      if (resource_type && resource_id) {
        switch (resource_type) {
          case "doc":
            return `/docs/${resource_id}`;
          case "resource":
            return `/resources?highlight=${resource_id}`;
          case "suggestion":
            return "/profile/suggestions";
          case "comment":
            // If resource_id is a doc ID
            return `/docs/${resource_id}#comments`;
          case "dm_conversation":
            return `/?openChat=messages&conversation=${resource_id}`;
          case "group":
            return `/?openChat=messages&group=${resource_id}`;
          case "user":
            return `/users/${resource_id}`;
        }
      }

      // Ultimate fallback
      return "/notifications";
  }
}

/**
 * Check if a notification URL opens the chat window
 * Used to determine if we need special handling for chat-based notifications
 */
export function isNotificationChatLink(url: string): boolean {
  return url.includes("openChat=messages");
}

/**
 * Extract chat parameters from a notification URL
 * Returns null if not a chat link
 */
export function parseNotificationChatParams(url: string): {
  conversationId?: string;
  groupId?: string;
  messageId?: string;
} | null {
  if (!isNotificationChatLink(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url, "http://localhost");
    return {
      conversationId: urlObj.searchParams.get("conversation") || undefined,
      groupId: urlObj.searchParams.get("group") || undefined,
      messageId: urlObj.searchParams.get("message") || undefined,
    };
  } catch {
    return null;
  }
}
