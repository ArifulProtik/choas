/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "./user";

// Message types
export type MessageType = "text" | "call_start" | "call_end" | "system";

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface Message {
  id: string;
  conversation_id: string;
  sender: User;
  content: string;
  message_type: MessageType;
  status: MessageStatus;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Conversation types
export interface Conversation {
  id: string;
  participant1: User;
  participant2: User;
  last_message?: Message;
  last_message_at: string;
  unread_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// User presence types
export type UserStatus = "online" | "offline" | "in_call" | "away";

export interface UserPresence {
  user_id: string;
  status: UserStatus;
  last_seen_at: string;
  updated_at: string;
}

// Call types
export type CallStatus =
  | "pending"
  | "ringing"
  | "accepted"
  | "declined"
  | "ended"
  | "failed";

export type CallType = "voice" | "video"; // Future-proofing for video calls

export interface Call {
  id: string;
  caller: User;
  callee: User;
  type: CallType;
  status: CallStatus;
  started_at?: string;
  ended_at?: string;
  duration?: number; // in seconds
  created_at: string;
  updated_at: string;
}

// WebSocket message types
export type WSMessageType =
  | "message"
  | "typing_start"
  | "typing_stop"
  | "presence_update"
  | "call_request"
  | "call_response"
  | "call_end"
  | "message_read"
  | "user_blocked"
  | "conversation_deleted"
  | "friend_request"
  | "friend_request_accepted"
  | "friend_request_declined"
  | "friend_removed"
  | "ping"
  | "pong";

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: string;
}

// Specific WebSocket payloads
export interface WSMessagePayload {
  message: Message;
}

export interface WSTypingPayload {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
}

export interface WSPresencePayload {
  user_id: string;
  status: UserStatus;
  last_seen_at: string;
}

export interface WSCallRequestPayload {
  call: Call;
}

export interface WSCallResponsePayload {
  call_id: string;
  response: "accepted" | "declined";
  caller_id: string;
  callee_id: string;
}

export interface WSMessageReadPayload {
  conversation_id: string;
  user_id: string;
  read_at: string;
}

export interface WSFriendRequestPayload {
  friend_request: FriendRequest;
}

export interface WSFriendResponsePayload {
  friend_request_id: string;
  response: "accepted" | "declined";
  requester_id: string;
  recipient_id: string;
}

export interface WSFriendRemovedPayload {
  friendship_id: string;
  removed_by_id: string;
  removed_user_id: string;
}

// Friend system types
export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendRequest {
  id: string;
  requester: User;
  recipient: User;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  responded_at?: string;
}

export interface Friendship {
  id: string;
  user1: User;
  user2: User;
  status: "accepted";
  created_at: string;
  updated_at: string;
}

// Blocked user types
export interface BlockedUser {
  id: string;
  blocked_user: User;
  blocked_at: string;
}

// Search and pagination types
export interface UserSearchResult {
  users: User[];
  total: number;
  has_more: boolean;
}

export interface MessagePagination {
  messages: Message[];
  cursor?: string;
  has_more: boolean;
}

export interface ConversationPagination {
  conversations: Conversation[];
  cursor?: string;
  has_more: boolean;
}

// API request/response types
export interface CreateConversationRequest {
  participant_id: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: MessageType;
}

export interface InitiateCallRequest {
  callee_id: string;
  type: CallType;
}

export interface CallResponse {
  call_id: string;
  response: "accepted" | "declined";
}

// Friend system API request types
export interface SendFriendRequestRequest {
  recipient_id: string;
  message?: string;
}

export interface RespondToFriendRequestRequest {
  friend_request_id: string;
  response: "accepted" | "declined";
}

export interface RemoveFriendRequest {
  friend_id: string;
}

// Error types
export interface MessagingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Notification types
export interface NotificationPreferences {
  message_notifications: boolean;
  call_notifications: boolean;
  sound_enabled: boolean;
  desktop_notifications: boolean;
}

export interface InAppNotification {
  id: string;
  type: "message" | "call" | "system";
  title: string;
  message: string;
  user?: User;
  conversation_id?: string;
  call_id?: string;
  created_at: string;
  read: boolean;
}
