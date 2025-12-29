/**
 * Message Draft Hook
 *
 * Persists unsent message text per conversation in localStorage.
 * Matrix SDK pattern - drafts are saved automatically and restored
 * when switching between conversations.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const DRAFT_PREFIX = "msg_draft_";
const DEBOUNCE_MS = 500;

interface UseDraftMessageOptions {
  conversationId: string;
  /** Callback when draft is restored */
  onDraftRestored?: (draft: string) => void;
}

interface UseDraftMessageReturn {
  /** Current draft value */
  draft: string;
  /** Update draft (debounced localStorage save) */
  setDraft: (value: string) => void;
  /** Clear draft (called after sending) */
  clearDraft: () => void;
  /** Whether a draft was restored on mount */
  hadDraft: boolean;
}

export function useDraftMessage({
  conversationId,
  onDraftRestored,
}: UseDraftMessageOptions): UseDraftMessageReturn {
  const [draft, setDraftState] = useState("");
  const [hadDraft, setHadDraft] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevConversationIdRef = useRef<string | null>(null);

  // Storage key for this conversation
  const storageKey = `${DRAFT_PREFIX}${conversationId}`;

  // Load draft when conversation changes
  useEffect(() => {
    // Skip if same conversation
    if (prevConversationIdRef.current === conversationId) return;
    prevConversationIdRef.current = conversationId;

    // Clear any pending save from previous conversation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Load draft from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDraftState(saved);
        setHadDraft(true);
        onDraftRestored?.(saved);
      } else {
        setDraftState("");
        setHadDraft(false);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.)
      setDraftState("");
      setHadDraft(false);
    }
  }, [conversationId, storageKey, onDraftRestored]);

  // Update draft with debounced save
  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value);

      // Clear pending save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce localStorage write
      timeoutRef.current = setTimeout(() => {
        try {
          if (value.trim()) {
            localStorage.setItem(storageKey, value);
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch {
          // Ignore localStorage errors
        }
      }, DEBOUNCE_MS);
    },
    [storageKey]
  );

  // Clear draft (called after sending)
  const clearDraft = useCallback(() => {
    setDraftState("");
    setHadDraft(false);

    // Clear pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Remove from localStorage immediately
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    setDraft,
    clearDraft,
    hadDraft,
  };
}
