/**
 * Chat IndexedDB Store
 *
 * Persistent local storage for chat data using IndexedDB.
 * Follows Matrix SDK pattern: server is source of truth, local is cache.
 *
 * Database Schema:
 * - conversations: Full conversation objects
 * - messages: Messages indexed by conversation
 * - pending_operations: Offline queue for failed operations
 * - sync_state: Sync tokens and timestamps
 * - media_cache: Cached media files (voice, images)
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Conversation,
  Message,
  PendingOperation,
  ConversationSyncState,
  SyncState,
} from "./types";

// ============================================================================
// Database Schema
// ============================================================================

const DB_NAME = "claude-insider-chat";
const DB_VERSION = 1;

interface ChatDBSchema extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: {
      "by-last-message": string;
      "by-unread": number;
    };
  };
  messages: {
    key: string;
    value: Message;
    indexes: {
      "by-conversation": string;
      "by-conversation-created": [string, string];
    };
  };
  pending_operations: {
    key: string;
    value: PendingOperation;
    indexes: {
      "by-conversation": string;
      "by-created": string;
    };
  };
  conversation_sync_state: {
    key: string;
    value: ConversationSyncState;
  };
  sync_state: {
    key: string;
    value: SyncState;
  };
  media_cache: {
    key: string;
    value: {
      id: string;
      conversationId: string;
      messageId: string;
      type: "image" | "file";
      blob: Blob;
      cachedAt: string;
      expiresAt: string;
    };
    indexes: {
      "by-expires": string;
    };
  };
}

// ============================================================================
// Store Class
// ============================================================================

export class ChatStore {
  private db: IDBPDatabase<ChatDBSchema> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    this.db = await openDB<ChatDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        // Fresh install or upgrade from version 0
        if (oldVersion < 1) {
          // Conversations store
          const conversationsStore = db.createObjectStore("conversations", {
            keyPath: "id",
          });
          conversationsStore.createIndex("by-last-message", "lastMessageAt");
          conversationsStore.createIndex("by-unread", "unreadCount");

          // Messages store
          const messagesStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messagesStore.createIndex("by-conversation", "conversationId");
          messagesStore.createIndex("by-conversation-created", [
            "conversationId",
            "createdAt",
          ]);

          // Pending operations store
          const pendingStore = db.createObjectStore("pending_operations", {
            keyPath: "id",
          });
          pendingStore.createIndex("by-conversation", "conversationId");
          pendingStore.createIndex("by-created", "createdAt");

          // Conversation sync state store
          db.createObjectStore("conversation_sync_state", {
            keyPath: "conversationId",
          });

          // Global sync state store
          db.createObjectStore("sync_state", {
            keyPath: "id",
          });

          // Media cache store
          const mediaStore = db.createObjectStore("media_cache", {
            keyPath: "id",
          });
          mediaStore.createIndex("by-expires", "expiresAt");
        }
      },
    });
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureDB(): Promise<IDBPDatabase<ChatDBSchema>> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error("Failed to initialize chat database");
    }
    return this.db;
  }

  // ==========================================================================
  // Conversations
  // ==========================================================================

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | undefined> {
    const db = await this.ensureDB();
    return db.get("conversations", id);
  }

  /**
   * Get all conversations, sorted by last message
   */
  async getConversations(): Promise<Conversation[]> {
    const db = await this.ensureDB();
    const conversations = await db.getAll("conversations");
    // Sort by lastMessageAt descending
    return conversations.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Get conversations with unread messages
   */
  async getUnreadConversations(): Promise<Conversation[]> {
    const db = await this.ensureDB();
    const conversations = await db.getAllFromIndex(
      "conversations",
      "by-unread",
      IDBKeyRange.lowerBound(1)
    );
    return conversations;
  }

  /**
   * Save a conversation
   */
  async putConversation(conversation: Conversation): Promise<void> {
    const db = await this.ensureDB();
    await db.put("conversations", conversation);
  }

  /**
   * Save multiple conversations
   */
  async putConversations(conversations: Conversation[]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction("conversations", "readwrite");
    await Promise.all([
      ...conversations.map((c) => tx.store.put(c)),
      tx.done,
    ]);
  }

  /**
   * Delete a conversation and its messages
   */
  async deleteConversation(id: string): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(["conversations", "messages"], "readwrite");

    // Delete conversation
    await tx.objectStore("conversations").delete(id);

    // Delete all messages for this conversation
    const messagesStore = tx.objectStore("messages");
    const index = messagesStore.index("by-conversation");
    let cursor = await index.openCursor(IDBKeyRange.only(id));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }

  /**
   * Update conversation's last message preview
   */
  async updateLastMessage(
    conversationId: string,
    preview: string,
    timestamp: string
  ): Promise<void> {
    const db = await this.ensureDB();
    const conversation = await db.get("conversations", conversationId);
    if (conversation) {
      conversation.lastMessagePreview = preview;
      conversation.lastMessageAt = timestamp;
      await db.put("conversations", conversation);
    }
  }

  /**
   * Update unread count for a conversation
   */
  async updateUnreadCount(
    conversationId: string,
    count: number
  ): Promise<void> {
    const db = await this.ensureDB();
    const conversation = await db.get("conversations", conversationId);
    if (conversation) {
      conversation.unreadCount = count;
      await db.put("conversations", conversation);
    }
  }

  // ==========================================================================
  // Messages
  // ==========================================================================

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options: {
      limit?: number;
      beforeId?: string;
      afterId?: string;
    } = {}
  ): Promise<Message[]> {
    const db = await this.ensureDB();
    const { limit = 50, beforeId, afterId } = options;

    // Get all messages for conversation, sorted by createdAt
    const index = db
      .transaction("messages", "readonly")
      .objectStore("messages")
      .index("by-conversation-created");

    const messages: Message[] = [];

    // If we have a beforeId, find its timestamp first
    let beforeTimestamp: string | undefined;
    let afterTimestamp: string | undefined;

    if (beforeId) {
      const beforeMsg = await db.get("messages", beforeId);
      beforeTimestamp = beforeMsg?.createdAt;
    }

    if (afterId) {
      const afterMsg = await db.get("messages", afterId);
      afterTimestamp = afterMsg?.createdAt;
    }

    // Build range
    let range: IDBKeyRange;
    if (beforeTimestamp && afterTimestamp) {
      range = IDBKeyRange.bound(
        [conversationId, afterTimestamp],
        [conversationId, beforeTimestamp],
        true,
        true
      );
    } else if (beforeTimestamp) {
      range = IDBKeyRange.bound(
        [conversationId, ""],
        [conversationId, beforeTimestamp],
        false,
        true
      );
    } else if (afterTimestamp) {
      range = IDBKeyRange.bound(
        [conversationId, afterTimestamp],
        [conversationId, "\uffff"],
        true,
        false
      );
    } else {
      range = IDBKeyRange.bound(
        [conversationId, ""],
        [conversationId, "\uffff"]
      );
    }

    // Iterate in reverse (newest first) and collect
    let cursor = await index.openCursor(range, "prev");
    while (cursor && messages.length < limit) {
      messages.push(cursor.value);
      cursor = await cursor.continue();
    }

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Get a single message by ID
   */
  async getMessage(id: string): Promise<Message | undefined> {
    const db = await this.ensureDB();
    return db.get("messages", id);
  }

  /**
   * Save a message
   */
  async putMessage(message: Message): Promise<void> {
    const db = await this.ensureDB();
    await db.put("messages", message);
  }

  /**
   * Save multiple messages
   */
  async putMessages(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const db = await this.ensureDB();
    const tx = db.transaction("messages", "readwrite");
    await Promise.all([...messages.map((m) => tx.store.put(m)), tx.done]);
  }

  /**
   * Delete a message (soft delete - marks as deleted)
   */
  async deleteMessage(id: string): Promise<void> {
    const db = await this.ensureDB();
    const message = await db.get("messages", id);
    if (message) {
      message.deletedAt = new Date().toISOString();
      await db.put("messages", message);
    }
  }

  /**
   * Hard delete a message (remove from store)
   */
  async removeMessage(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete("messages", id);
  }

  /**
   * Get message count for a conversation
   */
  async getMessageCount(conversationId: string): Promise<number> {
    const db = await this.ensureDB();
    return db.countFromIndex(
      "messages",
      "by-conversation",
      IDBKeyRange.only(conversationId)
    );
  }

  /**
   * Get oldest message ID for a conversation
   */
  async getOldestMessageId(conversationId: string): Promise<string | undefined> {
    const db = await this.ensureDB();
    const index = db
      .transaction("messages", "readonly")
      .objectStore("messages")
      .index("by-conversation-created");

    const cursor = await index.openCursor(
      IDBKeyRange.bound([conversationId, ""], [conversationId, "\uffff"]),
      "next"
    );

    return cursor?.value.id;
  }

  /**
   * Get newest message ID for a conversation
   */
  async getNewestMessageId(conversationId: string): Promise<string | undefined> {
    const db = await this.ensureDB();
    const index = db
      .transaction("messages", "readonly")
      .objectStore("messages")
      .index("by-conversation-created");

    const cursor = await index.openCursor(
      IDBKeyRange.bound([conversationId, ""], [conversationId, "\uffff"]),
      "prev"
    );

    return cursor?.value.id;
  }

  /**
   * Trim old messages to stay within limit
   */
  async trimMessages(
    conversationId: string,
    maxMessages: number
  ): Promise<number> {
    const db = await this.ensureDB();
    const count = await this.getMessageCount(conversationId);

    if (count <= maxMessages) return 0;

    const toDelete = count - maxMessages;
    const index = db
      .transaction("messages", "readwrite")
      .objectStore("messages")
      .index("by-conversation-created");

    let deleted = 0;
    let cursor = await index.openCursor(
      IDBKeyRange.bound([conversationId, ""], [conversationId, "\uffff"]),
      "next"
    );

    while (cursor && deleted < toDelete) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }

    return deleted;
  }

  // ==========================================================================
  // Pending Operations (Offline Queue)
  // ==========================================================================

  /**
   * Add a pending operation to the queue
   */
  async addPendingOperation(operation: PendingOperation): Promise<void> {
    const db = await this.ensureDB();
    await db.put("pending_operations", operation);
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<PendingOperation[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex("pending_operations", "by-created");
  }

  /**
   * Get pending operations for a conversation
   */
  async getPendingOperationsForConversation(
    conversationId: string
  ): Promise<PendingOperation[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex(
      "pending_operations",
      "by-conversation",
      IDBKeyRange.only(conversationId)
    );
  }

  /**
   * Update a pending operation (e.g., increment retry count)
   */
  async updatePendingOperation(operation: PendingOperation): Promise<void> {
    const db = await this.ensureDB();
    await db.put("pending_operations", operation);
  }

  /**
   * Remove a pending operation
   */
  async removePendingOperation(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete("pending_operations", id);
  }

  /**
   * Get count of pending operations
   */
  async getPendingOperationCount(): Promise<number> {
    const db = await this.ensureDB();
    return db.count("pending_operations");
  }

  // ==========================================================================
  // Sync State
  // ==========================================================================

  /**
   * Get global sync state
   */
  async getSyncState(): Promise<SyncState> {
    const db = await this.ensureDB();
    const state = await db.get("sync_state", "global");
    return (
      state || {
        initialSyncComplete: false,
        isSyncing: false,
      }
    );
  }

  /**
   * Update global sync state
   */
  async setSyncState(state: Partial<SyncState>): Promise<void> {
    const db = await this.ensureDB();
    const current = await this.getSyncState();
    await db.put("sync_state", {
      ...current,
      ...state,
      id: "global",
    } as SyncState & { id: string });
  }

  /**
   * Get sync state for a conversation
   */
  async getConversationSyncState(
    conversationId: string
  ): Promise<ConversationSyncState | undefined> {
    const db = await this.ensureDB();
    return db.get("conversation_sync_state", conversationId);
  }

  /**
   * Update sync state for a conversation
   */
  async setConversationSyncState(
    state: ConversationSyncState
  ): Promise<void> {
    const db = await this.ensureDB();
    await db.put("conversation_sync_state", state);
  }

  // ==========================================================================
  // Media Cache
  // ==========================================================================

  /**
   * Cache media (image, file)
   */
  async cacheMedia(
    id: string,
    conversationId: string,
    messageId: string,
    type: "image" | "file",
    blob: Blob,
    ttlMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
  ): Promise<void> {
    const db = await this.ensureDB();
    const now = new Date();
    await db.put("media_cache", {
      id,
      conversationId,
      messageId,
      type,
      blob,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    });
  }

  /**
   * Get cached media
   */
  async getCachedMedia(id: string): Promise<Blob | undefined> {
    const db = await this.ensureDB();
    const entry = await db.get("media_cache", id);
    if (!entry) return undefined;

    // Check if expired
    if (new Date(entry.expiresAt) < new Date()) {
      await db.delete("media_cache", id);
      return undefined;
    }

    return entry.blob;
  }

  /**
   * Clean up expired media cache entries
   */
  async cleanupExpiredMedia(): Promise<number> {
    const db = await this.ensureDB();
    const now = new Date().toISOString();

    let deleted = 0;
    const tx = db.transaction("media_cache", "readwrite");
    const index = tx.store.index("by-expires");

    let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
    while (cursor) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }

    await tx.done;
    return deleted;
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Clear all data (logout, reset)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction(
      [
        "conversations",
        "messages",
        "pending_operations",
        "conversation_sync_state",
        "sync_state",
        "media_cache",
      ],
      "readwrite"
    );

    await Promise.all([
      tx.objectStore("conversations").clear(),
      tx.objectStore("messages").clear(),
      tx.objectStore("pending_operations").clear(),
      tx.objectStore("conversation_sync_state").clear(),
      tx.objectStore("sync_state").clear(),
      tx.objectStore("media_cache").clear(),
      tx.done,
    ]);
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    conversationCount: number;
    messageCount: number;
    pendingOperationCount: number;
    mediaCacheCount: number;
  }> {
    const db = await this.ensureDB();
    return {
      conversationCount: await db.count("conversations"),
      messageCount: await db.count("messages"),
      pendingOperationCount: await db.count("pending_operations"),
      mediaCacheCount: await db.count("media_cache"),
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storeInstance: ChatStore | null = null;

/**
 * Get the singleton ChatStore instance
 */
export function getChatStore(): ChatStore {
  if (!storeInstance) {
    storeInstance = new ChatStore();
  }
  return storeInstance;
}

/**
 * Reset the store instance (for testing)
 */
export function resetChatStore(): void {
  if (storeInstance) {
    storeInstance.close();
    storeInstance = null;
  }
}
