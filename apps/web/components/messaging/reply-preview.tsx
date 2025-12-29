"use client";

/**
 * Reply Preview Component
 *
 * Shows a compact preview of the message being replied to.
 * Used both in the message bubble (showing context) and in the composer (showing what we're replying to).
 * Follows Matrix SDK pattern for reply threading UI.
 */

import { cn } from "@/lib/design-system";

interface ReplyPreviewProps {
  /** Sender name of the original message */
  senderName: string;
  /** Content of the original message (will be truncated) */
  content: string;
  /** Whether the original message was deleted */
  isDeleted?: boolean;
  /** Whether this is shown in the composer (dismissible) vs in a message bubble (static) */
  variant?: "composer" | "bubble";
  /** Callback to dismiss/cancel reply (only for composer variant) */
  onDismiss?: () => void;
  /** Callback to scroll to the original message */
  onClickMessage?: () => void;
  className?: string;
}

export function ReplyPreview({
  senderName,
  content,
  isDeleted,
  variant = "bubble",
  onDismiss,
  onClickMessage,
  className,
}: ReplyPreviewProps) {
  // Truncate content for preview
  const truncatedContent = content.length > 100 ? content.slice(0, 100) + "..." : content;

  const isComposer = variant === "composer";

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isComposer
          ? "px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] border-l-2 border-blue-500 rounded-r-lg"
          : "pl-2 border-l-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors",
        className
      )}
      onClick={onClickMessage}
      role={onClickMessage ? "button" : undefined}
      tabIndex={onClickMessage ? 0 : undefined}
    >
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium truncate",
            isDeleted
              ? "text-gray-400 dark:text-gray-500"
              : "text-blue-600 dark:text-blue-400"
          )}
        >
          {senderName}
        </p>
        <p
          className={cn(
            "text-xs truncate",
            isDeleted
              ? "text-gray-400 dark:text-gray-500 italic"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          {truncatedContent}
        </p>
      </div>

      {isComposer && onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={cn(
            "p-1 rounded-full shrink-0",
            "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            "transition-colors"
          )}
          title="Cancel reply"
          aria-label="Cancel reply"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Reply Button Component
 * Shows in message hover actions to initiate a reply
 */
interface ReplyButtonProps {
  onClick: () => void;
  className?: string;
}

export function ReplyButton({ onClick, className }: ReplyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-full",
        "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "transition-colors",
        className
      )}
      title="Reply"
      aria-label="Reply to this message"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
        />
      </svg>
    </button>
  );
}
