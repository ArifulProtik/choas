/**
 * WebSocket module exports
 */

export { WebSocketClient } from "./websocket-client";
export type {
  WebSocketConfig,
  WebSocketEventHandlers,
  ConnectionStatus,
} from "./websocket-client";
export {
  createWSMessage,
  createMessageWSMessage,
  createTypingStartMessage,
  createTypingStopMessage,
  createPresenceUpdateMessage,
  createMessageReadMessage,
} from "./websocket-client";

export {
  WebSocketService,
  getWebSocketService,
  initializeWebSocketService,
} from "./websocket-service";
export type { WebSocketServiceConfig } from "./websocket-service";

export {
  useWebSocket,
  useWebSocketActions,
  useWebSocketStatus,
} from "./use-websocket";
export type { UseWebSocketOptions, UseWebSocketReturn } from "./use-websocket";
