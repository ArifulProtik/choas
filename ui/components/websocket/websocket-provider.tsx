/**
 * WebSocket Provider Component
 * Manages WebSocket connection at the application level
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWebSocket, useWebSocketStatus } from "@/lib/websocket";
import { useMessagingStore } from "@/components/store/messaging-store";

interface WebSocketContextValue {
  isConnected: boolean;
  connectionStatus: string;
  connect: () => void;
  disconnect: () => void;
  isConnecting: boolean;
  isReconnecting: boolean;
  hasError: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string;
  baseUrl?: string;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  token,
  baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080",
  autoConnect = true,
}) => {
  const currentUserId = useMessagingStore((state) => state.currentUserId);
  const [isInitialized, setIsInitialized] = useState(false);

  // Only initialize WebSocket if we have both token and currentUserId
  const shouldInitialize = Boolean(token && currentUserId);

  const webSocket = useWebSocket({
    token: token || "",
    baseUrl,
    autoConnect: autoConnect && shouldInitialize,
  });

  const status = useWebSocketStatus();

  useEffect(() => {
    if (shouldInitialize && !isInitialized) {
      setIsInitialized(true);
    } else if (!shouldInitialize && isInitialized) {
      setIsInitialized(false);
      webSocket.disconnect();
    }
  }, [shouldInitialize, isInitialized, webSocket]);

  // Update token when it changes
  useEffect(() => {
    if (token && isInitialized) {
      webSocket.updateToken(token);
    }
  }, [token, isInitialized, webSocket]);

  const contextValue: WebSocketContextValue = {
    isConnected: webSocket.isConnected,
    connectionStatus: webSocket.connectionStatus,
    connect: webSocket.connect,
    disconnect: webSocket.disconnect,
    isConnecting: status.isConnecting,
    isReconnecting: status.isReconnecting,
    hasError: status.hasError,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to access WebSocket context
 */
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};

/**
 * Connection Status Indicator Component
 */
export const WebSocketStatusIndicator: React.FC<{
  className?: string;
  showText?: boolean;
}> = ({ className = "", showText = false }) => {
  const { isConnected, isConnecting, isReconnecting, hasError } =
    useWebSocketContext();

  const getStatusColor = () => {
    if (hasError) return "bg-red-500";
    if (isConnecting || isReconnecting) return "bg-yellow-500";
    if (isConnected) return "bg-green-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (hasError) return "Connection Error";
    if (isReconnecting) return "Reconnecting...";
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Connected";
    return "Disconnected";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      {showText && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};
