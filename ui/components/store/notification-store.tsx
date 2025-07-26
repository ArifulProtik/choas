"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { isWebSocketMessageDuplicate } from "@/lib/utils/websocket-deduplication";

// Notification types based on the design document
export type NotificationType = "message" | "friend_request" | "call" | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  related_id?: string; // conversation_id, user_id, call_id, etc.
  is_read: boolean;
  created_at: string;
}

export interface NotificationFilter {
  type?: NotificationType;
  is_read?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  filter: NotificationFilter;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  setFilter: (filter: NotificationFilter) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed getters
  getFilteredNotifications: () => Notification[];
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadCountByType: (type: NotificationType) => number;

  // WebSocket integration
  handleWebSocketMessage: (message: any) => void;
  getCurrentUserId: () => string | null;

  // Initialization
  initialize: () => void;
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  filter: {},
};

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Actions
    setNotifications: (notifications) => {
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount });
    },

    addNotification: (notification) =>
      set((state) => {
        const updatedNotifications = [notification, ...state.notifications];
        const unreadCount = updatedNotifications.filter(
          (n) => !n.is_read
        ).length;
        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      }),

    markAsRead: (notificationId) =>
      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        const unreadCount = updatedNotifications.filter(
          (n) => !n.is_read
        ).length;
        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      }),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
        })),
        unreadCount: 0,
      })),

    deleteNotification: (notificationId) =>
      set((state) => {
        const notification = state.notifications.find(
          (n) => n.id === notificationId
        );
        const updatedNotifications = state.notifications.filter(
          (n) => n.id !== notificationId
        );
        const unreadCount =
          notification && !notification.is_read
            ? state.unreadCount - 1
            : state.unreadCount;
        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      }),

    clearAllNotifications: () =>
      set({
        notifications: [],
        unreadCount: 0,
      }),

    setFilter: (filter) => set({ filter }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    // Computed getters
    getFilteredNotifications: () => {
      const state = get();
      let filtered = [...state.notifications];

      if (state.filter.type) {
        filtered = filtered.filter((n) => n.type === state.filter.type);
      }

      if (state.filter.is_read !== undefined) {
        filtered = filtered.filter((n) => n.is_read === state.filter.is_read);
      }

      return filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },

    getUnreadNotifications: () => {
      const state = get();
      return state.notifications.filter((n) => !n.is_read);
    },

    getNotificationsByType: (type) => {
      const state = get();
      return state.notifications.filter((n) => n.type === type);
    },

    getUnreadCountByType: (type) => {
      const state = get();
      return state.notifications.filter((n) => n.type === type && !n.is_read)
        .length;
    },

    // WebSocket message handler - matches backend notification patterns
    handleWebSocketMessage: (message: any) => {
      if (!message.type || !message.data) {
        console.warn("Invalid WebSocket notification message format:", message);
        return;
      }

      const timestamp = message.timestamp || new Date().toISOString();

      // Check for duplicate messages using backend message ID and timestamp patterns
      if (isWebSocketMessageDuplicate(message.type, message.data, timestamp)) {
        console.log(
          "Duplicate WebSocket notification message detected, skipping:",
          message.type
        );
        return;
      }

      switch (message.type) {
        case "notification":
          // Handle direct notification matching backend NotificationData structure
          if (
            message.data.notification_id &&
            message.data.type &&
            message.data.title
          ) {
            const notification: Notification = {
              id: message.data.notification_id,
              user_id: message.data.user_id || get().getCurrentUserId() || "",
              type: message.data.type as NotificationType,
              title: message.data.title,
              content: message.data.content || "",
              related_id: message.data.related_user_id,
              is_read: false,
              created_at: timestamp,
            };

            // Prevent duplicate notifications using notification ID and timestamp
            const existingNotification = get().notifications.find(
              (n) =>
                n.id === notification.id ||
                (n.type === notification.type &&
                  n.related_id === notification.related_id &&
                  Math.abs(
                    new Date(n.created_at).getTime() -
                      new Date(notification.created_at).getTime()
                  ) < 5000)
            );
            if (!existingNotification) {
              get().addNotification(notification);
            }
          }
          break;

        case "message":
          // Create message notification from WebSocket message data matching backend MessageData
          if (
            message.data.message_id &&
            message.data.sender_id &&
            message.data.sender_username &&
            message.data.conversation_id
          ) {
            const currentUserId = get().getCurrentUserId();

            // Only create notification if message is not from current user
            if (message.data.sender_id !== currentUserId && currentUserId) {
              const notification: Notification = {
                id: `msg_notif_${message.data.message_id}`,
                user_id: currentUserId,
                type: "message",
                title: `New message from ${message.data.sender_username}`,
                content: message.data.content || "New message",
                related_id: message.data.conversation_id,
                is_read: false,
                created_at: message.data.created_at || timestamp,
              };

              // Prevent duplicate message notifications using message ID
              const existingNotification = get().notifications.find(
                (n) => n.id === notification.id
              );
              if (!existingNotification) {
                get().addNotification(notification);
              }
            }
          }
          break;

        case "friend_request":
          // Create friend request notification from WebSocket data matching backend FriendRequestData
          if (message.data.requester_id && message.data.requester_username) {
            const currentUserId = get().getCurrentUserId();

            if (currentUserId) {
              const notification: Notification = {
                id: `friend_req_notif_${
                  message.data.requester_id
                }_${Date.now()}`,
                user_id: currentUserId,
                type: "friend_request",
                title: `Friend request from ${message.data.requester_username}`,
                content: `${message.data.requester_username} wants to be your friend`,
                related_id: message.data.requester_id,
                is_read: false,
                created_at: timestamp,
              };

              // Prevent duplicate friend request notifications
              const existingNotification = get().notifications.find(
                (n) =>
                  n.type === "friend_request" &&
                  n.related_id === message.data.requester_id &&
                  Math.abs(new Date(n.created_at).getTime() - Date.now()) <
                    60000 // Within 1 minute
              );
              if (!existingNotification) {
                get().addNotification(notification);
              }
            }
          }
          break;

        case "friend_accepted":
          // Create friend accepted notification from WebSocket data
          if (message.data.requester_username) {
            const currentUserId = get().getCurrentUserId();

            if (currentUserId) {
              const notification: Notification = {
                id: `friend_accepted_notif_${Date.now()}`,
                user_id: currentUserId,
                type: "friend_request",
                title: "Friend request accepted",
                content: `${message.data.requester_username} accepted your friend request`,
                related_id: message.data.requester_id,
                is_read: false,
                created_at: timestamp,
              };

              get().addNotification(notification);
            }
          }
          break;

        case "call_request":
          // Create call notification from WebSocket call request data matching backend CallRequestData
          if (
            message.data.call_id &&
            message.data.caller_id &&
            message.data.callee_id
          ) {
            const currentUserId = get().getCurrentUserId();

            // Only create notification if call is for current user
            if (message.data.callee_id === currentUserId && currentUserId) {
              const notification: Notification = {
                id: `call_notif_${message.data.call_id}`,
                user_id: currentUserId,
                type: "call",
                title: "Incoming call",
                content: `Incoming ${message.data.call_type || "voice"} call`,
                related_id: message.data.call_id,
                is_read: false,
                created_at: timestamp,
              };

              // Prevent duplicate call notifications
              const existingNotification = get().notifications.find(
                (n) => n.id === notification.id
              );
              if (!existingNotification) {
                get().addNotification(notification);
              }
            }
          }
          break;

        case "call_response":
          // Create call response notification from WebSocket data matching backend CallResponseData
          if (
            message.data.call_id &&
            message.data.response &&
            message.data.caller_id
          ) {
            const currentUserId = get().getCurrentUserId();

            // Only create notification if current user is the caller
            if (message.data.caller_id === currentUserId && currentUserId) {
              const notification: Notification = {
                id: `call_response_notif_${message.data.call_id}`,
                user_id: currentUserId,
                type: "call",
                title: `Call ${message.data.response}`,
                content:
                  message.data.response === "accepted"
                    ? "Call was accepted"
                    : "Call was declined",
                related_id: message.data.call_id,
                is_read: false,
                created_at: timestamp,
              };

              get().addNotification(notification);
            }
          }
          break;

        case "call_end":
          // Create call end notification from WebSocket call end data matching backend CallEndData
          if (message.data.call_id) {
            const currentUserId = get().getCurrentUserId();

            if (
              currentUserId &&
              (message.data.caller_id === currentUserId ||
                message.data.callee_id === currentUserId)
            ) {
              const durationText =
                message.data.duration && message.data.duration > 0
                  ? `Call duration: ${Math.floor(
                      message.data.duration / 60
                    )}:${(message.data.duration % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : "Call ended";

              const notification: Notification = {
                id: `call_end_notif_${message.data.call_id}`,
                user_id: currentUserId,
                type: "call",
                title: "Call ended",
                content: durationText,
                related_id: message.data.call_id,
                is_read: false,
                created_at: timestamp,
              };

              // Prevent duplicate call end notifications
              const existingNotification = get().notifications.find(
                (n) => n.id === notification.id
              );
              if (!existingNotification) {
                get().addNotification(notification);
              }
            }
          }
          break;

        default:
          // Log unhandled message types for debugging
          console.log(
            "Unhandled WebSocket message type in NotificationStore:",
            message.type
          );
          break;
      }
    },

    // Helper method to get current user ID from auth system
    getCurrentUserId: () => {
      // Import auth store dynamically to avoid circular dependencies
      try {
        const { useAuthStore } = require("@/components/store/auth-store");
        return useAuthStore.getState().user?.id || null;
      } catch (error) {
        // Fallback if auth store is not available
        console.warn("Could not access auth store for current user ID");
        return null;
      }
    },

    // Initialization
    initialize: () => {
      // Notifications will be loaded via TanStack Query hooks
      // No more mock data initialization needed
    },

    reset: () => set(initialState),
  }))
);
