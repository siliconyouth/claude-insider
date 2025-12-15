"use client";

/**
 * Inbox Chat Modal Component
 *
 * Modal overlay for viewing and responding to conversations.
 * Slides up from the bottom on mobile, centered on desktop.
 * Uses ConversationView for the chat interface.
 */

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { ConversationView } from "./conversation-view";
import { type Conversation } from "@/app/actions/messaging";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface InboxChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: string;
}

export function InboxChatModal({
  isOpen,
  onClose,
  conversation,
  currentUserId,
}: InboxChatModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { containerRef: focusTrapRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
    closeOnEscape: true,
  });

  // Get other participant for header
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Setup event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  // Don't render if not open
  if (!isOpen) return null;

  // Portal content
  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-[100]",
        "flex items-end sm:items-center justify-center",
        "bg-black/50 backdrop-blur-sm",
        "animate-fade-in"
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
    >
      <div
        ref={(node) => {
          modalRef.current = node;
          if (focusTrapRef && "current" in focusTrapRef) {
            (focusTrapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn(
          "relative w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl",
          "h-[85vh] sm:h-[600px] max-h-[85vh]",
          "bg-white dark:bg-[#0a0a0a]",
          "rounded-t-2xl sm:rounded-2xl",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/20",
          "flex flex-col overflow-hidden",
          "animate-slide-in-bottom sm:animate-scale-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3",
            "border-b border-gray-200 dark:border-[#262626]",
            "bg-gray-50/50 dark:bg-[#111111]"
          )}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {otherParticipant?.avatarUrl ? (
                <img
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant.displayName || otherParticipant.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(
                      otherParticipant?.displayName ||
                      otherParticipant?.name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              {otherParticipant?.status === "online" && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0a0a0a] rounded-full" />
              )}
            </div>

            <div>
              <h2
                id="chat-modal-title"
                className="font-semibold text-gray-900 dark:text-white"
              >
                {otherParticipant?.displayName ||
                  otherParticipant?.name ||
                  "Unknown"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {otherParticipant?.status === "online"
                  ? "Online"
                  : otherParticipant?.status === "idle"
                  ? "Away"
                  : "Offline"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Open in full page */}
            <a
              href={`/inbox?conversation=${conversation.id}`}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "text-gray-500 hover:text-gray-700",
                "dark:text-gray-400 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
              title="Open in full page"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>

            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "text-gray-500 hover:text-gray-700",
                "dark:text-gray-400 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
              title="Close"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
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
          </div>
        </div>

        {/* Conversation View */}
        <div className="flex-1 overflow-hidden">
          <ConversationView
            conversationId={conversation.id}
            currentUserId={currentUserId}
            participants={conversation.participants}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );

  // Render via portal
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}

export default InboxChatModal;
