/**
 * WebSocket service that integrates WebSocket client with stores
 * Handles message routing and store updates
 */

import {
  WebSocketClient,
  WebSocketConfig,
  ConnectionStatus,
} from "./websocket-client";
import { WSMessage, WSMessageType } from "@/lib/schemas/messaging";
import { useMessagingStore } from "@/components/store/messaging-store";
import {
  useNotificationStore,
  Notification,
} from "@/components/store/notification-store";

export interface WebSocketServiceConfig extends Omit<WebSocketConfig, "token"> {
  // Service-specific configuration can be added here
}

export class WebSocketService {
  private client: WebSocketClient | null = null;
  private config: WebSocketServiceConfig;
  private isInitialized = false;

  constructor(config: WebSocketServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize the WebSocket service with authentication token
   */
  public initialize(token: string): void {
    if (this.isInitialized) {
      console.warn("WebSocket service is already initialized");
      return;
    }

    const clientConfig: WebSocketConfig = {
      ...this.config,
      token,
    };

    this.client = new WebSocketClient(clientConfig, {
      onMessage: this.handleMessage.bind(this),
      onConnectionChange: this.handleConnectionChange.bind(this),
      onError: this.handleError.bind(this),
      onReconnectAttempt: this.handleReconnectAttempt.bind(this),
    });

    this.isInitialized = true;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (!this.client) {
      throw new Error(
        "WebSocket service not initialized. Call initialize() first."
      );
    }
    this.client.connect();
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.client?.disconnect();
  }

  /**
   * Update authentication token
   */
  public updateToken(token: string): void {
    this.client?.updateToken(token);
  }

  /**
   * Send a message through WebSocket
   */
  public sendMessage(type: WSMessageType, payload: any): boolean {
    if (!this.client) {
      console.warn("Cannot send message: WebSocket service not initialized");
      return false;
    }
    return this.client.sendMessage({ type, payload });
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.client?.getConnectionStatus() || "disconnected";
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.client?.isConnected() || false;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WSMessage): void {
    console.log("Received WebSocket message:", message.type, message.payload);

    try {
      switch (message.type) {
        case "message":
          this.handleNewMessage(message);
          break;
        case "typing_start":
          this.handleTypingStart(message);
          break;
        case "typing_stop":
          this.handleTypingStop(message);
          break;
        case "presence_update":
          this.handlePresenceUpdate(message);
          break;
        case "message_read":
          this.handleMessageRead(message);
          break;
        case "call_request":
          this.handleCallRequest(message);
          break;
        case "call_response":
          this.handleCallResponse(message);
          break;
        case "call_end":
          this.handleCallEnd(message);
          break;
        case "friend_request":
          this.handleFriendRequest(message);
          break;
        case "friend_request_accepted":
          this.handleFriendRequestAccepted(message);
          break;
        case "friend_request_declined":
          this.handleFriendRequestDeclined(message);
          break;
        case "friend_removed":
          this.handleFriendRemoved(message);
          break;
        case "user_blocked":
          this.handleUserBlocked(message);
          break;
        case "conversation_deleted":
          this.handleConversationDeleted(message);
          break;
        default:
          console.warn("Unknown WebSocket message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Handle new message
   */
  private handleNewMessage(message: WSMessage): void {
    const { message: newMessage } = message.payload;
    if (!newMessage) return;

    // Add message to messaging store
    useMessagingStore.getState().addMessage(newMessage);

    // Create notification for the message
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (newMessage.sender.id !== currentUserId && currentUserId) {
      const notification: Notification = {
        id: `msg_${newMessage.id}`,
        user_id: currentUserId,
        type: "message",
        title: `New message from ${newMessage.sender.name}`,
        content: newMessage.content,
        related_id: newMessage.conversation_id,
        is_read: false,
        created_at: newMessage.created_at,
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(message: WSMessage): void {
    const { conversation_id, user_id } = message.payload;
    if (!conversation_id || !user_id) return;

    useMessagingStore.getState().addTypingUser(conversation_id, user_id);
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(message: WSMessage): void {
    const { conversation_id, user_id } = message.payload;
    if (!conversation_id || !user_id) return;

    useMessagingStore.getState().removeTypingUser(conversation_id, user_id);
  }

  /**
   * Handle presence update
   */
  private handlePresenceUpdate(message: WSMessage): void {
    const { user_id, status, last_seen_at } = message.payload;
    if (!user_id || !status) return;

    useMessagingStore.getState().setUserPresence(user_id, {
      user_id,
      status,
      last_seen_at: last_seen_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Handle message read
   */
  private handleMessageRead(message: WSMessage): void {
    const { conversation_id, user_id, read_at } = message.payload;
    if (!conversation_id || !user_id) return;

    // Update message read status in the store
    const messages = useMessagingStore
      .getState()
      .getConversationMessages(conversation_id);
    const messagesToUpdate = messages
      .filter(
        (msg) =>
          msg.sender.id === useMessagingStore.getState().currentUserId &&
          !msg.read_at
      )
      .map((msg) => msg.id);

    messagesToUpdate.forEach((messageId) => {
      useMessagingStore.getState().updateMessage(messageId, {
        status: "read",
        read_at,
      });
    });
  }

  /**
   * Handle call request
   */
  private handleCallRequest(message: WSMessage): void {
    const { call } = message.payload;
    if (!call) return;

    // Create notification for incoming call
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (call.callee.id === currentUserId && currentUserId) {
      const notification: Notification = {
        id: `call_${call.id}`,
        user_id: currentUserId,
        type: "call",
        title: `Incoming call from ${call.caller.name}`,
        content: "Voice call",
        related_id: call.id,
        is_read: false,
        created_at: call.created_at,
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle call response
   */
  private handleCallResponse(message: WSMessage): void {
    const { call_id, response, caller_id } = message.payload;
    if (!call_id || !response) return;

    // Create notification for call response
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (caller_id === currentUserId && currentUserId) {
      const notification: Notification = {
        id: `call_response_${call_id}`,
        user_id: currentUserId,
        type: "call",
        title: `Call ${response}`,
        content:
          response === "accepted" ? "Call was accepted" : "Call was declined",
        related_id: call_id,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle call end
   */
  private handleCallEnd(message: WSMessage): void {
    const { call_id, duration } = message.payload;
    if (!call_id) return;

    // Create notification for call end
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (currentUserId) {
      const notification: Notification = {
        id: `call_end_${call_id}`,
        user_id: currentUserId,
        type: "call",
        title: "Call ended",
        content: duration
          ? `Call duration: ${Math.floor(duration / 60)}:${(duration % 60)
              .toString()
              .padStart(2, "0")}`
          : "Call ended",
        related_id: call_id,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle friend request
   */
  private handleFriendRequest(message: WSMessage): void {
    const { friend_request } = message.payload;
    if (!friend_request) return;

    // Add friend request to store
    useMessagingStore.getState().addFriendRequest(friend_request);

    // Create notification for friend request
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (friend_request.recipient.id === currentUserId && currentUserId) {
      const notification: Notification = {
        id: `friend_req_${friend_request.id}`,
        user_id: currentUserId,
        type: "friend_request",
        title: `Friend request from ${friend_request.requester.name}`,
        content: `${friend_request.requester.name} wants to be your friend`,
        related_id: friend_request.id,
        is_read: false,
        created_at: friend_request.created_at,
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle friend request accepted
   */
  private handleFriendRequestAccepted(message: WSMessage): void {
    const { friend_request_id, friendship, requester_id } = message.payload;
    if (!friend_request_id) return;

    // Update friend request status
    useMessagingStore.getState().updateFriendRequest(friend_request_id, {
      status: "accepted",
      responded_at: new Date().toISOString(),
    });

    // Add friendship if provided
    if (friendship) {
      useMessagingStore.getState().addFriendship(friendship);
    }

    // Create notification
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (requester_id === currentUserId && currentUserId) {
      const notification: Notification = {
        id: `friend_accepted_${friend_request_id}`,
        user_id: currentUserId,
        type: "friend_request",
        title: "Friend request accepted",
        content: "Your friend request was accepted",
        related_id: friend_request_id,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle friend request declined
   */
  private handleFriendRequestDeclined(message: WSMessage): void {
    const { friend_request_id, requester_id } = message.payload;
    if (!friend_request_id) return;

    // Update friend request status
    useMessagingStore.getState().updateFriendRequest(friend_request_id, {
      status: "declined",
      responded_at: new Date().toISOString(),
    });

    // Create notification for requester
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (requester_id === currentUserId && currentUserId) {
      const notification: Notification = {
        id: `friend_declined_${friend_request_id}`,
        user_id: currentUserId,
        type: "friend_request",
        title: "Friend request declined",
        content: "Your friend request was declined",
        related_id: friend_request_id,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle friend removed
   */
  private handleFriendRemoved(message: WSMessage): void {
    const { friendship_id, removed_user_id } = message.payload;
    if (!friendship_id) return;

    // Remove friendship from store
    useMessagingStore.getState().removeFriendship(friendship_id);

    // Create notification if current user was removed
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (removed_user_id === currentUserId && currentUserId) {
      const notification: Notification = {
        id: `friend_removed_${friendship_id}`,
        user_id: currentUserId,
        type: "system",
        title: "Friend removed",
        content: "You were removed from someone's friend list",
        related_id: friendship_id,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle user blocked
   */
  private handleUserBlocked(message: WSMessage): void {
    const { blocked_user_id, blocker_id } = message.payload;
    if (!blocked_user_id || !blocker_id) return;

    const currentUserId = useMessagingStore.getState().currentUserId;

    // If current user was blocked, remove conversations with the blocker
    if (blocked_user_id === currentUserId) {
      const conversations = useMessagingStore.getState().conversations;
      const conversationsToRemove = conversations.filter(
        (conv) =>
          conv.participant1.id === blocker_id ||
          conv.participant2.id === blocker_id
      );

      conversationsToRemove.forEach((conv) => {
        useMessagingStore.getState().removeConversation(conv.id);
      });
    }
  }

  /**
   * Handle conversation deleted
   */
  private handleConversationDeleted(message: WSMessage): void {
    const { conversation_id, deleted_by_id } = message.payload;
    if (!conversation_id) return;

    const currentUserId = useMessagingStore.getState().currentUserId;

    // Only remove if deleted by the other participant
    if (deleted_by_id !== currentUserId) {
      useMessagingStore.getState().removeConversation(conversation_id);
    }
  }

  /**
   * Handle connection status changes
   */
  private handleConnectionChange(status: ConnectionStatus): void {
    console.log("WebSocket connection status changed:", status);

    // You could update a connection status in a store here if needed
    // For now, just log the status change
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Error): void {
    console.error("WebSocket error:", error);

    // Create system notification for connection errors
    const currentUserId = useMessagingStore.getState().currentUserId;
    if (currentUserId) {
      const notification: Notification = {
        id: `ws_error_${Date.now()}`,
        user_id: currentUserId,
        type: "system",
        title: "Connection Error",
        content:
          "There was a problem with the real-time connection. Trying to reconnect...",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      useNotificationStore.getState().addNotification(notification);
    }
  }

  /**
   * Handle reconnection attempts
   */
  private handleReconnectAttempt(attempt: number): void {
    console.log(`WebSocket reconnection attempt ${attempt}`);

    // Create system notification for reconnection attempts
    if (attempt === 1) {
      const currentUserId = useMessagingStore.getState().currentUserId;
      if (currentUserId) {
        const notification: Notification = {
          id: `ws_reconnect_${Date.now()}`,
          user_id: currentUserId,
          type: "system",
          title: "Reconnecting",
          content: "Attempting to restore real-time connection...",
          is_read: false,
          created_at: new Date().toISOString(),
        };

        useNotificationStore.getState().addNotification(notification);
      }
    }
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

/**
 * Get or create WebSocket service instance
 */
export const getWebSocketService = (
  config?: WebSocketServiceConfig
): WebSocketService => {
  if (!webSocketService && config) {
    webSocketService = new WebSocketService(config);
  }

  if (!webSocketService) {
    throw new Error(
      "WebSocket service not initialized. Provide config on first call."
    );
  }

  return webSocketService;
};

/**
 * Initialize WebSocket service with default configuration
 */
export const initializeWebSocketService = (
  token: string,
  baseUrl: string = "ws://localhost:8080"
): WebSocketService => {
  const config: WebSocketServiceConfig = {
    url: `${baseUrl}/ws`,
    maxReconnectAttempts: 5,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    heartbeatInterval: 30000,
  };

  const service = getWebSocketService(config);
  service.initialize(token);
  return service;
};
