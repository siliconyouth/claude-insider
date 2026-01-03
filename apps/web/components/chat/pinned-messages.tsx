/**
 * Pinned Messages Components
 *
 * UI for viewing and managing pinned messages in conversations:
 * - PinnedMessagesBadge: Shows pin count in header
 * - PinnedMessagesPanel: Slide-out panel with all pins
 * - PinnedMessageCard: Individual pin display
 * - PinIndicator: Shows pin icon on pinned messages
 *
 * Usage:
 * ```tsx
 * <PinnedMessagesBadge count={3} onClick={() => setShowPanel(true)} />
 * <PinnedMessagesPanel
 *   conversationId={id}
 *   onClose={() => setShowPanel(false)}
 *   onJumpToMessage={(id) => scrollToMessage(id)}
 * />
 * ```
 */

"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import {
  getPinnedMessages,
  unpinMessage,
  type PinnedMessage,
} from "@/app/actions/pinning";

// ============================================================================
// TYPES
// ============================================================================

export interface PinnedMessagesBadgeProps {
  /** Number of pinned messages */
  count: number;
  /** Click handler to open panel */
  onClick: () => void;
  /** Additional class name */
  className?: string;
}

export interface PinnedMessagesPanelProps {
  /** Conversation ID */
  conversationId: string;
  /** Whether panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Handler to jump to message in conversation */
  onJumpToMessage: (messageId: string) => void;
  /** Whether current user can unpin */
  canUnpin?: boolean;
}

export interface PinnedMessageCardProps {
  /** Pinned message data */
  pin: PinnedMessage;
  /** Click handler to jump to message */
  onJump: () => void;
  /** Unpin handler */
  onUnpin?: () => void;
  /** Whether unpin is in progress */
  isUnpinning?: boolean;
}

export interface PinIndicatorProps {
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

// ============================================================================
// PINNED MESSAGES BADGE
// ============================================================================

export const PinnedMessagesBadge = memo(function PinnedMessagesBadge({
  count,
  onClick,
  className,
}: PinnedMessagesBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg",
        "bg-amber-50 dark:bg-amber-900/20",
        "text-amber-600 dark:text-amber-400",
        "hover:bg-amber-100 dark:hover:bg-amber-900/30",
        "transition-colors",
        "text-sm font-medium",
        className
      )}
      title={`${count} pinned message${count !== 1 ? "s" : ""}`}
    >
      <PinIcon className="w-4 h-4" />
      <span>{count}</span>
    </button>
  );
});

// ============================================================================
// PINNED MESSAGES PANEL
// ============================================================================

export const PinnedMessagesPanel = memo(function PinnedMessagesPanel({
  conversationId,
  isOpen,
  onClose,
  onJumpToMessage,
  canUnpin = false,
}: PinnedMessagesPanelProps) {
  const [pins, setPins] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unpinningId, setUnpinningId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch pinned messages
  useEffect(() => {
    if (!isOpen) return;

    async function fetchPins() {
      setLoading(true);
      setError(null);

      const result = await getPinnedMessages(conversationId);

      if (result.success && result.pins) {
        setPins(result.pins);
      } else {
        setError(result.error || "Failed to load pinned messages");
      }

      setLoading(false);
    }

    fetchPins();
  }, [conversationId, isOpen]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleUnpin = useCallback(async (pin: PinnedMessage) => {
    setUnpinningId(pin.id);

    const result = await unpinMessage(pin.conversationId, pin.messageId);

    if (result.success) {
      setPins((prev) => prev.filter((p) => p.id !== pin.id));
    }

    setUnpinningId(null);
  }, []);

  const handleJump = useCallback(
    (messageId: string) => {
      onJumpToMessage(messageId);
      onClose();
    },
    [onJumpToMessage, onClose]
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md",
          "bg-white dark:bg-[#111111]",
          "border-l border-gray-200 dark:border-[#262626]",
          "shadow-xl",
          "flex flex-col",
          "animate-in slide-in-from-right duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Pinned messages"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <PinIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold ui-text-heading">
              Pinned Messages
            </h2>
            {pins.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 ui-text-secondary">
                {pins.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close panel"
          >
            <CloseIcon className="w-5 h-5 ui-text-secondary" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : pins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
              <PinIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-lg font-medium ui-text-heading mb-1">
                No pinned messages
              </p>
              <p className="text-sm ui-text-secondary">
                Pin important messages to find them quickly
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pins.map((pin) => (
                <PinnedMessageCard
                  key={pin.id}
                  pin={pin}
                  onJump={() => handleJump(pin.messageId)}
                  onUnpin={canUnpin ? () => handleUnpin(pin) : undefined}
                  isUnpinning={unpinningId === pin.id}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
});

// ============================================================================
// PINNED MESSAGE CARD
// ============================================================================

export const PinnedMessageCard = memo(function PinnedMessageCard({
  pin,
  onJump,
  onUnpin,
  isUnpinning,
}: PinnedMessageCardProps) {
  const formattedDate = formatRelativeTime(pin.pinnedAt);
  const messagePreview = truncateText(pin.messageContent || "[No content]", 150);

  return (
    <article className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      {/* Pin metadata */}
      <div className="flex items-center gap-2 mb-2 text-xs ui-text-secondary">
        <span>Pinned by {pin.pinnedByName || "Unknown"}</span>
        <span>•</span>
        <time dateTime={pin.pinnedAt}>{formattedDate}</time>
      </div>

      {/* Message content */}
      <button
        onClick={onJump}
        className="w-full text-left group"
      >
        <div className="flex items-start gap-3">
          {/* Sender avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-white">
              {(pin.messageSenderName ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Sender name */}
            <p className="text-sm font-medium ui-text-heading mb-0.5">
              {pin.messageSenderName || "Unknown"}
            </p>

            {/* Message preview */}
            <p className="text-sm ui-text-secondary line-clamp-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {messagePreview}
            </p>

            {/* Pin note */}
            {pin.note && (
              <p className="mt-1.5 text-xs italic text-amber-600 dark:text-amber-400">
                &ldquo;{pin.note}&rdquo;
              </p>
            )}
          </div>

          {/* Jump icon */}
          <ChevronRightIcon className="w-4 h-4 ui-text-secondary group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
        </div>
      </button>

      {/* Unpin button */}
      {onUnpin && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onUnpin}
            disabled={isUnpinning}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
              "text-gray-500 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "hover:text-red-500 dark:hover:text-red-400",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isUnpinning ? (
              <LoadingSpinner size="sm" />
            ) : (
              <UnpinIcon className="w-3.5 h-3.5" />
            )}
            Unpin
          </button>
        </div>
      )}
    </article>
  );
});

// ============================================================================
// PIN INDICATOR (FOR MESSAGE BUBBLES)
// ============================================================================

export const PinIndicator = memo(function PinIndicator({
  size = "sm",
  className,
}: PinIndicatorProps) {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <span
      className={cn(
        "text-amber-500 dark:text-amber-400",
        className
      )}
      title="Pinned message"
    >
      <PinIcon className={sizeClass} />
    </span>
  );
});

// ============================================================================
// LOADING SPINNER
// ============================================================================

interface LoadingSpinnerProps {
  size?: "sm" | "md";
}

function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-5 h-5";

  return (
    <svg
      className={cn("animate-spin text-gray-400", sizeClass)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
        className="opacity-75"
      />
    </svg>
  );
}

// ============================================================================
// SVG ICONS
// ============================================================================

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

function UnpinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M12 17v5" />
      <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h6" />
      <path d="M15 9.34V4h1V2H7v2h1v2.34" />
      <path d="M18.42 12.76l.47.24A2 2 0 0 1 20 15.24V17h-8" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
