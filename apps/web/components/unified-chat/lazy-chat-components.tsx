/**
 * Lazy Chat Components
 *
 * Dynamically imports heavy chat components to reduce initial bundle size.
 * These components are loaded on-demand after the main page renders.
 */

"use client";

import dynamic from "next/dynamic";

// Lazy load the chat window - only loads when chat is opened
export const LazyUnifiedChatWindow = dynamic(
  () => import("./unified-chat-window").then((m) => ({ default: m.UnifiedChatWindow })),
  {
    ssr: false,
    loading: () => null, // No loading state since it's hidden until opened
  }
);

// Lazy load the floating button - loads shortly after page mount
export const LazyFloatingChatButton = dynamic(
  () => import("./floating-chat-button").then((m) => ({ default: m.FloatingChatButton })),
  {
    ssr: false,
    loading: () => null, // Invisible during load
  }
);
