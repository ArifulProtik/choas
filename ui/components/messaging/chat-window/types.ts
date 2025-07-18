/**
 * TypeScript interfaces for chat window components
 * Consolidated interfaces for all chat window sub-components
 */

import { User } from "@/lib/schemas/user";
import { Message, UserPresence } from "@/lib/schemas/messaging";

// Chat Header Component Interface
export interface ChatHeaderProps {
  otherUser: User;
  userPresence: UserPresence | null;
  isOnline: boolean;
  canCall: { canCall: boolean; reason?: string };
  onCallClick: () => void;
  onSearchClick: () => void;
  onInfoClick: () => void;
  showUserProfile?: boolean;
}

// Chat Input Component Interface
export interface ChatInputProps {
  conversationId: string;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}

// Message Item Component Interface
export interface MessageItemProps {
  message: Message;
  isFromCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onRetry?: (messageId: string) => void;
  searchQuery?: string;
  isHighlighted?: boolean;
}

// Message List Component Interface
export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  error: string | null;
  typingUsers: string[];
  otherUserName: string;
  onRetryMessage: (messageId: string) => void;
  onLoadMoreMessages?: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  searchQuery?: string;
  searchResults?: Message[];
  currentSearchIndex?: number;
}

// Typing Indicator Component Interface
export interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
}

// Main Chat Window Component Interface (for future use)
export interface ChatWindowProps {
  // No props - uses store directly
  // This interface is kept for consistency and future extensibility
}
