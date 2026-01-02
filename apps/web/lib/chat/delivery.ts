/**
 * Delivery Status Tracker
 *
 * Tracks message delivery status following WhatsApp/iMessage patterns:
 * - SENDING: Message being transmitted (optimistic)
 * - SENT: Server acknowledged receipt
 * - DELIVERED: Recipient device received message
 * - READ: Recipient viewed the message
 * - FAILED: Transmission failed (will retry)
 *
 * Key responsibilities:
 * - Mark messages as sent/delivered/read
 * - Broadcast delivery receipts via realtime
 * - Batch receipt updates for efficiency
 * - Track per-device delivery for multi-device support
 */

"use client";

import type { DeliveryStatus, DeliveryReceipt } from "./types";

// ============================================================================
// TYPES
// ============================================================================

// Re-export DeliveryReceipt from types for convenience
export type { DeliveryReceipt };

export interface MessageDeliveryInfo {
  messageId: string;
  status: DeliveryStatus;
  deliveredCount: number;
  readCount: number;
  deliveredBy: Array<{ userId: string; receivedAt: string }>;
  readBy: Array<{ userId: string; receivedAt: string }>;
}

export interface DeliveryTrackerConfig {
  /** Current user ID */
  userId: string;
  /** Debounce batch updates (ms) */
  batchDebounceMs?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_DEBOUNCE_MS = 100;
const MAX_BATCH_SIZE = 50;

// ============================================================================
// DELIVERY TRACKER CLASS
// ============================================================================

export class DeliveryTracker {
  private config: Required<DeliveryTrackerConfig>;
  private pendingReceipts: DeliveryReceipt[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<(receipt: DeliveryReceipt) => void> = new Set();

  constructor(config: DeliveryTrackerConfig) {
    this.config = {
      userId: config.userId,
      batchDebounceMs: config.batchDebounceMs ?? BATCH_DEBOUNCE_MS,
      debug: config.debug ?? false,
    };
  }

  // ==========================================================================
  // STATUS UPDATES
  // ==========================================================================

  /**
   * Mark a message as sent (server confirmed)
   */
  async markSent(messageId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/messages/delivery-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          status: "sent",
        }),
      });

      return response.ok;
    } catch (error) {
      this.log("Error marking message as sent:", error);
      return false;
    }
  }

  /**
   * Mark a message as delivered (recipient's device received it)
   */
  async markDelivered(
    messageId: string,
    deviceId?: string
  ): Promise<boolean> {
    const receipt: DeliveryReceipt = {
      messageId,
      userId: this.config.userId,
      status: "delivered",
      receivedAt: new Date().toISOString(),
      deviceId,
    };

    return this.queueReceipt(receipt);
  }

  /**
   * Mark a message as read (recipient viewed it)
   */
  async markRead(messageId: string): Promise<boolean> {
    const receipt: DeliveryReceipt = {
      messageId,
      userId: this.config.userId,
      status: "read",
      receivedAt: new Date().toISOString(),
    };

    return this.queueReceipt(receipt);
  }

  /**
   * Mark all messages in a conversation as read up to a certain message
   */
  async markConversationRead(
    conversationId: string,
    upToMessageId?: string
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          upToMessageId,
        }),
      });

      return response.ok;
    } catch (error) {
      this.log("Error marking conversation as read:", error);
      return false;
    }
  }

  // ==========================================================================
  // BATCH PROCESSING
  // ==========================================================================

  /**
   * Queue a receipt for batched sending
   */
  private async queueReceipt(receipt: DeliveryReceipt): Promise<boolean> {
    this.pendingReceipts.push(receipt);

    // If batch is full, send immediately
    if (this.pendingReceipts.length >= MAX_BATCH_SIZE) {
      return this.flushReceipts();
    }

    // Otherwise debounce
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    return new Promise((resolve) => {
      this.batchTimeout = setTimeout(async () => {
        const success = await this.flushReceipts();
        resolve(success);
      }, this.config.batchDebounceMs);
    });
  }

  /**
   * Send all pending receipts
   */
  private async flushReceipts(): Promise<boolean> {
    if (this.pendingReceipts.length === 0) return true;

    const receipts = [...this.pendingReceipts];
    this.pendingReceipts = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      const response = await fetch("/api/messages/delivery-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipts }),
      });

      if (response.ok) {
        // Notify listeners of each receipt
        for (const receipt of receipts) {
          this.notifyListeners(receipt);
        }
        return true;
      }

      // On failure, re-queue receipts
      this.pendingReceipts.push(...receipts);
      return false;
    } catch (error) {
      this.log("Error flushing receipts:", error);
      // Re-queue on error
      this.pendingReceipts.push(...receipts);
      return false;
    }
  }

  // ==========================================================================
  // STATUS QUERIES
  // ==========================================================================

  /**
   * Get delivery status for multiple messages
   */
  async getDeliveryStatus(
    messageIds: string[]
  ): Promise<Map<string, MessageDeliveryInfo>> {
    const result = new Map<string, MessageDeliveryInfo>();

    if (messageIds.length === 0) return result;

    try {
      const response = await fetch("/api/messages/delivery-status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) return result;

      const data = await response.json();

      if (data.statuses && Array.isArray(data.statuses)) {
        for (const status of data.statuses) {
          result.set(status.messageId, {
            messageId: status.messageId,
            status: status.status,
            deliveredCount: status.deliveredCount || 0,
            readCount: status.readCount || 0,
            deliveredBy: status.deliveredBy || [],
            readBy: status.readBy || [],
          });
        }
      }

      return result;
    } catch (error) {
      this.log("Error fetching delivery status:", error);
      return result;
    }
  }

  // ==========================================================================
  // REALTIME BROADCASTS
  // ==========================================================================

  /**
   * Broadcast a delivery receipt via realtime
   * Other devices/users will receive this and update their UI
   */
  async broadcastReceipt(
    conversationId: string,
    receipt: DeliveryReceipt
  ): Promise<void> {
    try {
      // Uses Supabase Broadcast channel (already set up in realtime system)
      const response = await fetch("/api/realtime/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: `conversation:${conversationId}`,
          event: "delivery_receipt",
          payload: receipt,
        }),
      });

      if (!response.ok) {
        this.log("Failed to broadcast receipt");
      }
    } catch (error) {
      this.log("Error broadcasting receipt:", error);
    }
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  /**
   * Add a listener for delivery receipt events
   */
  onReceipt(callback: (receipt: DeliveryReceipt) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Handle incoming delivery receipt from realtime
   */
  handleIncomingReceipt(receipt: DeliveryReceipt): void {
    this.notifyListeners(receipt);
  }

  private notifyListeners(receipt: DeliveryReceipt): void {
    for (const listener of this.listeners) {
      try {
        listener(receipt);
      } catch (error) {
        this.log("Error in receipt listener:", error);
      }
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get display status for a message based on delivery info
   */
  static getDisplayStatus(
    message: { senderId: string; deliveryStatus?: DeliveryStatus },
    currentUserId: string,
    deliveryInfo?: MessageDeliveryInfo
  ): DeliveryStatus {
    // Only show status for own messages
    if (message.senderId !== currentUserId) {
      return "sent"; // Received messages are always "sent" from our perspective
    }

    // Use delivery info if available
    if (deliveryInfo) {
      if (deliveryInfo.readCount > 0) return "read";
      if (deliveryInfo.deliveredCount > 0) return "delivered";
    }

    // Fall back to message's delivery status
    return message.deliveryStatus || "sent";
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log("[DeliveryTracker]", ...args);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.listeners.clear();
    this.pendingReceipts = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let deliveryTrackerInstance: DeliveryTracker | null = null;

export function initializeDeliveryTracker(
  config: DeliveryTrackerConfig
): DeliveryTracker {
  if (deliveryTrackerInstance) {
    deliveryTrackerInstance.destroy();
  }
  deliveryTrackerInstance = new DeliveryTracker(config);
  return deliveryTrackerInstance;
}

export function getDeliveryTracker(): DeliveryTracker | null {
  return deliveryTrackerInstance;
}

export function resetDeliveryTracker(): void {
  if (deliveryTrackerInstance) {
    deliveryTrackerInstance.destroy();
    deliveryTrackerInstance = null;
  }
}
