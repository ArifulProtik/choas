import { Api, handleApiCall } from "./api";
import { Message } from "../schemas/messaging";
import { User } from "../schemas/user";

// Backend response types based on actual implementation
export interface ConversationWithDetails {
  id: string;
  type: "direct" | "group";
  name?: string;
  last_message_at?: string;
  is_archived: boolean;
  is_muted: boolean;
  created_at: string;
  updated_at: string;
  participants: User[];
  last_message?: Message;
  unread_count: number;
}

export interface MessageSearchResult {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file" | "call_start" | "call_end";
  is_deleted: boolean;
  edited_at?: string;
  call_id?: string;
  created_at: string;
  updated_at: string;
  sender: User;
  conversation_name: string;
  highlight: string;
}

export interface GetConversationsParams {
  limit?: number;
  offset?: number;
}

export interface GetMessagesParams {
  limit?: number;
  offset?: number;
}

export interface SendMessageRequest {
  content: string;
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
}

export class MessagingApiService {
  /**
   * Get user's conversations with pagination (offset-based)
   */
  static async getConversations(
    params: GetConversationsParams = {}
  ): Promise<ConversationWithDetails[]> {
    return handleApiCall(() => Api.get("/conversations", { params }));
  }

  /**
   * Get conversation details by ID
   */
  static async getConversationDetails(
    conversationId: string
  ): Promise<ConversationWithDetails> {
    return handleApiCall(() => Api.get(`/conversations/${conversationId}`));
  }

  /**
   * Get messages for a specific conversation with pagination (offset-based)
   */
  static async getConversationMessages(
    conversationId: string,
    params: GetMessagesParams = {}
  ): Promise<Message[]> {
    return handleApiCall(() =>
      Api.get(`/conversations/${conversationId}/messages`, { params })
    );
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(
    conversationId: string,
    payload: SendMessageRequest
  ): Promise<Message> {
    return handleApiCall(() =>
      Api.post(`/conversations/${conversationId}/messages`, payload)
    );
  }

  /**
   * Mark messages as read in a conversation
   */
  static async markMessagesAsRead(
    conversationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() =>
      Api.put(`/conversations/${conversationId}/read`)
    );
  }

  /**
   * Delete a message (soft delete)
   */
  static async deleteMessage(messageId: string): Promise<{ message: string }> {
    return handleApiCall(() => Api.delete(`/messages/${messageId}`));
  }

  /**
   * Search messages across conversations
   */
  static async searchMessages(
    params: SearchParams
  ): Promise<MessageSearchResult[]> {
    return handleApiCall(() => Api.get("/messages/search", { params }));
  }

  /**
   * Search conversations by participant name
   */
  static async searchConversations(
    params: SearchParams
  ): Promise<ConversationWithDetails[]> {
    return handleApiCall(() => Api.get("/conversations/search", { params }));
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() =>
      Api.put(`/conversations/${conversationId}/archive`)
    );
  }

  /**
   * Unarchive a conversation
   */
  static async unarchiveConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() =>
      Api.put(`/conversations/${conversationId}/unarchive`)
    );
  }

  /**
   * Mute a conversation
   */
  static async muteConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() =>
      Api.put(`/conversations/${conversationId}/mute`)
    );
  }

  /**
   * Unmute a conversation
   */
  static async unmuteConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() =>
      Api.put(`/conversations/${conversationId}/unmute`)
    );
  }
}
