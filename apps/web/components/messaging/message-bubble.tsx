"use client";

/**
 * Message Bubble Component
 *
 * Displays a single message in a conversation with:
 * - Sender avatar and name with hovercards
 * - Message content with linkified URLs
 * - Special styling for AI-generated messages
 * - Timestamp and "edited" badge
 * - Inline editing for own messages
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";
import type { Message, ReadReceipt } from "@/app/actions/messaging";
import Link from "next/link";
import { ProfileHoverCard, type ProfileHoverCardUser } from "@/components/users/profile-hover-card";
import { ReactionButton } from "./emoji-picker";
import { ReactionDisplay } from "./reaction-display";
import { ReplyPreview, ReplyButton } from "./reply-preview";

/** User data for @mention hover cards */
export interface MentionedUser {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  isOnline?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender?: boolean;
  /** Whether to show avatar (typically only in group chats) */
  showAvatar?: boolean;
  /** Whether this is the first message in a consecutive sender group */
  isFirstInGroup?: boolean;
  /** Whether this is the last message in a consecutive sender group */
  isLastInGroup?: boolean;
  /** Read receipts for this message (only relevant for own messages) */
  readReceipts?: ReadReceipt[];
  /** Conversation type: 'direct' for 1:1, 'group' for group chats */
  conversationType?: "direct" | "group";
  /** Total number of participants in the conversation (excluding sender) */
  participantCount?: number;
  /** Map of lowercase username -> user data for @mention hover cards */
  mentionedUsers?: Record<string, MentionedUser>;
  /** Callback when user edits a message */
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  /** Send status for queued messages (optimistic UI) */
  sendStatus?: "sending" | "failed";
  /** Callback to retry sending a failed message */
  onRetry?: () => void;
  /** Callback to remove a failed message from queue */
  onRemove?: () => void;
  /** Reactions on this message */
  reactions?: import("@/app/actions/messaging").Reaction[];
  /** Callback when user reacts to this message */
  onReact?: (emoji: string) => void;
  /** Callback when user wants to reply to this message */
  onReply?: () => void;
  /** Callback to scroll to the replied message */
  onScrollToMessage?: (messageId: string) => void;
  className?: string;
}

// Match types for unified parsing
interface ContentMatch {
  type: "url" | "markdown-link" | "mention";
  index: number;
  length: number;
  text: string;
  // For markdown links
  linkText?: string;
  linkUrl?: string;
  // For mentions
  username?: string;
}

// Parse and linkify message content (URLs, markdown links, and @mentions)
function linkifyContent(
  content: string,
  mentionedUsers?: Record<string, MentionedUser>
): React.ReactNode[] {
  const matches: ContentMatch[] = [];

  // Match URLs and markdown links
  const urlRegex = /(\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s]+|\/[a-z][^\s]*)/gi;
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    if (match[0].startsWith("[")) {
      matches.push({
        type: "markdown-link",
        index: match.index,
        length: match[0].length,
        text: match[0],
        linkText: match[2] || "link",
        linkUrl: match[3] || "#",
      });
    } else {
      matches.push({
        type: "url",
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }
  }

  // Match @mentions (word boundary before @, followed by alphanumeric/hyphens)
  const mentionRegex = /\B@([a-zA-Z0-9-]+)/g;
  while ((match = mentionRegex.exec(content)) !== null) {
    // Check for overlap with existing matches (e.g., URL containing @)
    const overlaps = matches.some(
      (m) =>
        (match!.index >= m.index && match!.index < m.index + m.length) ||
        (match!.index + match![0].length > m.index &&
          match!.index + match![0].length <= m.index + m.length)
    );
    if (!overlaps) {
      matches.push({
        type: "mention",
        index: match.index,
        length: match[0].length,
        text: match[0],
        username: match[1]?.toLowerCase(),
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.index - b.index);

  // If no matches, return content as-is
  if (matches.length === 0) {
    return [content];
  }

  // Build parts array
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const m of matches) {
    // Add text before the match
    if (m.index > lastIndex) {
      parts.push(content.slice(lastIndex, m.index));
    }

    if (m.type === "markdown-link") {
      parts.push(
        <Link
          key={`md-${m.index}`}
          href={m.linkUrl || "#"}
          className="text-blue-600 dark:text-cyan-400 hover:underline"
        >
          {m.linkText}
        </Link>
      );
    } else if (m.type === "url") {
      const url = m.text;
      const isInternal = url.startsWith("/");
      parts.push(
        <Link
          key={`url-${m.index}`}
          href={url}
          className="text-blue-600 dark:text-cyan-400 hover:underline"
          {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}
        >
          {isInternal ? url : url.replace(/^https?:\/\//, "")}
        </Link>
      );
    } else if (m.type === "mention" && m.username) {
      const user = mentionedUsers?.[m.username];
      if (user) {
        // Render with ProfileHoverCard
        const hoverUser: ProfileHoverCardUser = {
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          bio: user.bio,
          isOnline: user.isOnline,
        };
        parts.push(
          <ProfileHoverCard key={`mention-${m.index}`} user={hoverUser} compact>
            <Link
              href={`/users/${user.username}`}
              className={cn(
                "inline-flex items-center font-medium",
                "text-blue-600 dark:text-cyan-400",
                "hover:underline"
              )}
            >
              @{user.username}
            </Link>
          </ProfileHoverCard>
        );
      } else {
        // Fallback: simple link without hover card
        parts.push(
          <Link
            key={`mention-${m.index}`}
            href={`/users/${m.username}`}
            className={cn(
              "inline-flex items-center font-medium",
              "text-blue-600 dark:text-cyan-400",
              "hover:underline"
            )}
          >
            @{m.username}
          </Link>
        );
      }
    }

    lastIndex = m.index + m.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

// Format timestamp
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ============================================
// READ RECEIPT STACKING (Matrix SDK pattern)
// ============================================

// Maximum number of avatars to show before "+N" overflow
const MAX_VISIBLE_AVATARS = 3;
// Horizontal offset for each stacked avatar (px)
const AVATAR_OFFSET_PX = 10;
// Avatar size for read receipts (px)
const RECEIPT_AVATAR_SIZE = 14;

// Format read receipt status for display
function formatReadStatus(
  readReceipts: ReadReceipt[] | undefined,
  conversationType: "direct" | "group",
  _participantCount: number
): { status: "delivered" | "seen" | "seen_by"; seenBy?: string[] } {
  if (!readReceipts || readReceipts.length === 0) {
    return { status: "delivered" };
  }

  if (conversationType === "direct") {
    // For 1:1 conversations, just show "Seen" if the other person has read it
    return { status: "seen" };
  }

  // For group conversations, show who has seen it
  const seenByNames = readReceipts
    .map((r) => r.userName || r.userUsername || "Someone")
    .slice(0, 3); // Limit to first 3 names

  return {
    status: "seen_by",
    seenBy: seenByNames,
  };
}

/**
 * Stacked Read Receipt Avatars Component (Matrix SDK pattern)
 *
 * Shows up to MAX_VISIBLE_AVATARS stacked horizontally, with a "+N" badge
 * for overflow. This matches the UX of popular chat applications.
 */
function StackedReadReceipts({ receipts }: { receipts: ReadReceipt[] }) {
  if (!receipts || receipts.length === 0) return null;

  const visibleReceipts = receipts.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = receipts.length - MAX_VISIBLE_AVATARS;

  // Calculate container width based on stacked avatars
  const containerWidth =
    visibleReceipts.length * AVATAR_OFFSET_PX +
    RECEIPT_AVATAR_SIZE +
    (overflowCount > 0 ? 20 : 0); // Extra space for overflow badge

  return (
    <div
      className="relative flex items-center"
      style={{ width: `${containerWidth}px`, height: `${RECEIPT_AVATAR_SIZE}px` }}
      title={receipts.map((r) => r.userName || r.userUsername || "Someone").join(", ")}
    >
      {visibleReceipts.map((receipt, index) => (
        <div
          key={receipt.readAt + receipt.userId}
          className="absolute rounded-full overflow-hidden border border-white dark:border-gray-800"
          style={{
            left: `${index * AVATAR_OFFSET_PX}px`,
            zIndex: MAX_VISIBLE_AVATARS - index,
            width: `${RECEIPT_AVATAR_SIZE}px`,
            height: `${RECEIPT_AVATAR_SIZE}px`,
          }}
        >
          {receipt.userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receipt.userAvatar}
              alt={receipt.userName || "User"}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center text-[8px] font-medium",
                "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
              )}
            >
              {(receipt.userName || receipt.userUsername || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {overflowCount > 0 && (
        <span
          className="absolute text-[10px] text-gray-500 dark:text-gray-400 font-medium"
          style={{
            left: `${visibleReceipts.length * AVATAR_OFFSET_PX + RECEIPT_AVATAR_SIZE + 2}px`,
          }}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

export function MessageBubble({
  message,
  isOwnMessage,
  showSender = true,
  showAvatar = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  readReceipts,
  conversationType = "direct",
  participantCount = 1,
  mentionedUsers,
  onEdit,
  sendStatus,
  onRetry,
  onRemove,
  reactions,
  onReact,
  onReply,
  onScrollToMessage,
  className,
}: MessageBubbleProps) {
  const isAI = message.senderId === AI_ASSISTANT_USER_ID || message.isAiGenerated;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content || !onEdit) {
      setIsEditing(false);
      setEditContent(message.content);
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message.id, editContent);
      setIsEditing(false);
    } catch {
      // Reset on error
      setEditContent(message.content);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  // Handle keyboard in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancelEdit();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  // Calculate read status for own messages
  const readStatus = isOwnMessage
    ? formatReadStatus(readReceipts, conversationType, participantCount)
    : null;

  // Build user data for hover card
  const senderUser: ProfileHoverCardUser | null = !isOwnMessage && !isAI ? {
    id: message.senderId,
    name: message.senderName || "Unknown",
    displayName: message.senderName,
    username: message.senderUsername,
    avatarUrl: message.senderAvatar,
    image: message.senderAvatar,
  } : null;

  // Avatar component for reuse
  const renderAvatar = () => {
    if (isAI && message.senderAvatar) {
      // AI Assistant avatar from database (Supabase storage)
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center overflow-hidden cursor-default">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.senderAvatar}
            alt="Claude Insider AI"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      );
    }
    if (isAI) {
      // AI Assistant fallback (gradient with initials)
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center cursor-default">
          <span className="text-white text-xs font-bold">CI</span>
        </div>
      );
    }
    if (message.senderAvatar) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={message.senderAvatar}
          alt={message.senderName || "User"}
          className="w-8 h-8 rounded-full object-cover cursor-pointer"
          loading="lazy"
          decoding="async"
        />
      );
    }
    return (
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer",
          "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
        )}
      >
        {message.senderName?.charAt(0).toUpperCase() || "?"}
      </div>
    );
  };

  // Determine vertical spacing based on grouping
  // First in group: more top margin, Last in group: more bottom margin
  const groupSpacingClass = cn(
    isFirstInGroup ? "mt-3" : "mt-0.5",
    isLastInGroup ? "mb-1" : "mb-0"
  );

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
        groupSpacingClass,
        className
      )}
    >
      {/* Avatar column - only shown in group chats */}
      {!isOwnMessage && showAvatar && (
        <div className="flex-shrink-0 w-8">
          {showSender && isFirstInGroup ? (
            senderUser ? (
              <ProfileHoverCard user={senderUser} side="top" compact>
                {renderAvatar()}
              </ProfileHoverCard>
            ) : (
              renderAvatar()
            )
          ) : (
            // Empty placeholder to maintain alignment in groups
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {/* Sender name with hover card - only show for first message in group */}
        {showSender && isFirstInGroup && !isOwnMessage && (
          senderUser ? (
            <ProfileHoverCard user={senderUser} side="top" compact>
              <span
                className={cn(
                  "text-xs font-medium mb-0.5 ml-1 cursor-pointer hover:underline",
                  "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400"
                )}
              >
                {message.senderName || "Unknown"}
                {message.senderUsername && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500">@{message.senderUsername}</span>
                )}
              </span>
            </ProfileHoverCard>
          ) : (
            <span
              className={cn(
                "text-xs font-medium mb-0.5 ml-1",
                isAI
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {isAI ? "Claude Insider" : message.senderName || "Unknown"}
            </span>
          )
        )}

        {/* Reply preview - shown above the message bubble */}
        {message.replyToMessage && (
          <ReplyPreview
            senderName={message.replyToMessage.senderName || "Unknown"}
            content={message.replyToMessage.content}
            isDeleted={message.replyToMessage.isDeleted}
            variant="bubble"
            onClickMessage={
              onScrollToMessage && message.replyToMessageId
                ? () => onScrollToMessage(message.replyToMessageId!)
                : undefined
            }
            className="mb-1 max-w-[90%]"
          />
        )}

        {/* Bubble - rounded corners vary based on position in group */}
        <div className="relative group/bubble">
          {isEditing ? (
            // Edit mode - inline textarea
            <div
              className={cn(
                "px-3 py-2 rounded-2xl",
                "bg-blue-600/10 dark:bg-blue-600/20 border-2 border-blue-500"
              )}
            >
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                disabled={isSaving}
                className={cn(
                  "w-full min-w-[200px] resize-none bg-transparent",
                  "text-sm text-gray-900 dark:text-white",
                  "focus:outline-none",
                  isSaving && "opacity-50"
                )}
                rows={Math.min(editContent.split("\n").length + 1, 5)}
              />
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-blue-500/30">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    "bg-blue-600 text-white",
                    "hover:bg-blue-700 disabled:opacity-50"
                  )}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Press Enter to save, Esc to cancel
              </p>
            </div>
          ) : (
            // Normal mode - message content with edit button
            <>
              <div
                className={cn(
                  "px-4 py-2",
                  isOwnMessage
                    ? cn(
                        "bg-blue-600 text-white",
                        // Rounded corners based on position in group
                        isFirstInGroup && isLastInGroup
                          ? "rounded-2xl rounded-br-md"
                          : isFirstInGroup
                          ? "rounded-2xl rounded-br-md rounded-bl-2xl"
                          : isLastInGroup
                          ? "rounded-2xl rounded-br-md rounded-tr-md"
                          : "rounded-2xl rounded-r-md",
                        // Sending/failed states
                        sendStatus === "sending" && "opacity-60",
                        sendStatus === "failed" && "bg-red-600"
                      )
                    : isAI
                    ? cn(
                        "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-gray-900 dark:text-gray-100",
                        isFirstInGroup && isLastInGroup
                          ? "rounded-2xl rounded-bl-md"
                          : isFirstInGroup
                          ? "rounded-2xl rounded-bl-md rounded-br-2xl"
                          : isLastInGroup
                          ? "rounded-2xl rounded-bl-md rounded-tl-md"
                          : "rounded-2xl rounded-l-md"
                      )
                    : cn(
                        "bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100",
                        // Rounded corners based on position in group
                        isFirstInGroup && isLastInGroup
                          ? "rounded-2xl rounded-bl-md"
                          : isFirstInGroup
                          ? "rounded-2xl rounded-bl-md rounded-br-2xl"
                          : isLastInGroup
                          ? "rounded-2xl rounded-bl-md rounded-tl-md"
                          : "rounded-2xl rounded-l-md"
                      )
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {linkifyContent(message.content, mentionedUsers)}
                </p>
              </div>

              {/* Message actions - show on hover */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5",
                  "opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150",
                  isOwnMessage ? "-left-20" : "-right-20"
                )}
              >
                {/* Reply button */}
                {onReply && !sendStatus && (
                  <ReplyButton onClick={onReply} />
                )}

                {/* Edit button - for own messages (not AI) */}
                {isOwnMessage && onEdit && !isAI && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={cn(
                      "p-1.5 rounded-full",
                      "bg-gray-100 dark:bg-gray-800",
                      "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                      "focus:opacity-100"
                    )}
                    title="Edit message"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}

                {/* Reaction button */}
                {onReact && !sendStatus && (
                  <ReactionButton
                    onReact={onReact}
                    className="opacity-100"
                  />
                )}
              </div>
            </>
          )}

          {/* Reaction display - show below message */}
          {reactions && reactions.length > 0 && onReact && (
            <ReactionDisplay
              reactions={reactions}
              onReact={onReact}
              className={isOwnMessage ? "justify-end" : "justify-start"}
            />
          )}
        </div>

        {/* Timestamp and read status - only show for last message in group */}
        {isLastInGroup && (
          <div
            className={cn(
              "flex items-center gap-1.5 mt-0.5",
              isOwnMessage ? "mr-1 flex-row-reverse" : "ml-1"
            )}
          >
            {/* Sending/Failed status for queued messages */}
            {sendStatus === "sending" && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            )}
            {sendStatus === "failed" && (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-red-500 dark:text-red-400">Failed to send</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-blue-500 hover:text-blue-600 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium"
                  >
                    Retry
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={onRemove}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Remove message"
                  >
                    ×
                  </button>
                )}
              </span>
            )}
            {/* Normal timestamp when not queued */}
            {!sendStatus && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.createdAt)}
                {message.editedAt && " (edited)"}
              </span>
            )}

            {/* Read status for own messages */}
            {isOwnMessage && readStatus && (
              <span className="flex items-center gap-1.5 text-xs">
                {readStatus.status === "delivered" && (
                  <>
                    {/* Single check mark for delivered */}
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-400 dark:text-gray-500">Delivered</span>
                  </>
                )}
                {readStatus.status === "seen" && (
                  <>
                    {/* Double check mark for seen (1:1 conversation) */}
                    <svg
                      className="w-4 h-4 text-blue-500 dark:text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      {/* First checkmark */}
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 13l4 4L16 7" />
                      {/* Second checkmark, offset to the right */}
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l4 4L22 7" />
                    </svg>
                    <span className="text-blue-500 dark:text-cyan-400">Seen</span>
                  </>
                )}
                {readStatus.status === "seen_by" && readReceipts && readReceipts.length > 0 && (
                  <>
                    {/* Stacked avatars for group conversation (Matrix SDK pattern) */}
                    <StackedReadReceipts receipts={readReceipts} />
                    <span className="text-blue-500 dark:text-cyan-400 ml-0.5">Seen</span>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TYPING INDICATOR
// ============================================

interface TypingIndicatorProps {
  names: string[];
  className?: string;
}

export function TypingIndicator({ names, className }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const displayNames =
    names.length === 1
      ? names[0]
      : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names[0]} and ${names.length - 1} others`;

  return (
    <div className={cn("flex items-center gap-2 text-sm text-gray-500", className)}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{displayNames} typing...</span>
    </div>
  );
}

// ============================================
// DATE SEPARATOR
// ============================================

interface DateSeparatorProps {
  date: string;
  className?: string;
}

export function DateSeparator({ date, className }: DateSeparatorProps) {
  const dateObj = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (dateObj.toDateString() === today.toDateString()) {
    label = "Today";
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className={cn("flex items-center gap-3 my-4", className)}>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default MessageBubble;
