"use client";

/**
 * Feedback Button
 *
 * Floating button that opens the feedback modal.
 * Only visible to beta testers.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { FeedbackModal } from "./feedback-modal";

export function FeedbackButton() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Only show for beta testers
  if (!isAuthenticated || !user?.isBetaTester) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed bottom-6 right-24 z-40", // Positioned left of VoiceAssistant button
          "flex items-center gap-2",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white shadow-lg shadow-blue-500/25",
          "rounded-full transition-all duration-300",
          isHovered ? "px-5 py-3" : "p-4"
        )}
        aria-label="Send feedback"
      >
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span
          className={cn(
            "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
            isHovered ? "w-auto opacity-100" : "w-0 opacity-0"
          )}
        >
          Send Feedback
        </span>
      </button>

      {/* Feedback modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
