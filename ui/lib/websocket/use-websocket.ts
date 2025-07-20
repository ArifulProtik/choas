/**
 * React hook for WebSocket integration
 * Manages WebSocket connection lifecycle and integrates with stores
 */

import { useEffect, useRef, useCallback } from "react";
import {
  WebSocketService,
  initializeWebSocketService,
} from "./websocket-service";
import { useMessagingStore } from "@/components/store/messaging-store";
import { WSMessageType } from "@/lib/schemas/messaging";

export interface UseWebSocketOptions {
  token: string;
  baseUrl?: string;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: string;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: WSMessageType, payload: any) => boolean;
  updateToken: (token: string) => void;
}

/**
 * Hook for managing WebSocket connection and integration with stores
 */
export const useWebSocket = (
  options: UseWebSocketOptions
): UseWebSocketReturn => {
  const {
    token,
    baseUrl = "ws://localhost:8080",
    autoConnect = true,
  } = options;

  const serviceRef = useRef<WebSocketService | null>(null);
  const currentUserId = useMessagingStore((state) => state.currentUserId);

  // Initialize WebSocket service
  useEffect(() => {
    if (!token || !currentUserId) return;

    try {
      serviceRef.current = initializeWebSocketService(token, baseUrl);

      // Update service configuration if needed
      if (serviceRef.current) {
        // The service is already configured through initializeWebSocketService
        console.log("WebSocket service initialized");
      }
    } catch (error) {
      console.error("Failed to initialize WebSocket service:", error);
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [token, currentUserId, baseUrl]);

  // Auto-connect when service is ready
  useEffect(() => {
    if (serviceRef.current && autoConnect && token && currentUserId) {
      serviceRef.current.connect();
    }
  }, [autoConnect, token, currentUserId]);

  // Connect function
  const connect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.connect();
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  }, []);

  // Send message function
  const sendMessage = useCallback(
    (type: WSMessageType, payload: any): boolean => {
      if (serviceRef.current) {
        return serviceRef.current.sendMessage(type, payload);
      }
      return false;
    },
    []
  );

  // Update token function
  const updateToken = useCallback((newToken: string) => {
    if (serviceRef.current) {
      serviceRef.current.updateToken(newToken);
    }
  }, []);

  // Get connection status
  const connectionStatus =
    serviceRef.current?.getConnectionStatus() || "disconnected";
  const isConnected = serviceRef.current?.isConnected() || false;

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    updateToken,
  };
};

/**
 * Hook for sending specific WebSocket messages
 */
export const useWebSocketActions = () => {
  const { sendMessage } = useWebSocket({ token: "", autoConnect: false });
  const currentUserId = useMessagingStore((state) => state.currentUserId);

  const sendTypingStart = useCallback(
    (conversationId: string) => {
      if (!currentUserId) return false;
      return sendMessage("typing_start", {
        conversation_id: conversationId,
        user_id: currentUserId,
      });
    },
    [sendMessage, currentUserId]
  );

  const sendTypingStop = useCallback(
    (conversationId: string) => {
      if (!currentUserId) return false;
      return sendMessage("typing_stop", {
        conversation_id: conversationId,
        user_id: currentUserId,
      });
    },
    [sendMessage, currentUserId]
  );

  const sendPresenceUpdate = useCallback(
    (status: string) => {
      if (!currentUserId) return false;
      return sendMessage("presence_update", {
        user_id: currentUserId,
        status,
        last_seen_at: new Date().toISOString(),
      });
    },
    [sendMessage, currentUserId]
  );

  const sendMessageRead = useCallback(
    (conversationId: string, messageIds: string[]) => {
      if (!currentUserId) return false;
      return sendMessage("message_read", {
        conversation_id: conversationId,
        message_ids: messageIds,
        user_id: currentUserId,
        read_at: new Date().toISOString(),
      });
    },
    [sendMessage, currentUserId]
  );

  const sendFriendRequest = useCallback(
    (recipientId: string) => {
      if (!currentUserId) return false;
      return sendMessage("friend_request", {
        recipient_id: recipientId,
        requester_id: currentUserId,
      });
    },
    [sendMessage, currentUserId]
  );

  const respondToFriendRequest = useCallback(
    (friendRequestId: string, response: "accepted" | "declined") => {
      if (!currentUserId) return false;
      return sendMessage(
        response === "accepted"
          ? "friend_request_accepted"
          : "friend_request_declined",
        {
          friend_request_id: friendRequestId,
          response,
          recipient_id: currentUserId,
        }
      );
    },
    [sendMessage, currentUserId]
  );

  const sendCallRequest = useCallback(
    (calleeId: string, callId: string) => {
      if (!currentUserId) return false;
      return sendMessage("call_request", {
        call_id: callId,
        caller_id: currentUserId,
        callee_id: calleeId,
      });
    },
    [sendMessage, currentUserId]
  );

  const respondToCall = useCallback(
    (callId: string, response: "accepted" | "declined") => {
      if (!currentUserId) return false;
      return sendMessage("call_response", {
        call_id: callId,
        response,
        callee_id: currentUserId,
      });
    },
    [sendMessage, currentUserId]
  );

  const endCall = useCallback(
    (callId: string) => {
      if (!currentUserId) return false;
      return sendMessage("call_end", {
        call_id: callId,
        ended_by_id: currentUserId,
      });
    },
    [sendMessage, currentUserId]
  );

  return {
    sendTypingStart,
    sendTypingStop,
    sendPresenceUpdate,
    sendMessageRead,
    sendFriendRequest,
    respondToFriendRequest,
    sendCallRequest,
    respondToCall,
    endCall,
  };
};

/**
 * Hook for WebSocket connection status
 */
export const useWebSocketStatus = () => {
  const { isConnected, connectionStatus } = useWebSocket({
    token: "",
    autoConnect: false,
  });

  return {
    isConnected,
    connectionStatus,
    isConnecting: connectionStatus === "connecting",
    isReconnecting: connectionStatus === "reconnecting",
    hasError: connectionStatus === "error",
  };
};
