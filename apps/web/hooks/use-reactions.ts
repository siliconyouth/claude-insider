/**
 * Reactions Hook
 *
 * Manages message reactions with optimistic updates and realtime sync.
 * Follows Matrix SDK pattern for instant feedback.
 */

import { useCallback, useState, useEffect, useRef } from "react";
import {
  toggleReaction,
  getReactionsForMessages,
  type ReactionSummary,
  type Reaction,
} from "@/app/actions/messaging";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseReactionsOptions {
  conversationId: string;
  currentUserId: string;
  /** Initial message IDs to fetch reactions for */
  messageIds: string[];
  /** Supabase channel for realtime updates */
  channel?: RealtimeChannel;
  enabled?: boolean;
}

interface UseReactionsReturn {
  /** Reactions by message ID */
  reactions: Record<string, ReactionSummary>;
  /** Toggle a reaction on a message (optimistic update) */
  react: (messageId: string, emoji: string) => Promise<void>;
  /** Whether reactions are currently loading */
  isLoading: boolean;
  /** Refresh reactions for specific messages */
  refreshReactions: (messageIds: string[]) => Promise<void>;
}

export function useReactions({
  conversationId,
  currentUserId,
  messageIds,
  channel,
  enabled = true,
}: UseReactionsOptions): UseReactionsReturn {
  const [reactions, setReactions] = useState<Record<string, ReactionSummary>>({});
  const [isLoading, setIsLoading] = useState(false);
  const pendingFetchRef = useRef<Set<string>>(new Set());

  // Fetch reactions for messages
  const fetchReactions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    // Deduplicate with pending fetches
    const toFetch = ids.filter((id) => !pendingFetchRef.current.has(id));
    if (toFetch.length === 0) return;

    toFetch.forEach((id) => pendingFetchRef.current.add(id));

    try {
      const result = await getReactionsForMessages(toFetch);
      if (result.success && result.reactions) {
        setReactions((prev) => ({
          ...prev,
          ...result.reactions,
        }));
      }
    } finally {
      toFetch.forEach((id) => pendingFetchRef.current.delete(id));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!enabled || messageIds.length === 0) return;

    setIsLoading(true);
    fetchReactions(messageIds).finally(() => setIsLoading(false));
  }, [enabled, messageIds, fetchReactions]);

  // Subscribe to realtime reaction updates
  useEffect(() => {
    if (!enabled || !channel) return;

    // Listen for reaction changes via broadcast
    const handleReactionUpdate = (payload: {
      messageId: string;
      userId: string;
      emoji: string;
      action: "added" | "removed";
      userName?: string;
      userUsername?: string;
    }) => {
      // Skip if it's our own action (already handled optimistically)
      if (payload.userId === currentUserId) return;

      setReactions((prev) => {
        const summary = prev[payload.messageId] || {
          messageId: payload.messageId,
          reactions: [],
        };

        const reactionsCopy = [...summary.reactions];
        const existingIdx = reactionsCopy.findIndex((r) => r.emoji === payload.emoji);

        if (payload.action === "added") {
          const existing = existingIdx >= 0 ? reactionsCopy[existingIdx] : null;
          if (existing) {
            // Add to existing reaction
            reactionsCopy[existingIdx] = {
              emoji: existing.emoji,
              count: existing.count + 1,
              hasReacted: existing.hasReacted,
              users: [
                ...existing.users,
                {
                  id: payload.userId,
                  name: payload.userName,
                  username: payload.userUsername,
                },
              ],
            };
          } else {
            // New reaction
            reactionsCopy.push({
              emoji: payload.emoji,
              count: 1,
              users: [
                {
                  id: payload.userId,
                  name: payload.userName,
                  username: payload.userUsername,
                },
              ],
              hasReacted: false,
            });
          }
        } else if (payload.action === "removed" && existingIdx >= 0) {
          const existing = reactionsCopy[existingIdx];
          if (existing && existing.count <= 1) {
            // Remove reaction entirely
            reactionsCopy.splice(existingIdx, 1);
          } else if (existing) {
            // Decrement count and remove user
            reactionsCopy[existingIdx] = {
              emoji: existing.emoji,
              count: existing.count - 1,
              hasReacted: existing.hasReacted,
              users: existing.users.filter((u) => u.id !== payload.userId),
            };
          }
        }

        return {
          ...prev,
          [payload.messageId]: {
            messageId: payload.messageId,
            reactions: reactionsCopy,
          },
        };
      });
    };

    // Subscribe to broadcast events
    channel.on("broadcast", { event: "reaction" }, ({ payload }) => {
      handleReactionUpdate(payload);
    });

    return () => {
      // Cleanup is handled by channel removal
    };
  }, [enabled, channel, currentUserId, conversationId]);

  // Toggle reaction with optimistic update
  const react = useCallback(
    async (messageId: string, emoji: string) => {
      // Optimistic update
      setReactions((prev) => {
        const summary = prev[messageId] || {
          messageId,
          reactions: [],
        };

        const reactionsCopy = [...summary.reactions];
        const existingIdx = reactionsCopy.findIndex((r) => r.emoji === emoji);

        const existing = existingIdx >= 0 ? reactionsCopy[existingIdx] : null;

        if (existing) {
          if (existing.hasReacted) {
            // Remove our reaction
            if (existing.count <= 1) {
              reactionsCopy.splice(existingIdx, 1);
            } else {
              reactionsCopy[existingIdx] = {
                emoji: existing.emoji,
                count: existing.count - 1,
                users: existing.users.filter((u) => u.id !== currentUserId),
                hasReacted: false,
              };
            }
          } else {
            // Add our reaction
            reactionsCopy[existingIdx] = {
              emoji: existing.emoji,
              count: existing.count + 1,
              users: [...existing.users, { id: currentUserId }],
              hasReacted: true,
            };
          }
        } else {
          // New reaction from us
          reactionsCopy.push({
            emoji,
            count: 1,
            users: [{ id: currentUserId }],
            hasReacted: true,
          });
        }

        return {
          ...prev,
          [messageId]: {
            messageId,
            reactions: reactionsCopy,
          },
        };
      });

      // Get current state for broadcast
      const currentReaction = reactions[messageId]?.reactions.find(
        (r) => r.emoji === emoji
      );
      const action = currentReaction?.hasReacted ? "removed" : "added";

      // Send to server
      const result = await toggleReaction(messageId, emoji);

      if (!result.success) {
        // Revert optimistic update on error
        fetchReactions([messageId]);
        return;
      }

      // Broadcast to other participants
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "reaction",
          payload: {
            messageId,
            userId: currentUserId,
            emoji,
            action,
          },
        });
      }
    },
    [currentUserId, channel, reactions, fetchReactions]
  );

  // Refresh reactions for specific messages
  const refreshReactions = useCallback(
    async (ids: string[]) => {
      await fetchReactions(ids);
    },
    [fetchReactions]
  );

  return {
    reactions,
    react,
    isLoading,
    refreshReactions,
  };
}

/**
 * Get reactions as an array for a specific message
 */
export function getReactionsArray(
  reactions: Record<string, ReactionSummary>,
  messageId: string
): Reaction[] {
  return reactions[messageId]?.reactions || [];
}
