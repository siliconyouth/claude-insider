"use client";

/**
 * Unified Chat Window
 *
 * Main window component that renders via portal.
 * Contains tabs for AI Assistant and Messages.
 *
 * Performance: Uses dynamic imports for chat tabs to reduce initial bundle size.
 * The heavy tab components (AI chat with streaming, messages with virtualization)
 * are only loaded when the chat window is first opened.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useUnifiedChat } from "./unified-chat-provider";
import { UnifiedChatHeader } from "./unified-chat-header";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ErrorBoundary } from "@/components/error-boundary";

// Dynamic imports for code splitting - these heavy components are only loaded when chat opens
const AIAssistantTab = dynamic(() => import("./tabs/ai-assistant-tab").then(m => ({ default: m.AIAssistantTab })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  ),
});

const MessagesTab = dynamic(() => import("./tabs/messages-tab").then(m => ({ default: m.MessagesTab })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  ),
});

export function UnifiedChatWindow() {
  const {
    isOpen,
    isFullscreen,
    activeTab,
    close,
  } = useUnifiedChat();

  const [mounted, setMounted] = useState(false);

  // Focus trap for accessibility
  const { containerRef: windowRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: close,
    closeOnEscape: true,
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when open (always on mobile, only fullscreen on desktop)
  useEffect(() => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    if (isOpen && (isFullscreen || isMobile)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isFullscreen]);

  if (!mounted || !isOpen) return null;

  const content = (
    <div
      className={cn(
        "fixed z-50",
        isFullscreen
          ? "inset-0"
          : cn(
              // Mobile: full screen with safe area insets
              "inset-0 sm:inset-auto",
              // Desktop: positioned bottom-right with fixed dimensions
              "sm:bottom-4 sm:right-4 sm:w-[420px] sm:h-[600px]",
              // Height constraints that work with mobile viewport
              "h-[100dvh] sm:h-[600px] sm:max-h-[calc(100vh-2rem)]"
            )
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Claude Insider Assistant"
    >
      {/* Backdrop for fullscreen */}
      {isFullscreen && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Window */}
      <div
        ref={windowRef}
        className={cn(
          "relative flex flex-col bg-white dark:bg-[#0a0a0a]",
          "border-0 sm:border border-gray-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/20",
          "overflow-hidden",
          isFullscreen
            ? "w-full h-full max-w-4xl mx-auto my-8 rounded-2xl"
            : "w-full h-full rounded-none sm:rounded-2xl"
        )}
      >
        {/* Header with tabs */}
        <UnifiedChatHeader />

        {/* Tab content with error boundary for graceful error handling */}
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary
            category="render"
            severity="error"
            onReset={() => {
              // Reset handled by ErrorBoundary internally
              console.log("[Chat] Error boundary reset triggered");
            }}
          >
            {activeTab === "ai" ? (
              <AIAssistantTab />
            ) : (
              <MessagesTab />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
