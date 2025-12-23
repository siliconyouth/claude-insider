/**
 * Lazy Voice Assistant Demo
 *
 * Dynamically imports the VoiceAssistantDemo to defer loading.
 * This component is below-the-fold, so lazy loading improves initial LCP.
 */

"use client";

import { Component, ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";

/**
 * Error boundary for the voice assistant demo section.
 * Provides graceful fallback if the demo fails to load or render.
 */
class VoiceAssistantErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("VoiceAssistantDemo error:", error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "rounded-2xl overflow-hidden p-8 text-center",
            "bg-gray-900/95 backdrop-blur-xl",
            "border border-gray-700/50"
          )}
        >
          <p className="text-gray-400 mb-4">Unable to load demo preview</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load the voice assistant demo - it's below the fold
const VoiceAssistantDemo = dynamic(
  () => import("./voice-assistant-demo").then((m) => ({ default: m.VoiceAssistantDemo })),
  {
    ssr: false, // No need for SSR - it's a client-side animation
    loading: () => (
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-gray-900/95 backdrop-blur-xl",
          "border border-gray-700/50",
          "shadow-2xl shadow-black/50"
        )}
      >
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        {/* Messages skeleton */}
        <div className="p-4 h-64 space-y-4">
          <div className="flex justify-end">
            <div className="h-10 w-48 bg-blue-900/30 rounded-xl animate-pulse" />
          </div>
          <div className="flex justify-start">
            <div className="h-20 w-64 bg-gray-800/50 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    ),
  }
);

export function LazyVoiceAssistantDemo() {
  return (
    <VoiceAssistantErrorBoundary>
      <VoiceAssistantDemo />
    </VoiceAssistantErrorBoundary>
  );
}
