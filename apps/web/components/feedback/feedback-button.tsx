"use client";

/**
 * Feedback Button
 *
 * Floating button that opens the feedback modal.
 * Only visible to beta testers.
 * Positioned at center-right of page with bug icon for bug reporting.
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
      {/* Floating button - positioned center-right of page */}
      <div
        className={cn(
          "fixed top-1/2 right-6 z-40 -translate-y-1/2",
          "transition-all duration-300"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip on hover */}
        {isHovered && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap">
            <div className="relative rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow-lg dark:bg-gray-800 dark:text-white">
              <span className="font-semibold text-violet-500 dark:text-violet-400">Report Bug</span>
              <span className="text-gray-600 dark:text-gray-300"> or Feedback</span>
              {/* Arrow pointing right */}
              <div
                className="absolute top-1/2 -right-2 -translate-y-1/2 h-0 w-0 dark:hidden"
                style={{
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: "8px solid white",
                }}
              />
              <div
                className="absolute top-1/2 -right-2 -translate-y-1/2 h-0 w-0 hidden dark:block"
                style={{
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: "8px solid rgb(31, 41, 55)",
                }}
              />
            </div>
          </div>
        )}

        {/* Main Button - same size as AI Assistant (h-14 w-14) */}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-lg shadow-blue-500/25",
            "transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "dark:focus:ring-offset-gray-950"
          )}
          aria-label="Report bug or send feedback"
          title="Report Bug or Feedback (Beta Tester)"
        >
          {/* Bug/Beetle Icon */}
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {/* Bug head */}
            <circle cx="12" cy="6" r="2" strokeWidth={2} />
            {/* Antennae */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 5L8 2M14 5l2-3"
            />
            {/* Bug body - oval */}
            <ellipse cx="12" cy="14" rx="5" ry="6" strokeWidth={2} />
            {/* Body line */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v12"
            />
            {/* Left legs */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 11L4 9M7 14L3 14M7 17L4 19"
            />
            {/* Right legs */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 11l3-2M17 14h4M17 17l3 2"
            />
          </svg>
        </button>
      </div>

      {/* Feedback modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
