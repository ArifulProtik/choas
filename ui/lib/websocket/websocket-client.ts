/**
 * WebSocket client for real-time communication
 * Handles connection management, automatic reconnection, and message routing
 */

import { WSMessage, WSMessageType } from "@/lib/schemas/messaging";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export interface WebSocketConfig {
  url: string;
  token: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  heartbeatInterval?: number;
}

export interface WebSocketEventHandlers {
  onMessage?: (message: WSMessage) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  onReconnectAttempt?: (attempt: number) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandlers;
  private connectionStatus: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  // Default configuration
  private readonly defaultConfig = {
    maxReconnectAttempts: 5,
    reconnectInterval: 1000, // Start with 1 second
    maxReconnectInterval: 30000, // Max 30 seconds
    heartbeatInterval: 30000, // 30 seconds
  };

  constructor(config: WebSocketConfig, handlers: WebSocketEventHandlers = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.handlers = handlers;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn("WebSocket is already connected");
      return;
    }

    this.isManualDisconnect = false;
    this.setConnectionStatus("connecting");

    try {
      // Construct WebSocket URL with authentication token
      const wsUrl = new URL(this.config.url);
      wsUrl.searchParams.set("token", this.config.token);

      this.ws = new WebSocket(wsUrl.toString());
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.setConnectionStatus("error");
      this.handlers.onError?.(error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectTimeout();
    this.clearHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }

    this.setConnectionStatus("disconnected");
  }

  /**
   * Send a message through the WebSocket connection
   */
  public sendMessage(message: Omit<WSMessage, "timestamp">): boolean {
    if (!this.isConnected()) {
      console.warn("Cannot send message: WebSocket is not connected");
      return false;
    }

    try {
      const wsMessage: WSMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };

      this.ws!.send(JSON.stringify(wsMessage));
      return true;
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
      this.handlers.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Update the authentication token
   */
  public updateToken(token: string): void {
    this.config.token = token;

    // If connected, reconnect with new token
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Update event handlers
   */
  public updateHandlers(handlers: Partial<WebSocketEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.setConnectionStatus("connected");
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        this.handlers.onError?.(new Error("Invalid message format"));
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      this.clearHeartbeat();

      if (!this.isManualDisconnect) {
        this.setConnectionStatus("disconnected");
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      this.setConnectionStatus("error");
      this.handlers.onError?.(new Error("WebSocket connection error"));
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleIncomingMessage(message: WSMessage): void {
    // Handle heartbeat/ping messages
    if (message.type === "ping") {
      this.sendMessage({ type: "pong", payload: {} });
      return;
    }

    // Forward message to handlers
    this.handlers.onMessage?.(message);
  }

  /**
   * Set connection status and notify handlers
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.handlers.onConnectionChange?.(status);
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (
      this.isManualDisconnect ||
      this.reconnectAttempts >= this.config.maxReconnectAttempts!
    ) {
      console.log("Max reconnection attempts reached or manual disconnect");
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionStatus("reconnecting");
    this.handlers.onReconnectAttempt?.(this.reconnectAttempts);

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectInterval!
    );

    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeoutId = setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();

    this.heartbeatIntervalId = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: "ping", payload: {} });
      }
    }, this.config.heartbeatInterval!);
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }
}

/**
 * WebSocket message helper functions
 */
export const createWSMessage = (
  type: WSMessageType,
  payload: any
): Omit<WSMessage, "timestamp"> => ({
  type,
  payload,
});

// Specific message creators for common operations
export const createMessageWSMessage = (message: any) =>
  createWSMessage("message", { message });

export const createTypingStartMessage = (
  conversationId: string,
  userId: string
) =>
  createWSMessage("typing_start", {
    conversation_id: conversationId,
    user_id: userId,
  });

export const createTypingStopMessage = (
  conversationId: string,
  userId: string
) =>
  createWSMessage("typing_stop", {
    conversation_id: conversationId,
    user_id: userId,
  });

export const createPresenceUpdateMessage = (userId: string, status: string) =>
  createWSMessage("presence_update", { user_id: userId, status });

export const createMessageReadMessage = (
  conversationId: string,
  messageIds: string[]
) =>
  createWSMessage("message_read", {
    conversation_id: conversationId,
    message_ids: messageIds,
  });
