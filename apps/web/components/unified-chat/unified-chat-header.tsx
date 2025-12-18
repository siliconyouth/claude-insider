"use client";

/**
 * Unified Chat Header
 *
 * Tab bar with AI Assistant and Messages tabs.
 * Includes fullscreen toggle and close button.
 */

import { cn } from "@/lib/design-system";
import { useUnifiedChat } from "./unified-chat-provider";

export function UnifiedChatHeader() {
  const {
    activeTab,
    switchTab,
    isFullscreen,
    toggleFullscreen,
    close,
    unreadCount,
  } = useUnifiedChat();

  return (
    <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a]">
      {/* Tabs */}
      <div className="flex items-center gap-1" role="tablist" aria-label="Chat tabs">
        <TabButton
          active={activeTab === "ai"}
          onClick={() => switchTab("ai")}
          icon={<SparklesIcon />}
          label="AI Assistant"
        />
        <TabButton
          active={activeTab === "messages"}
          onClick={() => switchTab("messages")}
          icon={<MessageIcon />}
          label="Messages"
          badge={unreadCount > 0 ? unreadCount : undefined}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          )}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <MinimizeIcon className="w-4 h-4" />
          ) : (
            <MaximizeIcon className="w-4 h-4" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={close}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          )}
          title="Close"
          aria-label="Close"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Tab Button
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function TabButton({ active, onClick, icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
      )}
      aria-selected={active}
      role="tab"
    >
      <span className="w-4 h-4">{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "flex items-center justify-center min-w-[18px] h-[18px] px-1",
            "text-xs font-medium rounded-full",
            active
              ? "bg-white/20 text-white"
              : "bg-blue-600 text-white"
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Icons
// ============================================================================

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 00-2 2v3" />
      <path d="M21 8V5a2 2 0 00-2-2h-3" />
      <path d="M3 16v3a2 2 0 002 2h3" />
      <path d="M16 21h3a2 2 0 002-2v-3" />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="M14 10l7-7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
