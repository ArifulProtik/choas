import { Api, handleApiCall, handlePaginatedApiCall } from "./api";
import { User } from "../schemas/user";
import { Message, Conversation } from "../schemas/messaging";
import { SearchUsersParams, PaginatedResponse } from "../schemas/api-types";

export class SearchApiService {
  /**
   * Search for users by name, username, or email (matching backend implementation)
   */
  static async searchUsers(query: string): Promise<User[]> {
    return handleApiCall(() =>
      Api.get("/users/search", {
        params: { q: query },
      })
    );
  }

  /**
   * Search for conversations by participant name (matching backend implementation with offset pagination)
   */
  static async searchConversations(
    query: string,
    params: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Conversation[]> {
    return handleApiCall(() =>
      Api.get("/conversations/search", {
        params: { q: query, ...params },
      })
    );
  }

  /**
   * Search for messages across all conversations (matching backend implementation with offset pagination)
   */
  static async searchMessages(
    query: string,
    params: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Message[]> {
    return handleApiCall(() =>
      Api.get("/messages/search", {
        params: { q: query, ...params },
      })
    );
  }

  /**
   * Search for friends by name or username (matching backend implementation)
   */
  static async searchFriends(query: string): Promise<User[]> {
    return handleApiCall(() =>
      Api.get("/friends/search", {
        params: { q: query },
      })
    );
  }

  /**
   * Get search suggestions based on user's search history and contacts
   */
  static async getSearchSuggestions(
    type: "users" | "conversations" | "messages",
    params: {
      limit?: number;
      context?: string; // Current conversation ID for context-aware suggestions
    } = {}
  ): Promise<{
    recent_searches: string[];
    suggested_users?: User[];
    suggested_conversations?: Conversation[];
    trending_topics?: string[];
  }> {
    return handleApiCall(() =>
      Api.get("/search/suggestions", {
        params: { type, ...params },
      })
    );
  }

  /**
   * Get popular search queries (trending searches)
   */
  static async getTrendingSearches(
    type: "users" | "conversations" | "messages",
    params: {
      limit?: number;
      time_period?: "1h" | "24h" | "7d" | "30d";
    } = {}
  ): Promise<{
    trending_queries: Array<{
      query: string;
      search_count: number;
      trend_direction: "up" | "down" | "stable";
    }>;
  }> {
    return handleApiCall(() =>
      Api.get("/search/trending", {
        params: { type, ...params },
      })
    );
  }

  /**
   * Save a search query to user's search history
   */
  static async saveSearchQuery(
    query: string,
    type: "users" | "conversations" | "messages",
    result_count: number
  ): Promise<void> {
    return handleApiCall(() =>
      Api.post("/search/history", {
        query,
        type,
        result_count,
      })
    );
  }

  /**
   * Get user's search history
   */
  static async getSearchHistory(
    params: {
      type?: "users" | "conversations" | "messages";
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<
    PaginatedResponse<{
      id: string;
      query: string;
      type: "users" | "conversations" | "messages";
      result_count: number;
      searched_at: string;
    }>
  > {
    return handlePaginatedApiCall(() => Api.get("/search/history", { params }));
  }

  /**
   * Clear user's search history
   */
  static async clearSearchHistory(
    type?: "users" | "conversations" | "messages"
  ): Promise<void> {
    return handleApiCall(() =>
      Api.delete("/search/history", {
        data: type ? { type } : undefined,
      })
    );
  }

  /**
   * Delete a specific search history entry
   */
  static async deleteSearchHistoryEntry(entryId: string): Promise<void> {
    return handleApiCall(() => Api.delete(`/search/history/${entryId}`));
  }

  /**
   * Search for users with advanced filters
   */
  static async advancedUserSearch(params: {
    query?: string;
    name?: string;
    username?: string;
    location?: string;
    mutual_friends?: boolean;
    online_only?: boolean;
    has_avatar?: boolean;
    created_after?: string;
    created_before?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<User>> {
    return handlePaginatedApiCall(() =>
      Api.get("/users/search/advanced", { params })
    );
  }

  /**
   * Search messages with advanced filters
   */
  static async advancedMessageSearch(params: {
    query?: string;
    conversation_ids?: string[];
    from_user_ids?: string[];
    message_types?: ("text" | "system" | "call_start" | "call_end")[];
    has_attachments?: boolean;
    date_from?: string;
    date_to?: string;
    sort_by?: "relevance" | "date_asc" | "date_desc";
    limit?: number;
    cursor?: string;
  }): Promise<
    PaginatedResponse<
      Message & {
        conversation: Conversation;
        relevance_score: number;
        highlighted_content: string;
      }
    >
  > {
    return handlePaginatedApiCall(() =>
      Api.get("/messages/search/advanced", { params })
    );
  }

  /**
   * Get search analytics for the current user
   */
  static async getSearchAnalytics(
    params: {
      start_date?: string;
      end_date?: string;
    } = {}
  ): Promise<{
    total_searches: number;
    searches_by_type: Record<string, number>;
    most_searched_queries: Array<{
      query: string;
      count: number;
    }>;
    search_success_rate: number;
    average_results_per_search: number;
  }> {
    return handleApiCall(() => Api.get("/search/analytics", { params }));
  }

  /**
   * Report inappropriate search results
   */
  static async reportSearchResult(
    query: string,
    result_type: "user" | "conversation" | "message",
    result_id: string,
    reason: "spam" | "inappropriate" | "harassment" | "other",
    description?: string
  ): Promise<void> {
    return handleApiCall(() =>
      Api.post("/search/report", {
        query,
        result_type,
        result_id,
        reason,
        description,
      })
    );
  }

  /**
   * Get search filters and options available to the user
   */
  static async getSearchFilters(): Promise<{
    user_filters: {
      locations: string[];
      creation_date_ranges: Array<{
        label: string;
        start_date: string;
        end_date: string;
      }>;
    };
    message_filters: {
      available_types: string[];
      date_ranges: Array<{
        label: string;
        start_date: string;
        end_date: string;
      }>;
    };
    conversation_filters: {
      participant_count_ranges: Array<{
        label: string;
        min: number;
        max: number;
      }>;
    };
  }> {
    return handleApiCall(() => Api.get("/search/filters"));
  }

  /**
   * Autocomplete search queries
   */
  static async autocompleteSearch(
    query: string,
    type: "users" | "conversations" | "messages",
    limit: number = 5
  ): Promise<{
    suggestions: Array<{
      text: string;
      type: "query" | "user" | "conversation";
      data?: User | Conversation;
    }>;
  }> {
    return handleApiCall(() =>
      Api.get("/search/autocomplete", {
        params: { q: query, type, limit },
      })
    );
  }
}
