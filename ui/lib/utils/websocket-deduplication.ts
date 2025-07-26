/**
 * WebSocket Message Deduplication Utilities
 * Prevents duplicate message processing using message IDs and timestamps
 */

interface ProcessedMessage {
  id: string;
  type: string;
  timestamp: number;
}

class MessageDeduplicator {
  private processedMessages: Map<string, ProcessedMessage> = new Map();
  private readonly maxCacheSize = 1000;
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a message has already been processed
   */
  public isDuplicate(
    messageId: string,
    messageType: string,
    timestamp: string
  ): boolean {
    const key = `${messageType}:${messageId}`;
    const messageTime = new Date(timestamp).getTime();

    // Clean old messages periodically
    this.cleanOldMessages();

    // Check if we've seen this exact message
    const existing = this.processedMessages.get(key);
    if (existing) {
      // Consider it a duplicate if within 1 second of the original
      return Math.abs(existing.timestamp - messageTime) < 1000;
    }

    // Mark as processed
    this.processedMessages.set(key, {
      id: messageId,
      type: messageType,
      timestamp: messageTime,
    });

    return false;
  }

  /**
   * Check for content-based duplicates (for messages without unique IDs)
   */
  public isContentDuplicate(
    content: string,
    senderId: string,
    conversationId: string,
    timestamp: string
  ): boolean {
    const contentKey = `content:${conversationId}:${senderId}:${content}`;
    const messageTime = new Date(timestamp).getTime();

    const existing = this.processedMessages.get(contentKey);
    if (existing) {
      // Consider it a duplicate if within 5 seconds and same content
      return Math.abs(existing.timestamp - messageTime) < 5000;
    }

    // Mark as processed
    this.processedMessages.set(contentKey, {
      id: contentKey,
      type: "content",
      timestamp: messageTime,
    });

    return false;
  }

  /**
   * Clean old processed messages to prevent memory leaks
   */
  private cleanOldMessages(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, message] of this.processedMessages.entries()) {
      if (now - message.timestamp > this.maxAge) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.processedMessages.delete(key));

    // If still too many messages, remove oldest ones
    if (this.processedMessages.size > this.maxCacheSize) {
      const sortedEntries = Array.from(this.processedMessages.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      const toRemove = sortedEntries.slice(
        0,
        this.processedMessages.size - this.maxCacheSize
      );
      toRemove.forEach(([key]) => this.processedMessages.delete(key));
    }
  }

  /**
   * Clear all processed messages (useful for testing or reset)
   */
  public clear(): void {
    this.processedMessages.clear();
  }

  /**
   * Get statistics about processed messages
   */
  public getStats(): {
    totalProcessed: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
    const messages = Array.from(this.processedMessages.values());

    if (messages.length === 0) {
      return { totalProcessed: 0, oldestTimestamp: 0, newestTimestamp: 0 };
    }

    const timestamps = messages.map((m) => m.timestamp);

    return {
      totalProcessed: messages.length,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    };
  }
}

// Singleton instance for global deduplication
const messageDeduplicator = new MessageDeduplicator();

export { messageDeduplicator, MessageDeduplicator };

/**
 * Helper function to generate a unique key for WebSocket messages
 */
export const generateMessageKey = (
  type: string,
  data: any,
  timestamp: string
): string => {
  switch (type) {
    case "message":
      return `msg:${
        data.message_id ||
        `${data.conversation_id}:${data.sender_id}:${timestamp}`
      }`;

    case "friend_request":
      return `friend_req:${data.requester_id}:${timestamp}`;

    case "call_request":
      return `call_req:${data.call_id}`;

    case "call_response":
      return `call_resp:${data.call_id}:${data.response}`;

    case "call_end":
      return `call_end:${data.call_id}`;

    case "notification":
      return `notif:${data.notification_id || `${type}:${timestamp}`}`;

    case "user_online":
    case "user_offline":
      return `presence:${data.user_id}:${type}:${timestamp}`;

    case "typing":
    case "stop_typing":
      return `typing:${data.conversation_id}:${data.user_id}:${type}`;

    case "message_read":
      return `read:${data.conversation_id}:${data.user_id}:${data.last_read_at}`;

    default:
      return `${type}:${timestamp}:${JSON.stringify(data)}`;
  }
};

/**
 * Check if a WebSocket message is a duplicate
 */
export const isWebSocketMessageDuplicate = (
  type: string,
  data: any,
  timestamp: string
): boolean => {
  const messageKey = generateMessageKey(type, data, timestamp);
  return messageDeduplicator.isDuplicate(messageKey, type, timestamp);
};
