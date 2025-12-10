"use client";

import { openAssistant } from "./voice-assistant";

export function OpenAssistantButton() {
  return (
    <button
      onClick={openAssistant}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 transition-all"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      Try the Assistant
    </button>
  );
}
