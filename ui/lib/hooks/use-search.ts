"use client";

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { Api } from "../api/api";
import { User } from "../schemas/user";
import { Message, Conversation } from "../schemas/messaging";
import { useDebounce } from "./index";
import { useSearchStore } from "@/components/store/search-store";

// Backend search result types based on controller analysis
export interface BackendUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  // Populated by service with sender info
  edges?: {
    sender?: BackendUser;
    conversation?: {
      id: string;
      type: "direct" | "group";
      name?: string;
    };
  };
}

export interface BackendConversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  last_message_at?: string;
  is_archived: boolean;
  is_muted: boolean;
  created_at: string;
  updated_at: string;
  // Populated by service with participants
  edges?: {
    participants?: BackendUser[];
    last_message?: BackendMessage;
  };
}

// Transform functions
const transformUser = (backendUser: BackendUser): User => ({
  id: backendUser.id,
  username: backendUser.username,
  name: backendUser.name,
  email: backendUser.email,
  avatar_url: backendUser.avatar_url,
  created_at: backendUser.created_at,
  updated_at: backendUser.updated_at,
});

const transformMessage = (backendMessage: BackendMessage): Message => ({
  id: backendMessage.id,
  conversation_id: backendMessage.conversation_id,
  sender_id: backendMessage.sender_id,
  sender: backendMessage.edges?.sender
    ? transformUser(backendMessage.edges.sender)
    : ({} as User),
  content: backendMessage.content,
  message_type: backendMessage.message_type as any,
  is_deleted: false, // Backend doesn't return deleted messages in search
  created_at: backendMessage.created_at,
  updated_at: backendMessage.updated_at,
});

const transformConversation = (
  backendConversation: BackendConversation
): Conversation => ({
  id: backendConversation.id,
  type: backendConversation.type,
  name: backendConversation.name,
  last_message_at: backendConversation.last_message_at,
  is_archived: backendConversation.is_archived,
  is_muted: backendConversation.is_muted,
  created_at: backendConversation.created_at,
  updated_at: backendConversation.updated_at,
  participants:
    backendConversation.edges?.participants?.map(transformUser) || [],
  last_message: backendConversation.edges?.last_message
    ? transformMessage(backendConversation.edges.last_message)
    : undefined,
  unread_count: 0, // Search results don't include unread count
});

// Query keys for search operations
export const searchKeys = {
  all: ["search"] as const,
  users: () => [...searchKeys.all, "users"] as const,
  userSearch: (query: string) => [...searchKeys.users(), query] as const,
  friends: () => [...searchKeys.all, "friends"] as const,
  friendSearch: (query: string) => [...searchKeys.friends(), query] as const,
  messages: () => [...searchKeys.all, "messages"] as const,
  messageSearch: (query: string, params: MessageSearchParams) =>
    [...searchKeys.messages(), query, params] as const,
  conversations: () => [...searchKeys.all, "conversations"] as const,
  conversationSearch: (query: string, params: ConversationSearchParams) =>
    [...searchKeys.conversations(), query, params] as const,
};

// Search parameter types
export interface MessageSearchParams {
  limit?: number;
  offset?: number;
  conversation_id?: string;
  from_user_id?: string;
  message_type?: string;
}

export interface ConversationSearchParams {
  limit?: number;
  offset?: number;
  include_archived?: boolean;
}

// Hook for searching users with debouncing and store integration
export const useUserSearch = (
  query: string,
  options: {
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const { enabled = true, debounceMs = 300 } = options;
  const debouncedQuery = useDebounce(query, debounceMs);
  const searchStore = useSearchStore();

  return useQuery({
    queryKey: searchKeys.userSearch(debouncedQuery),
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];

      const response = await Api.get("/users/search", {
        params: { q: debouncedQuery },
      });
      const users = (response.data as BackendUser[]).map(transformUser);

      // Update search store with query
      searchStore.setQuery(debouncedQuery);

      return users;
    },
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for searching friends with debouncing
export const useFriendSearch = (
  query: string,
  options: {
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const { enabled = true, debounceMs = 300 } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: searchKeys.friendSearch(debouncedQuery),
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];

      const response = await Api.get("/friends/search", {
        params: { q: debouncedQuery },
      });
      return (response.data as BackendUser[]).map(transformUser);
    },
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for searching messages with debouncing and offset-based pagination
export const useMessageSearch = (
  query: string,
  params: MessageSearchParams = {},
  options: {
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const { enabled = true, debounceMs = 500 } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useInfiniteQuery({
    queryKey: searchKeys.messageSearch(debouncedQuery, params),
    queryFn: async ({ pageParam = 0 }) => {
      if (!debouncedQuery.trim()) return [];

      const response = await Api.get("/messages/search", {
        params: {
          q: debouncedQuery,
          limit: params.limit || 20,
          offset: pageParam,
          ...params,
        },
      });
      return (response.data as BackendMessage[]).map(transformMessage);
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = params.limit || 20;
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: enabled && debouncedQuery.trim().length > 0,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      messages: data.pages.flatMap((page) => page || []).filter(Boolean),
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for searching conversations with debouncing and offset-based pagination
export const useConversationSearch = (
  query: string,
  params: ConversationSearchParams = {},
  options: {
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const { enabled = true, debounceMs = 500 } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useInfiniteQuery({
    queryKey: searchKeys.conversationSearch(debouncedQuery, params),
    queryFn: async ({ pageParam = 0 }) => {
      if (!debouncedQuery.trim()) return [];

      const response = await Api.get("/conversations/search", {
        params: {
          q: debouncedQuery,
          limit: params.limit || 20,
          offset: pageParam,
          ...params,
        },
      });
      return (response.data as BackendConversation[]).map(
        transformConversation
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = params.limit || 20;
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: enabled && debouncedQuery.trim().length > 0,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      conversations: data.pages.flatMap((page) => page || []).filter(Boolean),
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Combined search hook for global search functionality
export const useGlobalSearch = (
  query: string,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    searchUsers?: boolean;
    searchMessages?: boolean;
    searchConversations?: boolean;
  } = {}
) => {
  const {
    enabled = true,
    debounceMs = 500,
    searchUsers = true,
    searchMessages = true,
    searchConversations = true,
  } = options;

  const userSearch = useUserSearch(query, {
    enabled: enabled && searchUsers,
    debounceMs,
  });

  const messageSearch = useMessageSearch(
    query,
    { limit: 10 }, // Limit for global search
    {
      enabled: enabled && searchMessages,
      debounceMs,
    }
  );

  const conversationSearch = useConversationSearch(
    query,
    { limit: 10 }, // Limit for global search
    {
      enabled: enabled && searchConversations,
      debounceMs,
    }
  );

  const isLoading = useMemo(
    () =>
      (searchUsers && userSearch.isLoading) ||
      (searchMessages && messageSearch.isLoading) ||
      (searchConversations && conversationSearch.isLoading),
    [
      searchUsers,
      userSearch.isLoading,
      searchMessages,
      messageSearch.isLoading,
      searchConversations,
      conversationSearch.isLoading,
    ]
  );

  const hasError = useMemo(
    () =>
      (searchUsers && userSearch.error) ||
      (searchMessages && messageSearch.error) ||
      (searchConversations && conversationSearch.error),
    [
      searchUsers,
      userSearch.error,
      searchMessages,
      messageSearch.error,
      searchConversations,
      conversationSearch.error,
    ]
  );

  return {
    users: userSearch.data || [],
    messages: messageSearch.data?.messages || [],
    conversations: conversationSearch.data?.conversations || [],
    isLoading,
    error: hasError,
    refetch: () => {
      if (searchUsers) userSearch.refetch();
      if (searchMessages) messageSearch.refetch();
      if (searchConversations) conversationSearch.refetch();
    },
  };
};

// Utility hook for search operations with store integration
export const useSearchOperations = () => {
  const queryClient = useQueryClient();

  const clearSearchCache = () => {
    queryClient.removeQueries({
      queryKey: searchKeys.all,
    });
  };

  const prefetchUserSearch = (query: string) => {
    queryClient.prefetchQuery({
      queryKey: searchKeys.userSearch(query),
      queryFn: async () => {
        if (!query.trim()) return [];

        const response = await Api.get("/users/search", {
          params: { q: query },
        });
        return (response.data as BackendUser[]).map(transformUser);
      },
      staleTime: 1000 * 60 * 2,
    });
  };

  const invalidateSearchResults = () => {
    queryClient.invalidateQueries({
      queryKey: searchKeys.all,
    });
  };

  return {
    clearSearchCache,
    prefetchUserSearch,
    invalidateSearchResults,
  };
};

// Hook for search history management (client-side)
export const useSearchHistory = () => {
  const STORAGE_KEY = "search_history";
  const MAX_HISTORY_ITEMS = 10;

  const getSearchHistory = (): string[] => {
    if (typeof window === "undefined") return [];

    try {
      const history = localStorage.getItem(STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  const addToSearchHistory = (query: string) => {
    if (typeof window === "undefined" || !query.trim()) return;

    try {
      const history = getSearchHistory();
      const filteredHistory = history.filter((item) => item !== query);
      const newHistory = [query, ...filteredHistory].slice(
        0,
        MAX_HISTORY_ITEMS
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  };

  const clearSearchHistory = () => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  };

  const removeFromSearchHistory = (query: string) => {
    if (typeof window === "undefined") return;

    try {
      const history = getSearchHistory();
      const filteredHistory = history.filter((item) => item !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error("Failed to remove from search history:", error);
    }
  };

  return {
    getSearchHistory,
    addToSearchHistory,
    clearSearchHistory,
    removeFromSearchHistory,
  };
};
