/**
 * Chat Types Tests
 *
 * Tests for chat type definitions, delivery status logic,
 * and message type validation.
 */

import { describe, it, expect } from "vitest";
import type {
  Message,
  MessageType,
  DeliveryStatus,
  ConversationType,
  ParticipantRole,
  ConnectionState,
  Conversation,
  Participant,
  Reaction,
  ReactionSummary,
  ReadReceipt,
  DeliveryReceipt,
  PinnedMessage,
  Gap,
  PendingOperationType,
  ChatEventType,
  SendMessageOptions,
} from "@/lib/chat/types";
import { DEFAULT_ENGINE_CONFIG } from "@/lib/chat/types";
import { DeliveryTracker, type MessageDeliveryInfo } from "@/lib/chat/delivery";

describe("Chat Types", () => {
  describe("MessageType", () => {
    it("should accept text message type", () => {
      const type: MessageType = "text";
      expect(type).toBe("text");
    });
  });

  describe("DeliveryStatus", () => {
    it("should accept all valid delivery statuses", () => {
      const statuses: DeliveryStatus[] = ["sending", "sent", "delivered", "read", "failed"];
      expect(statuses).toHaveLength(5);
    });

    it("should represent message lifecycle", () => {
      const lifecycle: DeliveryStatus[] = ["sending", "sent", "delivered", "read"];
      expect(lifecycle[0]).toBe("sending");
      expect(lifecycle[lifecycle.length - 1]).toBe("read");
    });
  });

  describe("ConversationType", () => {
    it("should accept direct conversation type", () => {
      const type: ConversationType = "direct";
      expect(type).toBe("direct");
    });

    it("should accept group conversation type", () => {
      const type: ConversationType = "group";
      expect(type).toBe("group");
    });
  });

  describe("ParticipantRole", () => {
    it("should accept all valid participant roles", () => {
      const roles: ParticipantRole[] = ["owner", "admin", "member"];
      expect(roles).toHaveLength(3);
    });

    it("should have owner as highest role", () => {
      const roles: ParticipantRole[] = ["owner", "admin", "member"];
      expect(roles[0]).toBe("owner");
    });
  });

  describe("ConnectionState", () => {
    it("should accept all valid connection states", () => {
      const states: ConnectionState[] = ["connected", "connecting", "disconnected", "reconnecting"];
      expect(states).toHaveLength(4);
    });
  });

  describe("Message interface", () => {
    const baseMessage: Message = {
      id: "msg-123",
      conversationId: "conv-456",
      senderId: "user-789",
      content: "Hello, world!",
      createdAt: "2024-01-01T00:00:00Z",
      isEncrypted: false,
    };

    it("should accept minimal message", () => {
      expect(baseMessage.id).toBe("msg-123");
      expect(baseMessage.content).toBe("Hello, world!");
    });

    it("should accept message with sender info", () => {
      const message: Message = {
        ...baseMessage,
        senderName: "John Doe",
        senderUsername: "johndoe",
        senderAvatar: "https://example.com/avatar.jpg",
      };
      expect(message.senderName).toBe("John Doe");
    });

    it("should accept message with reply", () => {
      const message: Message = {
        ...baseMessage,
        replyToMessageId: "msg-100",
        replyPreview: {
          content: "Original message",
          senderName: "Jane",
        },
      };
      expect(message.replyToMessageId).toBe("msg-100");
      expect(message.replyPreview?.content).toBe("Original message");
    });

    it("should accept message with mentions", () => {
      const message: Message = {
        ...baseMessage,
        mentions: ["user-1", "user-2", "user-3"],
      };
      expect(message.mentions).toHaveLength(3);
    });

    it("should accept encrypted message", () => {
      const message: Message = {
        ...baseMessage,
        isEncrypted: true,
        encryptedContent: "encrypted-blob",
        encryptionAlgorithm: "megolm.v1",
        senderDeviceId: "device-abc",
        sessionId: "session-xyz",
      };
      expect(message.isEncrypted).toBe(true);
      expect(message.encryptionAlgorithm).toBe("megolm.v1");
    });

    it("should accept AI-generated message", () => {
      const message: Message = {
        ...baseMessage,
        isAiGenerated: true,
        aiResponseTo: "user-prompt-id",
      };
      expect(message.isAiGenerated).toBe(true);
    });

    it("should accept message with local state", () => {
      const message: Message = {
        ...baseMessage,
        _localId: "temp-123",
        _pending: true,
        _error: undefined,
      };
      expect(message._localId).toBe("temp-123");
      expect(message._pending).toBe(true);
    });

    it("should accept message with delivery status", () => {
      const statuses: DeliveryStatus[] = ["sending", "sent", "delivered", "read", "failed"];
      statuses.forEach((status) => {
        const message: Message = {
          ...baseMessage,
          deliveryStatus: status,
        };
        expect(message.deliveryStatus).toBe(status);
      });
    });
  });

  describe("Conversation interface", () => {
    it("should accept minimal conversation", () => {
      const conversation: Conversation = {
        id: "conv-123",
        type: "direct",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "user-123",
        participants: [],
        unreadCount: 0,
        isMuted: false,
        isEncrypted: false,
      };
      expect(conversation.id).toBe("conv-123");
      expect(conversation.type).toBe("direct");
    });

    it("should accept group conversation with name", () => {
      const conversation: Conversation = {
        id: "conv-123",
        type: "group",
        name: "Project Team",
        avatarUrl: "https://example.com/group.jpg",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "user-123",
        participants: [],
        unreadCount: 5,
        isMuted: false,
        isEncrypted: true,
        pinnedCount: 3,
      };
      expect(conversation.name).toBe("Project Team");
      expect(conversation.pinnedCount).toBe(3);
    });

    it("should accept conversation with local state", () => {
      const conversation: Conversation = {
        id: "conv-123",
        type: "direct",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: "user-123",
        participants: [],
        unreadCount: 0,
        isMuted: false,
        isEncrypted: false,
        _typing: ["user-456", "user-789"],
        _hasMoreMessages: true,
        _oldestMessageId: "msg-100",
      };
      expect(conversation._typing).toHaveLength(2);
    });
  });

  describe("Participant interface", () => {
    it("should accept full participant", () => {
      const participant: Participant = {
        id: "part-123",
        userId: "user-456",
        name: "John Doe",
        username: "johndoe",
        avatar: "https://example.com/avatar.jpg",
        role: "admin",
        unreadCount: 5,
        isMuted: false,
        lastReadAt: "2024-01-01T00:00:00Z",
        status: "online",
      };
      expect(participant.role).toBe("admin");
      expect(participant.status).toBe("online");
    });

    it("should accept all participant statuses", () => {
      const statuses: NonNullable<Participant["status"]>[] = ["online", "idle", "offline"];
      statuses.forEach((status) => {
        const participant: Participant = {
          id: "part-123",
          userId: "user-456",
          name: "John",
          role: "member",
          unreadCount: 0,
          isMuted: false,
          status,
        };
        expect(participant.status).toBe(status);
      });
    });
  });

  describe("Reaction types", () => {
    it("should accept reaction", () => {
      const reaction: Reaction = {
        id: "react-123",
        messageId: "msg-456",
        userId: "user-789",
        userName: "John",
        emoji: "👍",
        createdAt: "2024-01-01T00:00:00Z",
      };
      expect(reaction.emoji).toBe("👍");
    });

    it("should accept reaction summary", () => {
      const summary: ReactionSummary = {
        emoji: "👍",
        count: 5,
        users: [
          { userId: "user-1", userName: "Alice" },
          { userId: "user-2", userName: "Bob" },
        ],
        hasReacted: true,
      };
      expect(summary.count).toBe(5);
      expect(summary.hasReacted).toBe(true);
    });
  });

  describe("Receipt types", () => {
    it("should accept read receipt", () => {
      const receipt: ReadReceipt = {
        messageId: "msg-123",
        userId: "user-456",
        userName: "John",
        userAvatar: "https://example.com/avatar.jpg",
        readAt: "2024-01-01T00:00:00Z",
      };
      expect(receipt.readAt).toBeDefined();
    });

    it("should accept delivery receipt", () => {
      const receipt: DeliveryReceipt = {
        messageId: "msg-123",
        userId: "user-456",
        status: "delivered",
        receivedAt: "2024-01-01T00:00:00Z",
        deviceId: "device-abc",
      };
      expect(receipt.status).toBe("delivered");
    });

    it("should accept delivery receipt with read status", () => {
      const receipt: DeliveryReceipt = {
        messageId: "msg-123",
        userId: "user-456",
        status: "read",
        receivedAt: "2024-01-01T00:00:00Z",
      };
      expect(receipt.status).toBe("read");
    });
  });

  describe("PinnedMessage interface", () => {
    it("should accept pinned message", () => {
      const pinned: PinnedMessage = {
        id: "pin-123",
        conversationId: "conv-456",
        messageId: "msg-789",
        pinnedBy: "user-abc",
        pinnedAt: "2024-01-01T00:00:00Z",
        note: "Important discussion",
      };
      expect(pinned.note).toBe("Important discussion");
    });
  });

  describe("Gap interface", () => {
    it("should accept gap for sync", () => {
      const gap: Gap = {
        conversationId: "conv-123",
        startMessageId: "msg-100",
        endMessageId: "msg-200",
        estimatedCount: 50,
      };
      expect(gap.estimatedCount).toBe(50);
    });
  });

  describe("PendingOperationType", () => {
    it("should accept all operation types", () => {
      const types: PendingOperationType[] = [
        "send_message",
        "edit_message",
        "delete_message",
        "toggle_reaction",
        "mark_read",
        "send_typing",
      ];
      expect(types).toHaveLength(6);
    });
  });

  describe("ChatEventType", () => {
    it("should accept all event types", () => {
      const types: ChatEventType[] = [
        "conversation_updated",
        "conversation_added",
        "conversation_removed",
        "message_added",
        "message_updated",
        "message_removed",
        "typing_started",
        "typing_stopped",
        "presence_changed",
        "reaction_added",
        "reaction_removed",
        "read_receipt",
        "delivery_receipt",
        "sync_started",
        "sync_completed",
        "sync_error",
        "connection_changed",
        "offline_queue_changed",
      ];
      expect(types).toHaveLength(18);
    });
  });

  describe("SendMessageOptions interface", () => {
    it("should accept empty options", () => {
      const options: SendMessageOptions = {};
      expect(options.replyToMessageId).toBeUndefined();
    });

    it("should accept full options", () => {
      const options: SendMessageOptions = {
        replyToMessageId: "msg-100",
        mentions: ["user-1", "user-2"],
        forcePlaintext: true,
      };
      expect(options.mentions).toHaveLength(2);
      expect(options.forcePlaintext).toBe(true);
    });
  });

  describe("DEFAULT_ENGINE_CONFIG", () => {
    it("should have offlineEnabled true by default", () => {
      expect(DEFAULT_ENGINE_CONFIG.offlineEnabled).toBe(true);
    });

    it("should have e2eeDefaultForDMs true by default", () => {
      expect(DEFAULT_ENGINE_CONFIG.e2eeDefaultForDMs).toBe(true);
    });

    it("should have 10 second sync interval", () => {
      expect(DEFAULT_ENGINE_CONFIG.syncIntervalMs).toBe(10_000);
    });

    it("should have max 500 messages per conversation", () => {
      expect(DEFAULT_ENGINE_CONFIG.maxMessagesPerConversation).toBe(500);
    });

    it("should have max 100 conversations", () => {
      expect(DEFAULT_ENGINE_CONFIG.maxConversations).toBe(100);
    });
  });
});

describe("DeliveryTracker", () => {
  describe("getDisplayStatus", () => {
    const currentUserId = "user-123";

    describe("For own messages", () => {
      it("should return 'read' when readCount > 0", () => {
        const message = { senderId: currentUserId, deliveryStatus: "sent" as DeliveryStatus };
        const deliveryInfo: MessageDeliveryInfo = {
          messageId: "msg-1",
          status: "read",
          deliveredCount: 1,
          readCount: 1,
          deliveredBy: [],
          readBy: [{ userId: "user-456", receivedAt: "2024-01-01T00:00:00Z" }],
        };

        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, deliveryInfo);
        expect(status).toBe("read");
      });

      it("should return 'delivered' when deliveredCount > 0 but readCount is 0", () => {
        const message = { senderId: currentUserId, deliveryStatus: "sent" as DeliveryStatus };
        const deliveryInfo: MessageDeliveryInfo = {
          messageId: "msg-1",
          status: "delivered",
          deliveredCount: 1,
          readCount: 0,
          deliveredBy: [{ userId: "user-456", receivedAt: "2024-01-01T00:00:00Z" }],
          readBy: [],
        };

        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, deliveryInfo);
        expect(status).toBe("delivered");
      });

      it("should use message deliveryStatus when no deliveryInfo", () => {
        const message = { senderId: currentUserId, deliveryStatus: "sending" as DeliveryStatus };
        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, undefined);
        expect(status).toBe("sending");
      });

      it("should default to 'sent' when no deliveryStatus and no deliveryInfo", () => {
        const message = { senderId: currentUserId };
        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, undefined);
        expect(status).toBe("sent");
      });

      it("should handle all delivery statuses", () => {
        const statuses: DeliveryStatus[] = ["sending", "sent", "delivered", "read", "failed"];
        statuses.forEach((expectedStatus) => {
          const message = { senderId: currentUserId, deliveryStatus: expectedStatus };
          const status = DeliveryTracker.getDisplayStatus(message, currentUserId, undefined);
          expect(status).toBe(expectedStatus);
        });
      });
    });

    describe("For other users' messages", () => {
      const otherUserId = "user-456";

      it("should always return 'sent' for messages from other users", () => {
        const message = { senderId: otherUserId, deliveryStatus: "read" as DeliveryStatus };
        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, undefined);
        expect(status).toBe("sent");
      });

      it("should ignore deliveryInfo for messages from other users", () => {
        const message = { senderId: otherUserId };
        const deliveryInfo: MessageDeliveryInfo = {
          messageId: "msg-1",
          status: "read",
          deliveredCount: 5,
          readCount: 5,
          deliveredBy: [],
          readBy: [],
        };

        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, deliveryInfo);
        expect(status).toBe("sent");
      });
    });

    describe("Edge cases", () => {
      it("should handle empty deliveryInfo", () => {
        const message = { senderId: currentUserId, deliveryStatus: "sent" as DeliveryStatus };
        const deliveryInfo: MessageDeliveryInfo = {
          messageId: "msg-1",
          status: "sent",
          deliveredCount: 0,
          readCount: 0,
          deliveredBy: [],
          readBy: [],
        };

        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, deliveryInfo);
        expect(status).toBe("sent");
      });

      it("should prioritize readCount over deliveredCount", () => {
        const message = { senderId: currentUserId };
        const deliveryInfo: MessageDeliveryInfo = {
          messageId: "msg-1",
          status: "delivered", // Status says delivered
          deliveredCount: 5,
          readCount: 3, // But 3 people have read it
          deliveredBy: [],
          readBy: [],
        };

        const status = DeliveryTracker.getDisplayStatus(message, currentUserId, deliveryInfo);
        expect(status).toBe("read");
      });
    });
  });
});
