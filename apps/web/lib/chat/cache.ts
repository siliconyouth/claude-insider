/**
 * Chat Cache Utilities
 *
 * Multi-layer caching for optimal performance:
 * - IndexedDB: Persistent storage (via store.ts)
 * - In-memory LRU: Session cache with TTL
 * - React state: Component-level reactivity
 *
 * Usage:
 * ```typescript
 * import { MessageCache, ConversationCache, PresenceCache } from '@/lib/chat/cache';
 *
 * // Get or fetch message
 * const message = await messageCache.get(messageId, () => fetchMessage(messageId));
 *
 * // Invalidate on update
 * messageCache.invalidate(messageId);
 * ```
 */

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export interface CacheConfig {
  /** Maximum number of conversations to cache */
  maxConversations: number;
  /** Maximum messages per conversation */
  maxMessagesPerConversation: number;
  /** Maximum media cache size in bytes */
  maxMediaCacheSize: number;
  /** Conversation cache TTL in ms */
  conversationTTL: number;
  /** Message cache TTL in ms */
  messageTTL: number;
  /** Presence cache TTL in ms */
  presenceTTL: number;
  /** User profile cache TTL in ms */
  userProfileTTL: number;
  /** Link preview cache TTL in ms */
  linkPreviewTTL: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  // IndexedDB limits
  maxConversations: 100,
  maxMessagesPerConversation: 500,
  maxMediaCacheSize: 100 * 1024 * 1024, // 100MB

  // In-memory TTLs
  conversationTTL: 5 * 60 * 1000, // 5 minutes
  messageTTL: 2 * 60 * 1000, // 2 minutes
  presenceTTL: 30 * 1000, // 30 seconds
  userProfileTTL: 10 * 60 * 1000, // 10 minutes
  linkPreviewTTL: 60 * 60 * 1000, // 1 hour
};

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Generic LRU (Least Recently Used) cache with TTL support
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize: number, defaultTTL: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache, optionally fetching if missing
   */
  async get(key: K, fetcher?: () => Promise<V>): Promise<V | undefined> {
    const entry = this.cache.get(key);

    if (entry) {
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
      } else {
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
      }
    }

    // Fetch if provided
    if (fetcher) {
      try {
        const value = await fetcher();
        this.set(key, value);
        return value;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Get value synchronously (no fetcher)
   */
  getSync(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return undefined;
      }

      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }

    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V, ttl?: number): void {
    // Delete if exists to update position
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate (alias for delete)
   */
  invalidate(key: K): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate multiple keys matching a predicate
   */
  invalidateWhere(predicate: (key: K, value: V) => boolean): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (predicate(key, entry.value)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get all keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   */
  values(): V[] {
    const now = Date.now();
    const values: V[] = [];

    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        values.push(entry.value);
      }
    }

    return values;
  }

  /**
   * Get all entries
   */
  entries(): Array<[K, V]> {
    const now = Date.now();
    const entries: Array<[K, V]> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        entries.push([key, entry.value]);
      }
    }

    return entries;
  }
}

// ============================================================================
// SPECIALIZED CACHES
// ============================================================================

import type { Message, Conversation, Participant } from "./types";

/**
 * Message cache with conversation-based invalidation
 */
export class MessageCache extends LRUCache<string, Message> {
  private conversationIndex: Map<string, Set<string>> = new Map();

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    super(
      config.maxConversations * config.maxMessagesPerConversation,
      config.messageTTL
    );
  }

  override set(key: string, value: Message, ttl?: number): void {
    super.set(key, value, ttl);

    // Index by conversation
    const conversationId = value.conversationId;
    if (!this.conversationIndex.has(conversationId)) {
      this.conversationIndex.set(conversationId, new Set());
    }
    this.conversationIndex.get(conversationId)?.add(key);
  }

  override delete(key: K): boolean {
    const message = this.getSync(key as unknown as string);
    if (message) {
      this.conversationIndex.get(message.conversationId)?.delete(key as unknown as string);
    }
    return super.delete(key);
  }

  /**
   * Invalidate all messages in a conversation
   */
  invalidateConversation(conversationId: string): number {
    const messageIds = this.conversationIndex.get(conversationId);
    if (!messageIds) return 0;

    let count = 0;
    for (const id of messageIds) {
      if (super.delete(id as unknown as K)) {
        count++;
      }
    }

    this.conversationIndex.delete(conversationId);
    return count;
  }

  /**
   * Get all cached messages for a conversation
   */
  getConversationMessages(conversationId: string): Message[] {
    const messageIds = this.conversationIndex.get(conversationId);
    if (!messageIds) return [];

    const messages: Message[] = [];
    for (const id of messageIds) {
      const message = this.getSync(id as unknown as K);
      if (message) {
        messages.push(message as unknown as Message);
      }
    }

    return messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
}

// Type alias for generic key
type K = string;

/**
 * Conversation cache with participant index
 */
export class ConversationCache extends LRUCache<string, Conversation> {
  private participantIndex: Map<string, Set<string>> = new Map();

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    super(config.maxConversations, config.conversationTTL);
  }

  override set(key: string, value: Conversation, ttl?: number): void {
    super.set(key, value, ttl);

    // Index by participants
    if (value.participants) {
      for (const participant of value.participants) {
        if (!this.participantIndex.has(participant.userId)) {
          this.participantIndex.set(participant.userId, new Set());
        }
        this.participantIndex.get(participant.userId)?.add(key);
      }
    }
  }

  /**
   * Get all conversations for a user
   */
  getUserConversations(userId: string): Conversation[] {
    const conversationIds = this.participantIndex.get(userId);
    if (!conversationIds) return [];

    const conversations: Conversation[] = [];
    for (const id of conversationIds) {
      const conversation = this.getSync(id);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    return conversations;
  }
}

/**
 * Presence cache with short TTL
 */
export interface PresenceInfo {
  userId: string;
  status: "online" | "idle" | "offline";
  lastSeen?: string;
  statusMessage?: string;
}

export class PresenceCache extends LRUCache<string, PresenceInfo> {
  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    super(1000, config.presenceTTL); // Cache up to 1000 users
  }

  /**
   * Batch update presence for multiple users
   */
  batchUpdate(presences: PresenceInfo[]): void {
    for (const presence of presences) {
      this.set(presence.userId, presence);
    }
  }

  /**
   * Get presence for multiple users
   */
  getMany(userIds: string[]): Map<string, PresenceInfo | undefined> {
    const result = new Map<string, PresenceInfo | undefined>();
    for (const userId of userIds) {
      result.set(userId, this.getSync(userId));
    }
    return result;
  }
}

/**
 * User profile cache
 */
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  image?: string;
  bio?: string;
}

export class UserProfileCache extends LRUCache<string, UserProfile> {
  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    super(500, config.userProfileTTL); // Cache up to 500 profiles
  }
}

// ============================================================================
// GLOBAL CACHE INSTANCES
// ============================================================================

let messageCache: MessageCache | null = null;
let conversationCache: ConversationCache | null = null;
let presenceCache: PresenceCache | null = null;
let userProfileCache: UserProfileCache | null = null;

export function getMessageCache(
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): MessageCache {
  if (!messageCache) {
    messageCache = new MessageCache(config);
  }
  return messageCache;
}

export function getConversationCache(
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): ConversationCache {
  if (!conversationCache) {
    conversationCache = new ConversationCache(config);
  }
  return conversationCache;
}

export function getPresenceCache(
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): PresenceCache {
  if (!presenceCache) {
    presenceCache = new PresenceCache(config);
  }
  return presenceCache;
}

export function getUserProfileCache(
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): UserProfileCache {
  if (!userProfileCache) {
    userProfileCache = new UserProfileCache(config);
  }
  return userProfileCache;
}

/**
 * Reset all caches (useful for logout)
 */
export function resetAllCaches(): void {
  messageCache?.clear();
  conversationCache?.clear();
  presenceCache?.clear();
  userProfileCache?.clear();

  messageCache = null;
  conversationCache = null;
  presenceCache = null;
  userProfileCache = null;
}

/**
 * Clean up expired entries in all caches
 */
export function cleanupAllCaches(): { total: number; byCache: Record<string, number> } {
  const byCache: Record<string, number> = {};

  byCache.messages = messageCache?.cleanup() ?? 0;
  byCache.conversations = conversationCache?.cleanup() ?? 0;
  byCache.presence = presenceCache?.cleanup() ?? 0;
  byCache.profiles = userProfileCache?.cleanup() ?? 0;

  return {
    total: Object.values(byCache).reduce((a, b) => a + b, 0),
    byCache,
  };
}

// Auto-cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(cleanupAllCaches, 5 * 60 * 1000);
}
