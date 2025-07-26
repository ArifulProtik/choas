"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  MessagingApiService,
  MessageSearchResult,
  SearchParams,
} from "../api/messaging";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Message } from "../schemas/messaging";
import { conversationKeys } from "./use-conversations";

// Query keys for messaging operations
export const messagingKeys = {
  all: ["messaging"] as const,
  search: () => [...messagingKeys.all, "search"] as const,
  messageSearch: (params: SearchParams) =>
    [...messagingKeys.search(), "messages", params] as const,
  conversationSearch: (params: SearchParams) =>
    [...messagingKeys.search(), "conversations", params] as const,
};

// Hook for marking messages as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      return MessagingApiService.markMessagesAsRead(conversationId);
    },
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.messages(conversationId),
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(
        conversationKeys.messages(conversationId)
      );

      // Optimistically update messages as read
      queryClient.setQueryData(
        conversationKeys.messages(conversationId),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((msg: Message) => ({
                ...msg,
                // Note: Backend doesn't track individual message read status
                // This is handled at the conversation participant level
              }))
            ),
          };
        }
      );

      // Update messaging store
      messagingStore.markMessagesAsRead(conversationId);

      return { previousMessages };
    },
    onError: (error, conversationId, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          conversationKeys.messages(conversationId),
          context.previousMessages
        );
      }

      console.error("Failed to mark messages as read:", error);
    },
    onSuccess: (data, conversationId) => {
      // Invalidate conversations list to update unread counts
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};

// Hook for deleting messages
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: async (messageId: string) => {
      return MessagingApiService.deleteMessage(messageId);
    },
    onMutate: async (messageId) => {
      // Find which conversation this message belongs to
      let conversationId: string | null = null;
      const allConversationQueries = queryClient.getQueriesData({
        queryKey: conversationKeys.all,
      });

      for (const [queryKey, data] of allConversationQueries) {
        if (queryKey.includes("messages") && data) {
          const messagesData = data as any;
          if (messagesData.pages) {
            for (const page of messagesData.pages) {
              const message = page.find((msg: Message) => msg.id === messageId);
              if (message) {
                conversationId = message.conversation_id;
                break;
              }
            }
          }
          if (conversationId) break;
        }
      }

      if (!conversationId) return { previousMessages: null };

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.messages(conversationId),
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(
        conversationKeys.messages(conversationId)
      );

      // Optimistically mark message as deleted (soft delete)
      queryClient.setQueryData(
        conversationKeys.messages(conversationId),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((msg: Message) =>
                msg.id === messageId ? { ...msg, is_deleted: true } : msg
              )
            ),
          };
        }
      );

      // Update store
      messagingStore.updateMessage(messageId, { is_deleted: true });

      return { previousMessages, conversationId };
    },
    onError: (error, messageId, context) => {
      // Rollback on error
      if (context?.previousMessages && context?.conversationId) {
        queryClient.setQueryData(
          conversationKeys.messages(context.conversationId),
          context.previousMessages
        );
      }

      console.error("Failed to delete message:", error);
    },
    onSuccess: (data, messageId, context) => {
      if (context?.conversationId) {
        // Invalidate conversations list to update last message if needed
        queryClient.invalidateQueries({
          queryKey: conversationKeys.lists(),
        });
      }
    },
  });
};

// Hook for searching messages with offset-based pagination
export const useSearchMessages = (
  params: SearchParams,
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: messagingKeys.messageSearch(params),
    queryFn: ({ pageParam = 0 }) =>
      MessagingApiService.searchMessages({
        ...params,
        offset: pageParam,
        limit: params.limit || 20,
      }),
    getNextPageParam: (lastPage: MessageSearchResult[], allPages) => {
      const limit = params.limit || 20;
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: enabled && params.q.trim().length > 0,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      messages: data.pages.flatMap((page) => page || []).filter(Boolean),
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for searching conversations with offset-based pagination
export const useSearchConversations = (
  params: SearchParams,
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: messagingKeys.conversationSearch(params),
    queryFn: ({ pageParam = 0 }) =>
      MessagingApiService.searchConversations({
        ...params,
        offset: pageParam,
        limit: params.limit || 20,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const limit = params.limit || 20;
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: enabled && params.q.trim().length > 0,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      conversations: data.pages.flatMap((page) => page || []).filter(Boolean),
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Utility hook for message operations in a specific conversation
export const useConversationMessageOperations = (conversationId: string) => {
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();

  return {
    markAsRead: () => markAsRead.mutate(conversationId),
    deleteMessage: deleteMessage.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isDeletingMessage: deleteMessage.isPending,
  };
};
