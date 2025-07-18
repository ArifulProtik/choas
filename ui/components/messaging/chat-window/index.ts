/**
 * Chat Window Components
 * Centralized exports for all chat window sub-components
 */

// Component exports
export { ChatHeader } from "./chat-header";
export { ChatInput } from "./chat-input";
export { MessageItem } from "./message-item";
export { MessageList } from "./message-list";
export { MessageSearch } from "./message-search";
export { TypingIndicator } from "./typing-indicator";

// Type exports
export type {
  ChatHeaderProps,
  ChatInputProps,
  MessageItemProps,
  MessageListProps,
  TypingIndicatorProps,
  ChatWindowProps,
} from "./types";
