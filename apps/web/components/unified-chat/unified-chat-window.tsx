"use client";

/**
 * Unified Chat Window
 *
 * Main window component that renders via portal.
 * Contains tabs for AI Assistant and Messages.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useUnifiedChat } from "./unified-chat-provider";
import { UnifiedChatHeader } from "./unified-chat-header";
import { AIAssistantTab } from "./tabs/ai-assistant-tab";
import { MessagesTab } from "./tabs/messages-tab";
import { useFocusTrap } from "@/hooks/use-focus-trap";

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

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen && isFullscreen) {
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
          : "bottom-4 right-4 w-[420px] h-[600px] max-h-[calc(100vh-2rem)]"
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
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/20",
          "overflow-hidden",
          isFullscreen
            ? "w-full h-full max-w-4xl mx-auto my-8 rounded-2xl"
            : "w-full h-full rounded-2xl"
        )}
      >
        {/* Header with tabs */}
        <UnifiedChatHeader />

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "ai" ? (
            <AIAssistantTab />
          ) : (
            <MessagesTab />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
