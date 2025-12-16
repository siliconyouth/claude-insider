"use client";

/**
 * Floating Chat Button
 *
 * Bottom-right floating action button that opens the unified chat window.
 * Remembers the last opened tab and supports keyboard shortcut (Cmd + .).
 *
 * Design System Compliant:
 * - Uses gradient from designSystem.gradients.button.primary
 * - Glass morphism tooltip (designSystem.glass.header)
 * - Focus states from designSystem.animations.focus.ring
 * - Glow effects from designSystem.shadows.glow
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { useUnifiedChat } from "./unified-chat-provider";
import { useAnnouncer } from "@/hooks/use-aria-live";
import { cn } from "@/lib/design-system";

const LAST_TAB_KEY = "claude-insider-last-chat-tab";

export function FloatingChatButton() {
  const [mounted, setMounted] = useState(false);
  const { isOpen, openUnifiedChat, activeTab } = useUnifiedChat();
  const { announce } = useAnnouncer();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save the active tab when it changes
  useEffect(() => {
    if (mounted && isOpen) {
      try {
        localStorage.setItem(LAST_TAB_KEY, activeTab);
      } catch {
        // localStorage not available
      }
    }
  }, [activeTab, isOpen, mounted]);

  // Open chat with last used tab (or "ai" for first time)
  const handleOpen = useCallback(() => {
    let lastTab: "ai" | "messages" = "ai";
    try {
      const saved = localStorage.getItem(LAST_TAB_KEY);
      if (saved === "ai" || saved === "messages") {
        lastTab = saved;
      }
    } catch {
      // localStorage not available
    }

    openUnifiedChat(lastTab);
    track("assistant_opened", { page: pathname, tab: lastTab });
    announce(`Chat opened to ${lastTab === "ai" ? "AI Assistant" : "Messages"}`);
  }, [openUnifiedChat, pathname, announce]);

  // Keyboard shortcut: Cmd/Ctrl + .
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        if (!isOpen) {
          handleOpen();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleOpen]);

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "transition-all duration-300 ease-out",
        isOpen
          ? "scale-0 opacity-0 pointer-events-none"
          : "scale-100 opacity-100"
      )}
    >
      {/* Attention-grabbing pulse ring */}
      <div
        className={cn(
          "absolute inset-0 -m-1 rounded-full",
          "bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500",
          "animate-ping opacity-20"
        )}
        aria-hidden="true"
      />

      {/* Secondary glow ring */}
      <div
        className={cn(
          "absolute inset-0 -m-2 rounded-full",
          "bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30",
          "blur-md"
        )}
        aria-hidden="true"
      />

      {/* Tooltip Balloon - Glass morphism */}
      <div className="absolute bottom-full right-0 mb-3 w-56 animate-bounce">
        <div
          className={cn(
            "relative rounded-xl px-3 py-2 text-sm",
            // Glass morphism effect
            "bg-white/90 dark:bg-gray-900/90",
            "backdrop-blur-lg",
            // Border and shadow
            "border border-gray-200/50 dark:border-gray-700/50",
            "shadow-xl shadow-black/5 dark:shadow-black/20"
          )}
        >
          {/* Gradient accent line at top */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5 rounded-t-xl",
              "bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500"
            )}
          />

          <span className="font-semibold bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            AI Assistant
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {" "}
            (Cmd + . or click)
          </span>

          {/* Arrow - Light mode */}
          <div
            className="absolute -bottom-2 right-6 h-0 w-0 dark:hidden"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid rgba(255, 255, 255, 0.9)",
            }}
          />
          {/* Arrow - Dark mode */}
          <div
            className="absolute -bottom-2 right-6 hidden h-0 w-0 dark:block"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid rgba(17, 24, 39, 0.9)",
            }}
          />
        </div>
      </div>

      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={cn(
          // Size and shape
          "relative flex h-14 w-14 items-center justify-center rounded-full",
          // Gradient background (designSystem.gradients.button.primary)
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white",
          // Shadow with glow (designSystem.shadows.glow)
          "shadow-lg shadow-blue-500/25",
          // Hover effects (designSystem.animations.hover)
          "transition-all duration-200 ease-out",
          "hover:scale-110 hover:-translate-y-0.5",
          "hover:shadow-xl hover:shadow-blue-500/40",
          "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
          // Focus states (designSystem.animations.focus.ring)
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
          // Active state
          "active:scale-95"
        )}
        aria-label="Open AI Assistant"
        title="AI Assistant (Cmd + . or click to activate)"
      >
        {/* Icon */}
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </div>
  );
}
