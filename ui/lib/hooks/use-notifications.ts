"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Api, handleApiCall } from "../api/api";
import { useNotificationStore } from "@/components/store/notification-store";

// Backend notification data structure based on schema analysis
export interface BackendNotification {
  id: string;
  user_id: string;
  type: "friend_request" | "message" | "friend_accepted";
  title: string;
  content: string;
  is_read: boolean;
  related_user_id?: string;
  related_conversation_id?: string;
  created_at: string;
  updated_at: string;
  // Populated by WithRelatedUser() and WithRelatedConversation()
  edges?: {
    related_user?: {
      id: string;
      username: string;
      name: string;
      avatar_url?: string;
    };
    related_conversation?: {
      id: string;
      type: "direct" | "group";
      name?: string;
    };
  };
}

// Transform backend notification to frontend format
const transformNotification = (
  backendNotification: BackendNotification
): import("@/components/store/notification-store").Notification => ({
  id: backendNotification.id,
  user_id: backendNotification.user_id,
  type: backendNotification.type as "friend_request" | "message" | "system",
  title: backendNotification.title,
  content: backendNotification.content,
  related_id:
    backendNotification.related_conversation_id ||
    backendNotification.related_user_id,
  is_read: backendNotification.is_read,
  created_at: backendNotification.created_at,
});

// Query keys for notifications
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: { limit?: number; offset?: number }) =>
    [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

// Hook for getting notifications with offset-based pagination
export const useNotifications = (
  params: {
    limit?: number;
    offset?: number;
  } = {}
) => {
  const notificationStore = useNotificationStore();

  return useInfiniteQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await Api.get("/notifications", {
        params: {
          limit: params.limit || 20,
          offset: pageParam,
        },
      });
      return response.data as BackendNotification[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = params.limit || 20;
      // If we got fewer results than the limit, we've reached the end
      if (lastPage.length < limit) return undefined;
      // Otherwise, return the next offset
      return allPages.length * limit;
    },
    initialPageParam: 0,
    select: (data) => {
      const notifications = data.pages
        .flatMap((page) => page)
        .map(transformNotification);

      // Update store with fetched notifications
      notificationStore.setNotifications(notifications);

      return {
        pages: data.pages,
        pageParams: data.pageParams,
        notifications,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for getting unread notification count
export const useUnreadNotificationCount = () => {
  const notificationStore = useNotificationStore();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      // Backend doesn't have a dedicated unread count endpoint
      // We'll calculate from the notifications list
      const response = await Api.get("/notifications", {
        params: { limit: 100, offset: 0 }, // Get enough to calculate accurate count
      });
      const notifications = response.data as BackendNotification[];
      return notifications.filter((n) => !n.is_read).length;
    },
    select: (count) => {
      // Update store unread count
      notificationStore.setNotifications(
        notificationStore.notifications.map((n, index) =>
          index < count ? { ...n, is_read: false } : n
        )
      );
      return count;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

// Hook for marking a notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const notificationStore = useNotificationStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await Api.put(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      // Optimistically update store
      notificationStore.markAsRead(notificationId);

      // Update query cache
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: BackendNotification[]) =>
              page.map((notification) =>
                notification.id === notificationId
                  ? { ...notification, is_read: true }
                  : notification
              )
            ),
          };
        }
      );

      return { notificationId };
    },
    onError: (error, notificationId, context) => {
      console.error("Failed to mark notification as read:", error);

      // Rollback optimistic update in store
      // Note: This is a simplified rollback - in a real app you'd want to restore the exact previous state
      notificationStore.setNotifications(
        notificationStore.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: false } : n
        )
      );
    },
    onSuccess: () => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
};

// Hook for marking all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const notificationStore = useNotificationStore();

  return useMutation({
    mutationFn: async () => {
      const response = await Api.put("/notifications/read-all");
      return response.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      // Optimistically update store
      notificationStore.markAllAsRead();

      // Update query cache
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: BackendNotification[]) =>
              page.map((notification) => ({
                ...notification,
                is_read: true,
              }))
            ),
          };
        }
      );

      return {};
    },
    onError: (error) => {
      console.error("Failed to mark all notifications as read:", error);

      // Rollback would require storing previous state - simplified for now
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
    onSuccess: () => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
};

// Hook for deleting a notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const notificationStore = useNotificationStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await Api.delete(`/notifications/${notificationId}`);
      return response.data;
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      // Optimistically update store
      notificationStore.deleteNotification(notificationId);

      // Update query cache
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: BackendNotification[]) =>
              page.filter((notification) => notification.id !== notificationId)
            ),
          };
        }
      );

      return { notificationId };
    },
    onError: (error, notificationId, context) => {
      console.error("Failed to delete notification:", error);

      // Rollback would require restoring the deleted notification - simplified for now
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
    onSuccess: () => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
};

// Utility hook for notification operations
export const useNotificationOperations = () => {
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  return {
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeletingNotification: deleteNotification.isPending,
  };
};

// Hook for WebSocket notification integration
export const useNotificationWebSocketIntegration = () => {
  const queryClient = useQueryClient();
  const notificationStore = useNotificationStore();

  const handleWebSocketNotification = (notification: BackendNotification) => {
    // Add to store
    notificationStore.addNotification(transformNotification(notification));

    // Update query cache
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (old: any) => {
        if (!old) return old;

        // Add to the first page
        const updatedPages = [...old.pages];
        if (updatedPages.length > 0) {
          updatedPages[0] = [notification, ...updatedPages[0]];
        } else {
          updatedPages[0] = [notification];
        }

        return {
          ...old,
          pages: updatedPages,
        };
      }
    );

    // Invalidate unread count
    queryClient.invalidateQueries({
      queryKey: notificationKeys.unreadCount(),
    });
  };

  return {
    handleWebSocketNotification,
  };
};
