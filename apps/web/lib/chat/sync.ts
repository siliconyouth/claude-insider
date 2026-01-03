/**
 * Chat Sync Engine
 *
 * Handles synchronization between local IndexedDB and server.
 * Follows Matrix SDK patterns:
 * - Initial sync: Load all data on first connect
 * - Incremental sync: Delta updates via polling/realtime
 * - Gap detection: Find and fill missing messages
 * - Conflict resolution: Server wins (eventually consistent)
 *
 * Sync strategies:
 * 1. Periodic polling (every SYNC_INTERVAL_MS)
 * 2. Tab visibility change
 * 3. Network reconnection
 * 4. Realtime events (immediate)
 */

import type {
  Conversation,
  Message,
  Gap,
  SyncState,
  ConversationSyncState as _ConversationSyncState,
} from "./types";
import { ChatStore, getChatStore } from "./store";

// ============================================================================
// Constants
// ============================================================================

/** Sync interval in milliseconds */
const SYNC_INTERVAL_MS = 10_000;

/** Gap threshold - if gap > this, fetch missing */
const GAP_THRESHOLD_MS = 30_000;

/** Max messages per sync request */
const MAX_MESSAGES_PER_SYNC = 100;

/** Min time between syncs */
const MIN_SYNC_INTERVAL_MS = 2_000;

// ============================================================================
// Types
// ============================================================================

interface SyncEngineConfig {
  userId: string;
  onConversationsUpdated?: (conversations: Conversation[]) => void;
  onMessagesUpdated?: (conversationId: string, messages: Message[]) => void;
  onSyncStateChanged?: (state: SyncState) => void;
  onGapDetected?: (gap: Gap) => void;
  debug?: boolean;
}

interface SyncResult {
  success: boolean;
  conversationsUpdated: number;
  messagesUpdated: number;
  error?: string;
}

// ============================================================================
// Sync Engine Class
// ============================================================================

export class SyncEngine {
  private config: SyncEngineConfig;
  private store: ChatStore;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private isSyncing: boolean = false;
  private isDestroyed: boolean = false;

  constructor(config: SyncEngineConfig) {
    this.config = config;
    this.store = getChatStore();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Start the sync engine
   */
  async start(): Promise<void> {
    if (this.isDestroyed) return;

    this.log("Starting sync engine");

    // Set up event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Perform initial sync
    await this.initialSync();

    // Start periodic sync
    this.startPeriodicSync();
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    this.log("Stopping sync engine");
    this.isDestroyed = true;

    // Remove event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Stop periodic sync
    this.stopPeriodicSync();
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  private handleOnline = (): void => {
    this.log("Network reconnected - triggering sync");
    this.sync();
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      this.log("Tab became visible - triggering sync");
      this.sync();
    }
  };

  // ==========================================================================
  // Sync Operations
  // ==========================================================================

  /**
   * Perform initial sync (full load)
   */
  async initialSync(): Promise<SyncResult> {
    this.log("Performing initial sync");

    const syncState = await this.store.getSyncState();

    // If already synced recently, skip full sync
    if (syncState.initialSyncComplete && syncState.lastSyncAt) {
      const lastSyncTime = new Date(syncState.lastSyncAt).getTime();
      const timeSinceSync = Date.now() - lastSyncTime;

      if (timeSinceSync < SYNC_INTERVAL_MS) {
        this.log("Recent sync found, skipping initial sync");
        return { success: true, conversationsUpdated: 0, messagesUpdated: 0 };
      }
    }

    return this.sync(true);
  }

  /**
   * Perform incremental sync
   */
  async sync(isInitial: boolean = false): Promise<SyncResult> {
    // Throttle syncs
    const now = Date.now();
    if (!isInitial && now - this.lastSyncTime < MIN_SYNC_INTERVAL_MS) {
      this.log("Sync throttled");
      return { success: true, conversationsUpdated: 0, messagesUpdated: 0 };
    }

    // Prevent concurrent syncs
    if (this.isSyncing) {
      this.log("Sync already in progress");
      return { success: true, conversationsUpdated: 0, messagesUpdated: 0 };
    }

    this.isSyncing = true;
    this.lastSyncTime = now;

    // Update sync state
    await this.updateSyncState({ isSyncing: true, syncError: undefined });

    try {
      // Fetch conversations from server
      const { getConversations } = await import("@/app/actions/messaging");
      const result = await getConversations();

      if (!result.success || !result.conversations) {
        throw new Error(result.error || "Failed to fetch conversations");
      }

      const conversations = result.conversations;

      // Transform server conversations to our format
      const transformedConversations = conversations.map((c) =>
        this.transformConversation(c)
      );

      // Store conversations
      await this.store.putConversations(transformedConversations);

      // Notify callback
      if (this.config.onConversationsUpdated) {
        this.config.onConversationsUpdated(transformedConversations);
      }

      // Detect gaps for each conversation
      for (const conv of transformedConversations) {
        await this.detectAndFillGaps(conv.id);
      }

      // Update sync state
      await this.updateSyncState({
        isSyncing: false,
        initialSyncComplete: true,
        lastSyncAt: new Date().toISOString(),
      });

      this.log(
        `Sync complete: ${transformedConversations.length} conversations`
      );

      return {
        success: true,
        conversationsUpdated: transformedConversations.length,
        messagesUpdated: 0,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      this.log("Sync failed:", errorMessage);

      await this.updateSyncState({
        isSyncing: false,
        syncError: errorMessage,
      });

      return {
        success: false,
        conversationsUpdated: 0,
        messagesUpdated: 0,
        error: errorMessage,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync messages for a specific conversation
   */
  async syncConversation(conversationId: string): Promise<SyncResult> {
    this.log(`Syncing conversation: ${conversationId}`);

    try {
      // Get current sync state for conversation (reserved for future gap detection)
      const _convSyncState = await this.store.getConversationSyncState(
        conversationId
      );

      // Fetch messages from server
      const { getMessages } = await import("@/app/actions/messaging");
      const result = await getMessages(conversationId, MAX_MESSAGES_PER_SYNC);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch messages");
      }

      const messages = result.messages || [];

      // Transform messages to our format
      const transformedMessages = messages.map((m) => this.transformMessage(m));

      // Store messages
      await this.store.putMessages(transformedMessages);

      // Update conversation sync state
      if (transformedMessages.length > 0) {
        const sortedMessages = [...transformedMessages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        await this.store.setConversationSyncState({
          conversationId,
          oldestMessageId: sortedMessages[0]?.id,
          newestMessageId: sortedMessages[sortedMessages.length - 1]?.id,
          lastSyncAt: new Date().toISOString(),
          hasAllHistory: !result.hasMore,
        });
      }

      // Notify callback
      if (this.config.onMessagesUpdated) {
        this.config.onMessagesUpdated(conversationId, transformedMessages);
      }

      this.log(
        `Conversation sync complete: ${transformedMessages.length} messages`
      );

      return {
        success: true,
        conversationsUpdated: 0,
        messagesUpdated: transformedMessages.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.log(`Conversation sync failed: ${errorMessage}`);
      return {
        success: false,
        conversationsUpdated: 0,
        messagesUpdated: 0,
        error: errorMessage,
      };
    }
  }

  // ==========================================================================
  // Gap Detection (Matrix SDK Pattern)
  // ==========================================================================

  /**
   * Detect gaps in message history and fill them
   */
  async detectAndFillGaps(conversationId: string): Promise<Gap[]> {
    const gaps: Gap[] = [];

    try {
      // Get local messages
      const localMessages = await this.store.getMessages(conversationId, {
        limit: 100,
      });

      if (localMessages.length < 2) {
        // Not enough messages to detect gaps
        return gaps;
      }

      // Sort by timestamp
      const sorted = [...localMessages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Check for gaps
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        if (!prev || !curr) continue;

        const prevTime = new Date(prev.createdAt).getTime();
        const currTime = new Date(curr.createdAt).getTime();
        const gapMs = currTime - prevTime;

        if (gapMs > GAP_THRESHOLD_MS) {
          const gap: Gap = {
            conversationId,
            startMessageId: prev.id,
            endMessageId: curr.id,
            estimatedCount: Math.ceil(gapMs / 1000), // Rough estimate
          };

          gaps.push(gap);

          // Notify callback
          if (this.config.onGapDetected) {
            this.config.onGapDetected(gap);
          }
        }
      }

      // Fill gaps
      for (const gap of gaps) {
        await this.fillGap(gap);
      }
    } catch (error) {
      this.log("Gap detection failed:", error);
    }

    return gaps;
  }

  /**
   * Fill a gap by fetching missing messages
   */
  async fillGap(gap: Gap): Promise<Message[]> {
    this.log(`Filling gap in ${gap.conversationId}`);

    try {
      // Fetch messages between the gap
      const { getMessagesSince } = await import("@/app/actions/messaging");

      // Get the start message to get its timestamp
      const startMessage = await this.store.getMessage(gap.startMessageId);
      if (!startMessage) {
        this.log("Start message not found for gap");
        return [];
      }

      const result = await getMessagesSince(
        gap.conversationId,
        startMessage.createdAt
      );

      if (!result.success || !result.messages) {
        return [];
      }

      // Transform and store
      const messages = result.messages.map((m) => this.transformMessage(m));
      await this.store.putMessages(messages);

      // Notify callback
      if (this.config.onMessagesUpdated) {
        this.config.onMessagesUpdated(gap.conversationId, messages);
      }

      this.log(`Filled gap with ${messages.length} messages`);
      return messages;
    } catch (error) {
      this.log("Gap fill failed:", error);
      return [];
    }
  }

  // ==========================================================================
  // Periodic Sync
  // ==========================================================================

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.stopPeriodicSync(); // Clear any existing interval

    this.syncInterval = setInterval(() => {
      if (!this.isDestroyed && navigator.onLine) {
        this.sync();
      }
    }, SYNC_INTERVAL_MS);

    this.log(`Periodic sync started (${SYNC_INTERVAL_MS}ms interval)`);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.log("Periodic sync stopped");
    }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Transform server conversation to our format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformConversation(serverConv: any): Conversation {
    // The server returns a specific format, we normalize it
    return {
      id: serverConv.id as string,
      type: serverConv.type as "direct" | "group",
      name: serverConv.name as string | undefined,
      avatarUrl: serverConv.avatarUrl as string | undefined,
      createdAt: serverConv.createdAt as string,
      createdBy: serverConv.createdBy as string,
      lastMessageAt: serverConv.lastMessageAt as string | undefined,
      lastMessagePreview: serverConv.lastMessagePreview as string | undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      participants: (serverConv.participants || []).map((p: any) => ({
        id: p.id as string,
        odierUserId: p.odierUserId as string,
        userId: p.userId as string,
        name: p.name as string,
        username: p.username as string | undefined,
        avatar: p.avatar as string | undefined,
        role: p.role as "owner" | "admin" | "member",
        unreadCount: (p.unreadCount as number) || 0,
        isMuted: (p.isMuted as boolean) || false,
        lastReadAt: p.lastReadAt as string | undefined,
        status: p.status as "online" | "idle" | "offline" | undefined,
      })),
      unreadCount: (serverConv.unreadCount as number) || 0,
      isMuted: (serverConv.isMuted as boolean) || false,
      isEncrypted: (serverConv.isEncrypted as boolean) || false,
    };
  }

  /**
   * Transform server message to our format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformMessage(serverMsg: any): Message {
    return {
      id: serverMsg.id as string,
      conversationId: serverMsg.conversationId as string,
      senderId: serverMsg.senderId as string,
      content: serverMsg.content as string,
      createdAt: serverMsg.createdAt as string,
      editedAt: serverMsg.editedAt as string | undefined,
      deletedAt: serverMsg.deletedAt as string | undefined,
      replyToMessageId: serverMsg.replyToMessageId as string | undefined,
      mentions: serverMsg.mentions as string[] | undefined,
      isEncrypted: (serverMsg.isEncrypted as boolean) || false,
      encryptedContent: serverMsg.encryptedContent as string | undefined,
      encryptionAlgorithm: serverMsg.encryptionAlgorithm as "olm.v1" | "megolm.v1" | undefined,
      senderDeviceId: serverMsg.senderDeviceId as string | undefined,
      senderKey: serverMsg.senderKey as string | undefined,
      sessionId: serverMsg.sessionId as string | undefined,
      isAiGenerated: serverMsg.isAiGenerated as boolean | undefined,
      aiResponseTo: serverMsg.aiResponseTo as string | undefined,
    };
  }

  /**
   * Update sync state
   */
  private async updateSyncState(state: Partial<SyncState>): Promise<void> {
    await this.store.setSyncState(state);
    if (this.config.onSyncStateChanged) {
      const fullState = await this.store.getSyncState();
      this.config.onSyncStateChanged(fullState);
    }
  }

  /**
   * Debug logging
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[SyncEngine] ${message}`, ...args);
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

let syncEngineInstance: SyncEngine | null = null;

/**
 * Create or get the sync engine instance
 */
export function getSyncEngine(config?: SyncEngineConfig): SyncEngine {
  if (!syncEngineInstance && config) {
    syncEngineInstance = new SyncEngine(config);
  }
  if (!syncEngineInstance) {
    throw new Error("SyncEngine not initialized. Call with config first.");
  }
  return syncEngineInstance;
}

/**
 * Reset the sync engine (for testing or logout)
 */
export function resetSyncEngine(): void {
  if (syncEngineInstance) {
    syncEngineInstance.stop();
    syncEngineInstance = null;
  }
}
