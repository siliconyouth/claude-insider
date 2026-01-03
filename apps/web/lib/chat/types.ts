/**
 * Chat Engine Type Definitions
 *
 * Core types for the chat system following Matrix SDK patterns.
 * These types are used across the engine, store, and sync layers.
 */

// ============================================================================
// Message Types
// ============================================================================

export type MessageType = "text";

export type DeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type EncryptionAlgorithm = "olm.v1" | "megolm.v1";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;

  // Reply threading
  replyToMessageId?: string;
  replyPreview?: {
    content: string;
    senderName: string;
  };

  // Mentions
  mentions?: string[];

  // Delivery (tracked locally, not in DB)
  deliveryStatus?: DeliveryStatus;

  // E2EE
  isEncrypted: boolean;
  encryptedContent?: string;
  encryptionAlgorithm?: EncryptionAlgorithm;
  senderDeviceId?: string;
  senderKey?: string;
  sessionId?: string;

  // AI
  isAiGenerated?: boolean;
  aiResponseTo?: string;

  // Local state (not persisted to server)
  _localId?: string;
  _pending?: boolean;
  _error?: string;
}

export interface MessageSender {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface MessageWithSender extends Message {
  sender: MessageSender;
}

// ============================================================================
// Conversation Types
// ============================================================================

export type ConversationType = "direct" | "group";

export type ParticipantRole = "owner" | "admin" | "member";

export interface Participant {
  id: string;
  userId: string;
  odierUserId?: string; // Legacy field from server
  name: string;
  username?: string;
  avatar?: string;
  role: ParticipantRole;
  unreadCount: number;
  isMuted: boolean;
  lastReadAt?: string;
  status?: "online" | "idle" | "offline";
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  createdBy: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  participants: Participant[];
  unreadCount: number;
  isMuted: boolean;

  // E2EE
  isEncrypted: boolean;

  // Pinned messages count
  pinnedCount?: number;

  // Local state
  _typing?: string[];
  _hasMoreMessages?: boolean;
  _oldestMessageId?: string;
}

// ============================================================================
// Reaction Types
// ============================================================================

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  userName?: string;
  userUsername?: string;
  emoji: string;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: { userId: string; userName?: string }[];
  hasReacted: boolean;
}

// ============================================================================
// Read Receipt Types
// ============================================================================

export interface ReadReceipt {
  messageId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  readAt: string;
}

export interface DeliveryReceipt {
  messageId: string;
  userId: string;
  status: "delivered" | "read";
  receivedAt: string;
  deviceId?: string;
}

// ============================================================================
// Pinned Message Types
// ============================================================================

export interface PinnedMessage {
  id: string;
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  note?: string;
  message?: Message;
}

// ============================================================================
// Sync Types (Matrix SDK Pattern)
// ============================================================================

export interface SyncState {
  /** Last sync token for incremental sync */
  syncToken?: string;
  /** Whether initial sync is complete */
  initialSyncComplete: boolean;
  /** Last successful sync timestamp */
  lastSyncAt?: string;
  /** Whether currently syncing */
  isSyncing: boolean;
  /** Sync error if any */
  syncError?: string;
}

export interface ConversationSyncState {
  conversationId: string;
  /** Oldest message ID we have locally */
  oldestMessageId?: string;
  /** Newest message ID we have locally */
  newestMessageId?: string;
  /** Last sync timestamp for this conversation */
  lastSyncAt?: string;
  /** Whether we have all historical messages */
  hasAllHistory: boolean;
}

export interface Gap {
  conversationId: string;
  startMessageId: string;
  endMessageId: string;
  estimatedCount?: number;
}

export interface SyncResponse {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  hasMore: boolean;
  nextToken?: string;
}

// ============================================================================
// Pending Operation Types (Offline Queue)
// ============================================================================

export type PendingOperationType =
  | "send_message"
  | "edit_message"
  | "delete_message"
  | "toggle_reaction"
  | "mark_read"
  | "send_typing";

export interface PendingOperation {
  id: string;
  type: PendingOperationType;
  conversationId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export type ChatEventType =
  | "conversation_updated"
  | "conversation_added"
  | "conversation_removed"
  | "message_added"
  | "message_updated"
  | "message_removed"
  | "typing_started"
  | "typing_stopped"
  | "presence_changed"
  | "reaction_added"
  | "reaction_removed"
  | "read_receipt"
  | "delivery_receipt"
  | "sync_started"
  | "sync_completed"
  | "sync_error"
  | "connection_changed"
  | "offline_queue_changed";

export interface ChatEvent {
  type: ChatEventType;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  payload?: unknown;
  timestamp: string;
}

export type ChatEventHandler = (event: ChatEvent) => void;

// ============================================================================
// Engine Configuration
// ============================================================================

export interface ChatEngineConfig {
  /** Current user ID */
  userId: string;

  /** Enable offline support */
  offlineEnabled: boolean;

  /** Enable E2EE by default for DMs */
  e2eeDefaultForDMs: boolean;

  /** Sync interval in milliseconds */
  syncIntervalMs: number;

  /** Max messages to keep per conversation in cache */
  maxMessagesPerConversation: number;

  /** Max conversations to keep in cache */
  maxConversations: number;

  /** Enable debug logging */
  debug: boolean;
}

export const DEFAULT_ENGINE_CONFIG: Omit<ChatEngineConfig, "userId"> = {
  offlineEnabled: true,
  e2eeDefaultForDMs: true,
  syncIntervalMs: 10_000,
  maxMessagesPerConversation: 500,
  maxConversations: 100,
  debug: process.env.NODE_ENV === "development",
};

// ============================================================================
// Send Options
// ============================================================================

export interface SendMessageOptions {
  /** Reply to message ID */
  replyToMessageId?: string;

  /** Mentioned user IDs */
  mentions?: string[];

  /** Force plaintext (skip E2EE) */
  forcePlaintext?: boolean;
}

// ============================================================================
// Connection State
// ============================================================================

export type ConnectionState = "connected" | "connecting" | "disconnected" | "reconnecting";

export interface ConnectionInfo {
  state: ConnectionState;
  lastConnectedAt?: string;
  reconnectAttempts: number;
  error?: string;
}
