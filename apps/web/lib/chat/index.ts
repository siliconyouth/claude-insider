/**
 * Chat Module Exports
 *
 * This module provides a complete chat system following Matrix SDK patterns:
 * - Offline-first with IndexedDB storage
 * - Background sync via Service Worker
 * - Optimistic UI with pending queue
 * - Gap detection and filling
 * - Real-time typing indicators
 * - Read receipts and delivery status
 *
 * Usage:
 * ```tsx
 * import { ChatProvider, useChat, useConversation } from '@/lib/chat';
 *
 * function App() {
 *   return (
 *     <ChatProvider userId={user.id}>
 *       <ChatList />
 *     </ChatProvider>
 *   );
 * }
 *
 * function ChatList() {
 *   const { conversations, sendMessage } = useChat();
 *   // ...
 * }
 * ```
 */

// Types
export type {
  // Message types
  Message,
  MessageType,
  DeliveryStatus,
  EncryptionAlgorithm,
  MessageSender,
  MessageWithSender,
  SendMessageOptions,

  // Conversation types
  Conversation,
  ConversationType,
  Participant,
  ParticipantRole,

  // Interaction types
  Reaction,
  ReactionSummary,
  ReadReceipt,
  DeliveryReceipt,
  PinnedMessage,

  // Sync types
  SyncState,
  ConversationSyncState,
  Gap,
  SyncResponse,

  // Offline types
  PendingOperation,
  PendingOperationType,

  // Event types
  ChatEvent,
  ChatEventType,
  ChatEventHandler,

  // Config types
  ChatEngineConfig,
  ConnectionState,
  ConnectionInfo,
} from "./types";

// Constants
export { DEFAULT_ENGINE_CONFIG } from "./types";

// Store (for advanced use)
export { getChatStore, type ChatStore } from "./store";

// Engine (for advanced use)
export {
  initializeChatEngine,
  getChatEngine,
  resetChatEngine,
  type ChatEngine,
} from "./engine";

// Sync (for advanced use)
export { getSyncEngine, resetSyncEngine, type SyncEngine } from "./sync";

// React Provider & Hooks (primary API)
export {
  ChatProvider,
  ConversationProvider,
  useChat,
  useConversation,
  useChatConversation,
  useChatReady,
  useChatSync,
  useTypingIndicator,
  useChatBackgroundSync,
} from "./provider";

// E2EE Auto (automatic encryption for DMs)
export {
  shouldEncrypt,
  checkE2EEAvailability,
  setupDMEncryption,
  upgradeDMToE2EE,
  getConversationE2EEStatus,
  isConversationEncrypted,
  isE2EEAvailable,
  type E2EESetupResult,
  type E2EEStatus,
  type DeviceKeys,
} from "./e2ee-auto";

// Delivery Status Tracking
export {
  DeliveryTracker,
  initializeDeliveryTracker,
  getDeliveryTracker,
  resetDeliveryTracker,
  type MessageDeliveryInfo,
  type DeliveryTrackerConfig,
} from "./delivery";

// Voice Messages
export {
  VoiceRecorder,
  VoicePlayer,
  formatDuration,
  isVoiceRecordingSupported,
  getSupportedMimeType,
  type VoiceRecorderConfig,
  type VoiceRecorderState,
  type VoiceRecorderResult,
  type VoicePlayerState,
} from "./voice";

// Link Unfurling
export {
  LinkUnfurler,
  getLinkUnfurler,
  resetLinkUnfurler,
  isPreviewableUrl,
  getDomainName,
  isVideoUrl,
  getYouTubeVideoId,
  type UnfurlData,
  type UnfurlResult,
  type LinkUnfurlerConfig,
} from "./unfurl";

// Caching
export {
  LRUCache,
  MessageCache,
  ConversationCache,
  PresenceCache,
  UserProfileCache,
  getMessageCache,
  getConversationCache,
  getPresenceCache,
  getUserProfileCache,
  resetAllCaches,
  cleanupAllCaches,
  DEFAULT_CACHE_CONFIG,
  type CacheConfig,
  type PresenceInfo,
  type UserProfile,
} from "./cache";

// Realtime Optimizations
export {
  useBatchedUpdates,
  useDebouncedTyping,
  useOptimizedPresence,
  useOptimizedChannel,
  subscriptionManager,
  RequestDeduplicator,
  messageDeduplicator,
  conversationDeduplicator,
  presenceDeduplicator,
} from "./realtime-optimized";

// High-Level Hooks
export {
  // Bridge hooks (work with both old and new systems)
  useChatAvailable,
  useChatMessages,
  useChatConversations,
  // New specialized hooks
  useMessageInput,
  useMessageActions,
  useDeliveryStatus,
  usePresence,
} from "./hooks";
