/**
 * Chat Engine - Central Coordinator
 *
 * The ChatEngine is the single source of truth for chat state.
 * It coordinates between IndexedDB (local), Supabase (server), and React (UI).
 *
 * Key responsibilities:
 * - Manage conversation and message state
 * - Handle offline queue and sync
 * - Coordinate E2EE encryption/decryption
 * - Emit events for UI updates
 * - Handle optimistic updates
 *
 * Design principles (Matrix SDK):
 * - Server is source of truth
 * - Local store is a cache
 * - All operations are optimistic
 * - Events drive UI updates
 */

import { nanoid } from "nanoid";
import { ChatStore, getChatStore } from "./store";
import {
  DEFAULT_ENGINE_CONFIG,
  type ChatEngineConfig,
  type Conversation,
  type Message,
  type PendingOperation,
  type SendMessageOptions,
  type ChatEvent,
  type ChatEventType,
  type ChatEventHandler,
  type ConnectionState,
  type ConnectionInfo,
  type SyncState,
} from "./types";

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRY_COUNT = 5;
const RETRY_BACKOFF_MS = 1000;
const _TYPING_DEBOUNCE_MS = 300;
const TYPING_TIMEOUT_MS = 5000;

// ============================================================================
// Chat Engine Class
// ============================================================================

export class ChatEngine {
  private config: ChatEngineConfig;
  private store: ChatStore;
  private eventHandlers: Map<ChatEventType, Set<ChatEventHandler>> = new Map();

  // State
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private syncState: SyncState = {
    initialSyncComplete: false,
    isSyncing: false,
  };
  private connectionState: ConnectionInfo = {
    state: "disconnected",
    reconnectAttempts: 0,
  };

  // Initialized flag
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: ChatEngineConfig) {
    this.config = {
      ...DEFAULT_ENGINE_CONFIG,
      ...config,
    };
    this.store = getChatStore();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Initialize the engine
   * - Opens IndexedDB
   * - Loads cached conversations
   * - Starts sync if online
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    this.log("Initializing ChatEngine...");

    // Initialize store
    await this.store.initialize();

    // Load cached data
    await this.loadFromCache();

    // Load sync state
    this.syncState = await this.store.getSyncState();

    // Set up online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    this.initialized = true;
    this.log("ChatEngine initialized");

    // Emit ready event
    this.emit({
      type: "sync_completed",
      payload: { source: "cache" },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Load data from IndexedDB cache
   */
  private async loadFromCache(): Promise<void> {
    // Load conversations
    const conversations = await this.store.getConversations();
    for (const conv of conversations) {
      this.conversations.set(conv.id, conv);
    }

    this.log(`Loaded ${conversations.length} conversations from cache`);
  }

  /**
   * Destroy the engine (cleanup)
   */
  destroy(): void {
    this.log("Destroying ChatEngine...");

    // Remove event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
      window.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Clear typing timers
    Array.from(this.typingTimers.values()).forEach((timer) => {
      clearTimeout(timer);
    });
    this.typingTimers.clear();

    // Clear state
    this.conversations.clear();
    this.messages.clear();
    this.eventHandlers.clear();

    this.initialized = false;
    this.initPromise = null;
  }

  // ==========================================================================
  // Event Handlers (Browser Events)
  // ==========================================================================

  private handleOnline = (): void => {
    this.log("Network online - starting sync");
    this.setConnectionState("connecting");
    this.syncPendingOperations();
    // Full sync will be triggered by the sync engine
  };

  private handleOffline = (): void => {
    this.log("Network offline");
    this.setConnectionState("disconnected");
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      this.log("Tab visible - checking for updates");
      // Sync will be triggered by the sync engine
    }
  };

  // ==========================================================================
  // State Access
  // ==========================================================================

  /**
   * Get all conversations
   */
  getConversations(): Conversation[] {
    const conversations = Array.from(this.conversations.values());
    return conversations.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Get a single conversation
   */
  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  /**
   * Get messages for a conversation
   */
  getMessages(
    conversationId: string,
    options?: { before?: string; after?: string; limit?: number }
  ): Message[] {
    let msgs = this.messages.get(conversationId) || [];

    if (options?.before) {
      const beforeTime = new Date(options.before).getTime();
      msgs = msgs.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
    }

    if (options?.after) {
      const afterTime = new Date(options.after).getTime();
      msgs = msgs.filter((m) => new Date(m.createdAt).getTime() > afterTime);
    }

    // Sort by createdAt
    msgs = [...msgs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (options?.limit && msgs.length > options.limit) {
      // If before is set, get the last N messages before that point
      // Otherwise get the first N
      if (options.before) {
        msgs = msgs.slice(-options.limit);
      } else {
        msgs = msgs.slice(0, options.limit);
      }
    }

    return msgs;
  }

  /**
   * Get total unread count
   */
  getTotalUnreadCount(): number {
    let total = 0;
    const conversations = Array.from(this.conversations.values());
    for (const conv of conversations) {
      if (!conv.isMuted) {
        total += conv.unreadCount;
      }
    }
    return total;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionInfo {
    return { ...this.connectionState };
  }

  /**
   * Get sync state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ==========================================================================
  // State Updates (Internal)
  // ==========================================================================

  /**
   * Update a conversation in state and cache
   */
  async updateConversation(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, conversation);
    await this.store.putConversation(conversation);
    this.emit({
      type: "conversation_updated",
      conversationId: conversation.id,
      payload: conversation,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add a conversation
   */
  async addConversation(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, conversation);
    await this.store.putConversation(conversation);
    this.emit({
      type: "conversation_added",
      conversationId: conversation.id,
      payload: conversation,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove a conversation
   */
  async removeConversation(conversationId: string): Promise<void> {
    this.conversations.delete(conversationId);
    this.messages.delete(conversationId);
    await this.store.deleteConversation(conversationId);
    this.emit({
      type: "conversation_removed",
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set messages for a conversation
   */
  async setMessages(conversationId: string, messages: Message[]): Promise<void> {
    this.messages.set(conversationId, messages);
    await this.store.putMessages(messages);
  }

  /**
   * Add a message (new incoming or sent)
   */
  async addMessage(message: Message): Promise<void> {
    const existing = this.messages.get(message.conversationId) || [];

    // Check if message already exists (dedup)
    const existingIndex = existing.findIndex(
      (m) => m.id === message.id || m._localId === message.id
    );

    if (existingIndex >= 0) {
      // Update existing message
      existing[existingIndex] = message;
    } else {
      // Add new message
      existing.push(message);
      // Sort by createdAt
      existing.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    this.messages.set(message.conversationId, existing);
    await this.store.putMessage(message);

    // Update conversation preview
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessagePreview = message.content.slice(0, 100);
      conversation.lastMessageAt = message.createdAt;
      await this.updateConversation(conversation);
    }

    this.emit({
      type: existingIndex >= 0 ? "message_updated" : "message_added",
      conversationId: message.conversationId,
      messageId: message.id,
      payload: message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update a message
   */
  async updateMessage(message: Message): Promise<void> {
    const existing = this.messages.get(message.conversationId) || [];
    const index = existing.findIndex((m) => m.id === message.id);
    if (index >= 0) {
      existing[index] = message;
      this.messages.set(message.conversationId, existing);
      await this.store.putMessage(message);
      this.emit({
        type: "message_updated",
        conversationId: message.conversationId,
        messageId: message.id,
        payload: message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update connection state
   */
  private setConnectionState(state: ConnectionState, error?: string): void {
    const prev = this.connectionState.state;
    this.connectionState.state = state;
    this.connectionState.error = error;

    if (state === "connected") {
      this.connectionState.lastConnectedAt = new Date().toISOString();
      this.connectionState.reconnectAttempts = 0;
    } else if (state === "reconnecting") {
      this.connectionState.reconnectAttempts++;
    }

    if (prev !== state) {
      this.emit({
        type: "connection_changed",
        payload: this.connectionState,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ==========================================================================
  // Message Operations
  // ==========================================================================

  /**
   * Send a message (optimistic update)
   */
  async sendMessage(
    conversationId: string,
    content: string,
    options: SendMessageOptions = {}
  ): Promise<Message> {
    const localId = nanoid();
    const now = new Date().toISOString();

    // Create optimistic message
    const message: Message = {
      id: localId,
      _localId: localId,
      _pending: true,
      conversationId,
      senderId: this.config.userId,
      content,
      createdAt: now,
      deliveryStatus: "sending",
      isEncrypted: false, // Will be set by E2EE layer
      replyToMessageId: options.replyToMessageId,
      mentions: options.mentions,
    };

    // Add to local state immediately (optimistic)
    await this.addMessage(message);

    // Queue the operation
    const operation: PendingOperation = {
      id: nanoid(),
      type: "send_message",
      conversationId,
      payload: {
        localId,
        content,
        replyToMessageId: options.replyToMessageId,
        mentions: options.mentions,
      },
      createdAt: now,
      retryCount: 0,
    };

    await this.store.addPendingOperation(operation);
    this.emitQueueChanged();

    // Try to execute immediately if online
    if (navigator.onLine) {
      this.executeOperation(operation, message);
    }

    return message;
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    const allMessages = Array.from(this.messages.entries());
    let message: Message | undefined;
    let conversationId: string | undefined;

    for (const [convId, msgs] of allMessages) {
      const found = msgs.find((m) => m.id === messageId);
      if (found) {
        message = found;
        conversationId = convId;
        break;
      }
    }

    if (!message || !conversationId) {
      throw new Error("Message not found");
    }

    // Optimistic update
    message.content = newContent;
    message.editedAt = new Date().toISOString();
    await this.updateMessage(message);

    // Queue operation
    const operation: PendingOperation = {
      id: nanoid(),
      type: "edit_message",
      conversationId,
      payload: { messageId, newContent },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    await this.store.addPendingOperation(operation);
    this.emitQueueChanged();

    if (navigator.onLine) {
      this.executeOperation(operation);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const allMessages = Array.from(this.messages.entries());
    let message: Message | undefined;
    let conversationId: string | undefined;

    for (const [convId, msgs] of allMessages) {
      const found = msgs.find((m) => m.id === messageId);
      if (found) {
        message = found;
        conversationId = convId;
        break;
      }
    }

    if (!message || !conversationId) {
      throw new Error("Message not found");
    }

    // Optimistic update
    message.deletedAt = new Date().toISOString();
    await this.updateMessage(message);

    // Queue operation
    const operation: PendingOperation = {
      id: nanoid(),
      type: "delete_message",
      conversationId,
      payload: { messageId },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    await this.store.addPendingOperation(operation);
    this.emitQueueChanged();

    if (navigator.onLine) {
      this.executeOperation(operation);
    }
  }

  /**
   * Toggle reaction on a message
   */
  async toggleReaction(messageId: string, emoji: string): Promise<void> {
    // Find the message
    let conversationId: string | undefined;
    const entries = Array.from(this.messages.entries());
    for (const [convId, msgs] of entries) {
      if (msgs.find((m) => m.id === messageId)) {
        conversationId = convId;
        break;
      }
    }

    if (!conversationId) {
      throw new Error("Message not found");
    }

    // Queue operation
    const operation: PendingOperation = {
      id: nanoid(),
      type: "toggle_reaction",
      conversationId,
      payload: { messageId, emoji },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    await this.store.addPendingOperation(operation);
    this.emitQueueChanged();

    // Emit optimistic event
    this.emit({
      type: "reaction_added",
      conversationId,
      messageId,
      payload: { emoji, userId: this.config.userId },
      timestamp: new Date().toISOString(),
    });

    if (navigator.onLine) {
      this.executeOperation(operation);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string,
    upToMessageId?: string
  ): Promise<void> {
    // Update local state immediately
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      await this.updateConversation(conversation);
    }

    // Queue operation
    const operation: PendingOperation = {
      id: nanoid(),
      type: "mark_read",
      conversationId,
      payload: { upToMessageId },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    await this.store.addPendingOperation(operation);

    if (navigator.onLine) {
      this.executeOperation(operation);
    }
  }

  // ==========================================================================
  // Typing Indicators
  // ==========================================================================

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    // Clear existing timer
    const existingTimer = this.typingTimers.get(conversationId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.typingTimers.delete(conversationId);
    }

    // Broadcast typing (fire-and-forget, no queue)
    this.broadcastTyping(conversationId, isTyping);

    // Set auto-stop timer
    if (isTyping) {
      const timer = setTimeout(() => {
        this.broadcastTyping(conversationId, false);
        this.typingTimers.delete(conversationId);
      }, TYPING_TIMEOUT_MS);
      this.typingTimers.set(conversationId, timer);
    }
  }

  /**
   * Broadcast typing indicator (to be implemented by transport layer)
   */
  private broadcastTyping(conversationId: string, isTyping: boolean): void {
    // This will be connected to the realtime layer
    this.log(`Typing ${isTyping ? "started" : "stopped"} in ${conversationId}`);
  }

  /**
   * Handle incoming typing indicator
   */
  handleTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation._typing = conversation._typing || [];

    if (isTyping) {
      if (!conversation._typing.includes(userId)) {
        conversation._typing.push(userId);
      }
    } else {
      conversation._typing = conversation._typing.filter((u) => u !== userId);
    }

    this.emit({
      type: isTyping ? "typing_started" : "typing_stopped",
      conversationId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // ==========================================================================
  // Pending Operations (Offline Queue)
  // ==========================================================================

  /**
   * Execute a pending operation
   */
  private async executeOperation(
    operation: PendingOperation,
    optimisticMessage?: Message
  ): Promise<void> {
    try {
      switch (operation.type) {
        case "send_message":
          await this.executeSendMessage(operation, optimisticMessage);
          break;
        case "edit_message":
          await this.executeEditMessage(operation);
          break;
        case "delete_message":
          await this.executeDeleteMessage(operation);
          break;
        case "toggle_reaction":
          await this.executeToggleReaction(operation);
          break;
        case "mark_read":
          await this.executeMarkRead(operation);
          break;
        default:
          this.log(`Unknown operation type: ${operation.type}`);
      }

      // Success - remove from queue
      await this.store.removePendingOperation(operation.id);
      this.emitQueueChanged();
    } catch (error) {
      this.log(`Operation failed: ${operation.type}`, error);

      // Update retry count
      operation.retryCount++;
      operation.lastError =
        error instanceof Error ? error.message : "Unknown error";

      if (operation.retryCount >= MAX_RETRY_COUNT) {
        // Max retries reached - mark message as failed
        if (optimisticMessage) {
          optimisticMessage.deliveryStatus = "failed";
          optimisticMessage._error = operation.lastError;
          await this.updateMessage(optimisticMessage);
        }
        await this.store.removePendingOperation(operation.id);
      } else {
        // Update operation for retry
        await this.store.updatePendingOperation(operation);

        // Schedule retry with backoff
        const backoff = RETRY_BACKOFF_MS * Math.pow(2, operation.retryCount);
        setTimeout(() => {
          if (navigator.onLine) {
            this.executeOperation(operation, optimisticMessage);
          }
        }, backoff);
      }

      this.emitQueueChanged();
    }
  }

  /**
   * Execute send message operation
   * This will be connected to the server action
   */
  private async executeSendMessage(
    operation: PendingOperation,
    optimisticMessage?: Message
  ): Promise<void> {
    const { localId, content, replyToMessageId, mentions: _mentions } = operation.payload as {
      localId: string;
      content: string;
      replyToMessageId?: string;
      mentions?: string[];
    };

    // Import and call server action
    const { sendMessage } = await import("@/app/actions/messaging");

    const result = await sendMessage(
      operation.conversationId,
      content,
      replyToMessageId
    );

    if (!result.success || !result.message) {
      throw new Error(result.error || "Failed to send message");
    }

    // Update optimistic message with server data
    if (optimisticMessage) {
      optimisticMessage.id = result.message.id;
      optimisticMessage._pending = false;
      optimisticMessage._localId = localId;
      optimisticMessage.deliveryStatus = "sent";
      await this.updateMessage(optimisticMessage);
    }
  }

  /**
   * Execute edit message operation
   */
  private async executeEditMessage(operation: PendingOperation): Promise<void> {
    const { messageId, newContent } = operation.payload as {
      messageId: string;
      newContent: string;
    };

    const { editMessage } = await import("@/app/actions/messaging");
    const result = await editMessage(messageId, newContent);

    if (!result.success) {
      throw new Error(result.error || "Failed to edit message");
    }
  }

  /**
   * Execute delete message operation
   */
  private async executeDeleteMessage(
    operation: PendingOperation
  ): Promise<void> {
    const { messageId } = operation.payload as { messageId: string };

    const { deleteMessage } = await import("@/app/actions/messaging");
    const result = await deleteMessage(messageId);

    if (!result.success) {
      throw new Error(result.error || "Failed to delete message");
    }
  }

  /**
   * Execute toggle reaction operation
   */
  private async executeToggleReaction(
    operation: PendingOperation
  ): Promise<void> {
    const { messageId, emoji } = operation.payload as {
      messageId: string;
      emoji: string;
    };

    const { toggleReaction } = await import("@/app/actions/messaging");
    const result = await toggleReaction(messageId, emoji);

    if (!result.success) {
      throw new Error(result.error || "Failed to toggle reaction");
    }
  }

  /**
   * Execute mark read operation
   */
  private async executeMarkRead(operation: PendingOperation): Promise<void> {
    const { upToMessageId } = operation.payload as { upToMessageId?: string };

    const { markMessagesAsRead } = await import("@/app/actions/messaging");
    const result = await markMessagesAsRead(
      operation.conversationId,
      upToMessageId
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to mark as read");
    }
  }

  /**
   * Sync all pending operations (on reconnect)
   */
  async syncPendingOperations(): Promise<void> {
    const operations = await this.store.getPendingOperations();
    this.log(`Syncing ${operations.length} pending operations`);

    for (const operation of operations) {
      await this.executeOperation(operation);
    }
  }

  /**
   * Get pending operation count
   */
  async getPendingOperationCount(): Promise<number> {
    return this.store.getPendingOperationCount();
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Subscribe to events
   */
  on(event: ChatEventType, handler: ChatEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from events
   */
  off(event: ChatEventType, handler: ChatEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Emit an event
   */
  private emit(event: ChatEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      const handlerArray = Array.from(handlers);
      for (const handler of handlerArray) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Event handler error for ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Emit queue changed event
   */
  private emitQueueChanged(): void {
    this.emit({
      type: "offline_queue_changed",
      timestamp: new Date().toISOString(),
    });
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Debug logging
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[ChatEngine] ${message}`, ...args);
    }
  }

  /**
   * Clear all local data
   */
  async clearAll(): Promise<void> {
    await this.store.clearAll();
    this.conversations.clear();
    this.messages.clear();
    this.syncState = {
      initialSyncComplete: false,
      isSyncing: false,
    };
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<{
    conversationCount: number;
    messageCount: number;
    pendingOperationCount: number;
    mediaCacheCount: number;
  }> {
    return this.store.getStats();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let engineInstance: ChatEngine | null = null;

/**
 * Get the singleton ChatEngine instance
 */
export function getChatEngine(config?: ChatEngineConfig): ChatEngine {
  if (!engineInstance && config) {
    engineInstance = new ChatEngine(config);
  }
  if (!engineInstance) {
    throw new Error("ChatEngine not initialized. Call with config first.");
  }
  return engineInstance;
}

/**
 * Initialize the ChatEngine (call once on app start)
 */
export async function initializeChatEngine(
  config: ChatEngineConfig
): Promise<ChatEngine> {
  if (engineInstance) {
    // Already initialized, just return
    return engineInstance;
  }
  engineInstance = new ChatEngine(config);
  await engineInstance.initialize();
  return engineInstance;
}

/**
 * Reset the engine instance (for testing or logout)
 */
export function resetChatEngine(): void {
  if (engineInstance) {
    engineInstance.destroy();
    engineInstance = null;
  }
}
