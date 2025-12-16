"use client";

/**
 * Message Bubble Component
 *
 * Displays a single message in a conversation with:
 * - Sender avatar and name
 * - Message content with linkified URLs
 * - Special styling for AI-generated messages
 * - Timestamp
 */

import { cn } from "@/lib/design-system";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";
import type { Message } from "@/app/actions/messaging";
import Link from "next/link";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender?: boolean;
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
  className,
}: MessageBubbleProps) {
  const isAI = message.senderId === AI_ASSISTANT_USER_ID || message.isAiGenerated;

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* Avatar */}
      {showSender && !isOwnMessage && (
        <div className="flex-shrink-0">
          {isAI ? (
            // AI Assistant uses website logo
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192x192.png"
                alt="Claude Insider AI"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          ) : message.senderAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.senderAvatar}
              alt={message.senderName || "User"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
              )}
            >
              {message.senderName?.charAt(0).toUpperCase() || "?"}
            </div>
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
        {/* Sender name */}
        {showSender && !isOwnMessage && (
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
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isOwnMessage
              ? "bg-blue-600 text-white rounded-br-sm"
              : isAI
              ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
              : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 rounded-bl-sm"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {linkifyContent(message.content)}
          </p>
        </div>

        {/* Timestamp */}
        <span
          className={cn(
            "text-xs text-gray-500 dark:text-gray-400 mt-0.5",
            isOwnMessage ? "mr-1" : "ml-1"
          )}
        >
          {formatTime(message.createdAt)}
          {message.editedAt && " (edited)"}
        </span>
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
