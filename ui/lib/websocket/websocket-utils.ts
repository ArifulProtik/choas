/**
 * WebSocket utility functions
 */

import { WSMessage, WSMessageType } from "@/lib/schemas/messaging";

/**
 * Validate WebSocket message structure
 */
export const isValidWSMessage = (data: any): data is WSMessage => {
  return (
    data &&
    typeof data === "object" &&
    typeof data.type === "string" &&
    data.payload !== undefined &&
    typeof data.timestamp === "string"
  );
};

/**
 * Create a standardized WebSocket message
 */
export const createStandardWSMessage = (
  type: WSMessageType,
  payload: any
): WSMessage => ({
  type,
  payload,
  timestamp: new Date().toISOString(),
});

/**
 * Extract user ID from JWT token (basic implementation)
 * In a real app, you'd use a proper JWT library
 */
export const extractUserIdFromToken = (token: string): string | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));
    return decoded.sub || decoded.user_id || decoded.id || null;
  } catch (error) {
    console.error("Failed to extract user ID from token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp;

    if (!exp) return false; // No expiration set

    return Date.now() >= exp * 1000;
  } catch (error) {
    console.error("Failed to check token expiration:", error);
    return true; // Assume expired if we can't parse
  }
};

/**
 * Get WebSocket URL with proper protocol
 */
export const getWebSocketUrl = (
  baseUrl: string,
  path: string = "/ws"
): string => {
  const url = new URL(path, baseUrl);

  // Convert HTTP(S) to WS(S)
  if (url.protocol === "https:") {
    url.protocol = "wss:";
  } else if (url.protocol === "http:") {
    url.protocol = "ws:";
  }

  return url.toString();
};

/**
 * Debounce function for typing indicators
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for presence updates
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitter: boolean = true
): number => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

  if (jitter) {
    // Add random jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  return delay;
};

/**
 * Format connection status for display
 */
export const formatConnectionStatus = (status: string): string => {
  switch (status) {
    case "connecting":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "reconnecting":
      return "Reconnecting...";
    case "error":
      return "Connection Error";
    default:
      return "Unknown";
  }
};

/**
 * Check if browser supports WebSocket
 */
export const isWebSocketSupported = (): boolean => {
  return typeof WebSocket !== "undefined";
};

/**
 * Get recommended WebSocket configuration based on environment
 */
export const getRecommendedConfig = (isDevelopment: boolean = false) => ({
  maxReconnectAttempts: isDevelopment ? 3 : 5,
  reconnectInterval: isDevelopment ? 2000 : 1000,
  maxReconnectInterval: isDevelopment ? 10000 : 30000,
  heartbeatInterval: isDevelopment ? 60000 : 30000,
});

/**
 * Log WebSocket events for debugging
 */
export const createWebSocketLogger = (prefix: string = "WebSocket") => ({
  connect: (url: string) => console.log(`${prefix}: Connecting to ${url}`),
  connected: () => console.log(`${prefix}: Connected successfully`),
  disconnect: (code?: number, reason?: string) =>
    console.log(`${prefix}: Disconnected (${code}: ${reason})`),
  message: (type: string, payload: any) =>
    console.log(`${prefix}: Received ${type}`, payload),
  send: (type: string, payload: any) =>
    console.log(`${prefix}: Sending ${type}`, payload),
  error: (error: Error) => console.error(`${prefix}: Error`, error),
  reconnect: (attempt: number) =>
    console.log(`${prefix}: Reconnection attempt ${attempt}`),
});
