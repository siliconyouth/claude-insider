"use client";

/**
 * Message Bubble Component
 *
 * Displays a single message in a conversation with:
 * - Sender avatar and name with hovercards
 * - Message content with linkified URLs
 * - Special styling for AI-generated messages
 * - Timestamp
 */

import { cn } from "@/lib/design-system";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";
import type { Message } from "@/app/actions/messaging";
import Link from "next/link";
import { ProfileHoverCard, type ProfileHoverCardUser } from "@/components/users/profile-hover-card";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender?: boolean;
  /** Whether this is the first message in a consecutive sender group */
  isFirstInGroup?: boolean;
  /** Whether this is the last message in a consecutive sender group */
  isLastInGroup?: boolean;
  className?: string;
}

// Parse and linkify message content
function linkifyContent(content: string): React.ReactNode[] {
  // Match URLs and internal links
  const urlRegex = /(\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s]+|\/[a-z][^\s]*)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Check if it's a markdown link
    if (match[0].startsWith("[")) {
      const linkText = match[2] || "link";
      const linkUrl = match[3] || "#";
      parts.push(
        <Link
          key={match.index}
          href={linkUrl}
          className="text-blue-600 dark:text-cyan-400 hover:underline"
        >
          {linkText}
        </Link>
      );
    } else {
      // Regular URL or internal path
      const url = match[0];
      const isInternal = url.startsWith("/");
      parts.push(
        <Link
          key={match.index}
          href={url}
          className="text-blue-600 dark:text-cyan-400 hover:underline"
          {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}
        >
          {isInternal ? url : url.replace(/^https?:\/\//, "")}
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
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

export function MessageBubble({
  message,
  isOwnMessage,
  showSender = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  className,
}: MessageBubbleProps) {
  const isAI = message.senderId === AI_ASSISTANT_USER_ID || message.isAiGenerated;

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
      {/* Avatar column - maintains alignment for grouped messages */}
      {!isOwnMessage && (
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
            // Empty placeholder to maintain alignment
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

        {/* Bubble - rounded corners vary based on position in group */}
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
                    : "rounded-2xl rounded-r-md"
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
            {linkifyContent(message.content)}
          </p>
        </div>

        {/* Timestamp - only show for last message in group */}
        {isLastInGroup && (
          <span
            className={cn(
              "text-xs text-gray-500 dark:text-gray-400 mt-0.5",
              isOwnMessage ? "mr-1" : "ml-1"
            )}
          >
            {formatTime(message.createdAt)}
            {message.editedAt && " (edited)"}
          </span>
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
