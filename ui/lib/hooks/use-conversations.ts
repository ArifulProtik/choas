"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import {
  MessagingApiService,
  ConversationWithDetails,
  GetConversationsParams,
  GetMessagesParams,
} from "../api/messaging";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Message } from "../schemas/messaging";

// Query keys
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (params: GetConversationsParams) =>
    [...conversationKeys.lists(), params] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (id: string) =>
    [...conversationKeys.detail(id), "messages"] as const,
};

// Hook for fetching conversations with offset-based pagination
export const useConversations = (params: GetConversationsParams = {}) => {
  return useInfiniteQuery({
    queryKey: conversationKeys.list(params),
    queryFn: ({ pageParam = 0 }) =>
      MessagingApiService.getConversations({
        ...params,
        offset: pageParam,
        limit: params.limit || 20,
      }),
    getNextPageParam: (lastPage: ConversationWithDetails[], allPages) => {
      const limit = params.limit || 20;
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      conversations: data.pages.flatMap((page) => page || []).filter(Boolean),
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for fetching conversation details
export const useConversationDetails = (
  conversationId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => MessagingApiService.getConversationDetails(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for fetching conversation messages with offset-based pagination
export const useConversationMessages = (
  conversationId: string,
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: ({ pageParam = 0 }) =>
      MessagingApiService.getConversationMessages(conversationId, {
        offset: pageParam,
        limit: 50,
      }),
    getNextPageParam: (lastPage: Message[], allPages) => {
      const limit = 50;
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: enabled && !!conversationId,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      messages: data.pages
        .flatMap((page) => page || [])
        .filter(Boolean)
        .reverse(), // Reverse to show newest at bottom
    }),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for sending messages with optimistic updates
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      return MessagingApiService.sendMessage(conversationId, { content });
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.messages(conversationId),
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(
        conversationKeys.messages(conversationId)
      );

      // Create optimistic message
      const currentUser = messagingStore.currentUserId;
      if (!currentUser) throw new Error("User not authenticated");

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}-${Math.random()}`,
        conversation_id: conversationId,
        sender_id: currentUser,
        sender: {
          id: currentUser,
          name: "You", // This will be replaced with actual user data
          username: "you",
          email: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        content,
        message_type: "text",
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData(
        conversationKeys.messages(conversationId),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any, index: number) => {
              // Add to the first page (most recent messages)
              if (index === 0) {
                return [optimisticMessage, ...page];
              }
              return page;
            }),
          };
        }
      );

      // Also update the messaging store for immediate UI updates
      messagingStore.addMessage(optimisticMessage);

      return { previousMessages, optimisticMessage };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          conversationKeys.messages(variables.conversationId),
          context.previousMessages
        );
      }

      // Remove optimistic message from store
      if (context?.optimisticMessage) {
        messagingStore.removeMessage(context.optimisticMessage.id);
      }

      console.error("Failed to send message:", error);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real message
      queryClient.setQueryData(
        conversationKeys.messages(variables.conversationId),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((msg: Message) =>
                msg.id === context?.optimisticMessage.id ? data : msg
              )
            ),
          };
        }
      );

      // Update the messaging store with the real message
      if (context?.optimisticMessage) {
        messagingStore.removeMessage(context.optimisticMessage.id);
        messagingStore.addMessage(data);
      }

      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};

// Hook for archiving conversations
export const useArchiveConversation = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: MessagingApiService.archiveConversation,
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(conversationKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: conversationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((conv: ConversationWithDetails) =>
                conv.id === conversationId
                  ? { ...conv, is_archived: true }
                  : conv
              )
            ),
          };
        }
      );

      // Update store
      messagingStore.archiveConversation(conversationId);

      return { previousData };
    },
    onError: (error, conversationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousData
        );
      }

      console.error("Failed to archive conversation:", error);
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};

// Hook for unarchiving conversations
export const useUnarchiveConversation = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: MessagingApiService.unarchiveConversation,
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(conversationKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: conversationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((conv: ConversationWithDetails) =>
                conv.id === conversationId
                  ? { ...conv, is_archived: false }
                  : conv
              )
            ),
          };
        }
      );

      // Update store
      messagingStore.unarchiveConversation(conversationId);

      return { previousData };
    },
    onError: (error, conversationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousData
        );
      }

      console.error("Failed to unarchive conversation:", error);
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};

// Hook for muting conversations
export const useMuteConversation = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: MessagingApiService.muteConversation,
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(conversationKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: conversationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((conv: ConversationWithDetails) =>
                conv.id === conversationId ? { ...conv, is_muted: true } : conv
              )
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (error, conversationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousData
        );
      }

      console.error("Failed to mute conversation:", error);
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};

// Hook for unmuting conversations
export const useUnmuteConversation = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  return useMutation({
    mutationFn: MessagingApiService.unmuteConversation,
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(conversationKeys.lists());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: conversationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) =>
              page.map((conv: ConversationWithDetails) =>
                conv.id === conversationId ? { ...conv, is_muted: false } : conv
              )
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (error, conversationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousData
        );
      }

      console.error("Failed to unmute conversation:", error);
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};
