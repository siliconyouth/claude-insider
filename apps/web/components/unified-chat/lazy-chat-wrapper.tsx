/**
 * Lazy Chat Wrapper
 *
 * Client component that dynamically loads heavy chat components.
 * Must be a client component to use dynamic imports with ssr: false.
 *
 * Performance Optimizations:
 * - Defers chat loading until after hydration (~21KB saved)
 * - Wraps components in ChatErrorBoundary for graceful degradation
 * - Isolates chat failures from the main application
 */

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChatErrorBoundary } from "./chat-error-boundary";

// Dynamically import chat components after hydration
const UnifiedChatWindow = dynamic(
  () => import("./unified-chat-window").then((m) => ({ default: m.UnifiedChatWindow })),
  {
    ssr: false,
    loading: () => null,
  }
);

const FloatingChatButton = dynamic(
  () => import("./floating-chat-button").then((m) => ({ default: m.FloatingChatButton })),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * Wrapper that defers loading of chat UI until after hydration.
 * This removes ~21KB from the initial JS bundle.
 * Wrapped in ChatErrorBoundary for graceful error handling.
 */
export function LazyChatWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ChatErrorBoundary>
      <UnifiedChatWindow />
      <FloatingChatButton />
    </ChatErrorBoundary>
  );
}
