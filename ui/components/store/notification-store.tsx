"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

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

    // Initialization
    initialize: () => {
      // Load initial notifications from mock data or API
      const mockNotifications: Notification[] = [
        {
          id: "notif_1",
          user_id: "1",
          type: "message",
          title: "New message from Bob",
          content: "I'm doing well! Are you free for a quick call later?",
          related_id: "conv_1",
          is_read: false,
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        },
        {
          id: "notif_2",
          user_id: "1",
          type: "friend_request",
          title: "Friend request from Frank Miller",
          content: "Frank Miller wants to be your friend",
          related_id: "7",
          is_read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        },
        {
          id: "notif_3",
          user_id: "1",
          type: "call",
          title: "Missed call from Diana",
          content: "You missed a voice call",
          related_id: "call_2",
          is_read: true,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          id: "notif_4",
          user_id: "1",
          type: "system",
          title: "Welcome to Private Messaging",
          content:
            "You can now send private messages and make voice calls with other users",
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
      ];

      get().setNotifications(mockNotifications);
    },

    reset: () => set(initialState),
  }))
);
