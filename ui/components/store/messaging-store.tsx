"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  Conversation,
  Message,
  UserPresence,
  FriendRequest,
  Friendship,
  BlockedUser,
  InAppNotification,
  NotificationPreferences,
  WSMessage,
} from "@/lib/schemas/messaging";
import { User } from "@/lib/schemas/user";
import {
  sortConversationsByLastMessage,
  sortMessagesByTimestamp,
  getTotalUnreadCount,
  searchConversations,
  searchMessages,
  areFriends,
  getFriendshipStatus,
  canSendMessage,
  canInitiateCall,
} from "@/lib/utils/messaging-utils";

// Store state interfaces
interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor?: string;
  searchQuery: string;
  showArchived: boolean;
}

interface MessageState {
  messagesByConversation: Record<string, Message[]>;
  loadingMessages: Record<string, boolean>;
  loadingMoreMessages: Record<string, boolean>;
  messageErrors: Record<string, string | null>;
  hasMoreMessages: Record<string, boolean>;
  messageCursors: Record<string, string | undefined>;
  typingUsers: Record<string, string[]>; // conversationId -> userIds[]
  searchResults: Record<string, Message[]>;
  messageSearchQueries: Record<string, string>; // conversationId -> search query
}

interface FriendState {
  friendships: Friendship[];
  friendRequests: FriendRequest[];
  sentFriendRequests: FriendRequest[];
  loadingFriends: boolean;
  friendError: string | null;
}

interface PresenceState {
  userPresence: Record<string, UserPresence>;
  onlineUsers: Set<string>;
  lastPresenceUpdate: string;
}

interface NotificationState {
  notifications: InAppNotification[];
  unreadNotificationCount: number;
  preferences: NotificationPreferences;
  permissionGranted: boolean;
}

interface BlockedUserState {
  blockedUsers: BlockedUser[];
  loadingBlockedUsers: boolean;
  blockingUser: boolean;
  unblockingUser: boolean;
}

interface UIState {
  sidebarCollapsed: boolean;
  selectedUsers: string[];
  showUserSearch: boolean;
  showFriendRequests: boolean;
  showBlockedUsers: boolean;
}

// Combined store state
interface MessagingState
  extends ConversationState,
    MessageState,
    FriendState,
    PresenceState,
    NotificationState,
    BlockedUserState,
    UIState {
  currentUserId: string | null;

  // Conversation actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => void;
  removeConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  setConversationLoading: (loading: boolean) => void;
  setConversationError: (error: string | null) => void;
  setConversationSearch: (query: string) => void;
  toggleShowArchived: () => void;

  // Message actions
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  setMessageLoading: (conversationId: string, loading: boolean) => void;
  setMessageLoadingMore: (conversationId: string, loading: boolean) => void;
  setHasMoreMessages: (conversationId: string, hasMore: boolean) => void;
  setMessageError: (conversationId: string, error: string | null) => void;
  markMessagesAsRead: (conversationId: string, messageIds?: string[]) => void;
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  searchMessagesInConversation: (conversationId: string, query: string) => void;

  // Friend system actions
  setFriendships: (friendships: Friendship[]) => void;
  addFriendship: (friendship: Friendship) => void;
  removeFriendship: (friendshipId: string) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  addFriendRequest: (request: FriendRequest) => void;
  updateFriendRequest: (
    requestId: string,
    updates: Partial<FriendRequest>
  ) => void;
  removeFriendRequest: (requestId: string) => void;
  setFriendLoading: (loading: boolean) => void;
  setFriendError: (error: string | null) => void;

  // Presence actions
  setUserPresence: (userId: string, presence: UserPresence) => void;
  setMultipleUserPresence: (presenceMap: Record<string, UserPresence>) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  updateLastPresenceUpdate: () => void;

  // Notification actions
  setNotifications: (notifications: InAppNotification[]) => void;
  addNotification: (notification: InAppNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  setNotificationPreferences: (preferences: NotificationPreferences) => void;
  setNotificationPermission: (granted: boolean) => void;

  // Blocked user actions
  setBlockedUsers: (blockedUsers: BlockedUser[]) => void;
  addBlockedUser: (blockedUser: BlockedUser) => void;
  removeBlockedUser: (userId: string) => void;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  setLoadingBlockedUsers: (loading: boolean) => void;
  setBlockingUser: (blocking: boolean) => void;
  setUnblockingUser: (unblocking: boolean) => void;
  isUserBlocked: (userId: string) => boolean;

  // UI actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedUsers: (userIds: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  setShowUserSearch: (show: boolean) => void;
  setShowFriendRequests: (show: boolean) => void;
  setShowBlockedUsers: (show: boolean) => void;

  // Computed getters
  getActiveConversation: () => Conversation | null;
  getConversationMessages: (conversationId: string) => Message[];
  getUnreadCount: () => number;
  getConversationUnreadCount: (conversationId: string) => number;
  getFilteredConversations: () => Conversation[];
  getUserPresence: (userId: string) => UserPresence | null;
  isUserOnline: (userId: string) => boolean;
  getFriendshipStatusWithUser: (
    userId: string
  ) => "friends" | "pending_sent" | "pending_received" | "not_friends";
  canMessageUser: (userId: string) => { canSend: boolean; reason?: string };
  canCallUser: (userId: string) => { canCall: boolean; reason?: string };
  getFriendsList: () => User[];
  getPendingFriendRequests: () => FriendRequest[];
  getSentFriendRequests: () => FriendRequest[];

  // Search integration
  startConversation: (userId: string) => Promise<void>;

  // WebSocket message handler
  handleWebSocketMessage: (message: WSMessage) => void;

  // Initialization
  initialize: (currentUserId: string) => void;
  reset: () => void;
}

const initialState = {
  // Conversation state
  conversations: [],
  activeConversationId: null,
  loading: false,
  error: null,
  hasMore: true,
  cursor: undefined,
  searchQuery: "",
  showArchived: false,

  // Message state
  messagesByConversation: {},
  loadingMessages: {},
  loadingMoreMessages: {},
  messageErrors: {},
  hasMoreMessages: {},
  messageCursors: {},
  typingUsers: {},
  searchResults: {},
  messageSearchQueries: {},

  // Friend state
  friendships: [],
  friendRequests: [],
  sentFriendRequests: [],
  loadingFriends: false,
  friendError: null,

  // Presence state
  userPresence: {},
  onlineUsers: new Set<string>(),
  lastPresenceUpdate: new Date().toISOString(),

  // Notification state
  notifications: [],
  unreadNotificationCount: 0,
  preferences: {
    message_notifications: true,
    call_notifications: true,
    sound_enabled: true,
    desktop_notifications: false,
  },
  permissionGranted: false,

  // Blocked user state
  blockedUsers: [],
  loadingBlockedUsers: false,
  blockingUser: false,
  unblockingUser: false,

  // UI state
  sidebarCollapsed: false,
  selectedUsers: [],
  showUserSearch: false,
  showFriendRequests: false,
  showBlockedUsers: false,

  // Current user
  currentUserId: null,
};

export const useMessagingStore = create<MessagingState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Conversation actions
    setConversations: (conversations) =>
      set({ conversations: sortConversationsByLastMessage(conversations) }),

    addConversation: (conversation) =>
      set((state) => ({
        conversations: sortConversationsByLastMessage([
          conversation,
          ...state.conversations,
        ]),
      })),

    updateConversation: (conversationId, updates) =>
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, ...updates } : conv
        ),
      })),

    removeConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.filter(
          (conv) => conv.id !== conversationId
        ),
        activeConversationId:
          state.activeConversationId === conversationId
            ? null
            : state.activeConversationId,
      })),

    deleteConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.filter(
          (conv) => conv.id !== conversationId
        ),
        activeConversationId:
          state.activeConversationId === conversationId
            ? null
            : state.activeConversationId,
        // Also remove messages for this conversation
        messagesByConversation: Object.fromEntries(
          Object.entries(state.messagesByConversation).filter(
            ([id]) => id !== conversationId
          )
        ),
      })),

    setActiveConversation: (conversationId) =>
      set({ activeConversationId: conversationId }),

    archiveConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, is_archived: true } : conv
        ),
      })),

    unarchiveConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, is_archived: false } : conv
        ),
      })),

    setConversationLoading: (loading) => set({ loading }),
    setConversationError: (error) => set({ error }),
    setConversationSearch: (searchQuery) => set({ searchQuery }),
    toggleShowArchived: () =>
      set((state) => ({ showArchived: !state.showArchived })),

    // Message actions
    setMessages: (conversationId, messages) =>
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: sortMessagesByTimestamp(messages),
        },
      })),

    addMessage: (message) =>
      set((state) => {
        const conversationMessages =
          state.messagesByConversation[message.conversation_id] || [];
        const updatedMessages = sortMessagesByTimestamp([
          ...conversationMessages,
          message,
        ]);

        // Update conversation's last message
        const updatedConversations = state.conversations.map((conv) =>
          conv.id === message.conversation_id
            ? {
                ...conv,
                last_message: message,
                last_message_at: message.created_at,
                unread_count:
                  message.sender.id !== state.currentUserId
                    ? conv.unread_count + 1
                    : conv.unread_count,
              }
            : conv
        );

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [message.conversation_id]: updatedMessages,
          },
          conversations: sortConversationsByLastMessage(updatedConversations),
        };
      }),

    updateMessage: (messageId, updates) =>
      set((state) => {
        const newMessagesByConversation = { ...state.messagesByConversation };

        Object.keys(newMessagesByConversation).forEach((conversationId) => {
          newMessagesByConversation[conversationId] = newMessagesByConversation[
            conversationId
          ].map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg));
        });

        return { messagesByConversation: newMessagesByConversation };
      }),

    removeMessage: (messageId) =>
      set((state) => {
        const newMessagesByConversation = { ...state.messagesByConversation };

        Object.keys(newMessagesByConversation).forEach((conversationId) => {
          newMessagesByConversation[conversationId] = newMessagesByConversation[
            conversationId
          ].filter((msg) => msg.id !== messageId);
        });

        return { messagesByConversation: newMessagesByConversation };
      }),

    setMessageLoading: (conversationId, loading) =>
      set((state) => ({
        loadingMessages: {
          ...state.loadingMessages,
          [conversationId]: loading,
        },
      })),

    setMessageLoadingMore: (conversationId, loading) =>
      set((state) => ({
        loadingMoreMessages: {
          ...state.loadingMoreMessages,
          [conversationId]: loading,
        },
      })),

    setHasMoreMessages: (conversationId, hasMore) =>
      set((state) => ({
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [conversationId]: hasMore,
        },
      })),

    setMessageError: (conversationId, error) =>
      set((state) => ({
        messageErrors: { ...state.messageErrors, [conversationId]: error },
      })),

    markMessagesAsRead: (conversationId, messageIds) =>
      set((state) => {
        const conversationMessages =
          state.messagesByConversation[conversationId] || [];
        const now = new Date().toISOString();

        const updatedMessages = conversationMessages.map((msg) => {
          if (!messageIds || messageIds.includes(msg.id)) {
            return { ...msg, status: "read" as const, read_at: now };
          }
          return msg;
        });

        const updatedConversations = state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        );

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: updatedMessages,
          },
          conversations: updatedConversations,
        };
      }),

    setTypingUsers: (conversationId, userIds) =>
      set((state) => ({
        typingUsers: { ...state.typingUsers, [conversationId]: userIds },
      })),

    addTypingUser: (conversationId, userId) =>
      set((state) => {
        const currentTyping = state.typingUsers[conversationId] || [];
        if (!currentTyping.includes(userId)) {
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...currentTyping, userId],
            },
          };
        }
        return state;
      }),

    removeTypingUser: (conversationId, userId) =>
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: (state.typingUsers[conversationId] || []).filter(
            (id) => id !== userId
          ),
        },
      })),

    searchMessagesInConversation: (conversationId, query) =>
      set((state) => {
        const messages = state.messagesByConversation[conversationId] || [];
        const results = searchMessages(messages, query);
        return {
          searchResults: { ...state.searchResults, [conversationId]: results },
        };
      }),

    // Friend system actions
    setFriendships: (friendships) => set({ friendships }),

    addFriendship: (friendship) =>
      set((state) => ({
        friendships: [...state.friendships, friendship],
      })),

    removeFriendship: (friendshipId) =>
      set((state) => ({
        friendships: state.friendships.filter((f) => f.id !== friendshipId),
      })),

    setFriendRequests: (requests) =>
      set((state) => {
        const currentUserId = state.currentUserId;
        if (!currentUserId) return state;

        const friendRequests = requests.filter(
          (req) => req.recipient.id === currentUserId
        );
        const sentFriendRequests = requests.filter(
          (req) => req.requester.id === currentUserId
        );

        return { friendRequests, sentFriendRequests };
      }),

    addFriendRequest: (request) =>
      set((state) => {
        const currentUserId = state.currentUserId;
        if (!currentUserId) return state;

        if (request.recipient.id === currentUserId) {
          return { friendRequests: [...state.friendRequests, request] };
        } else if (request.requester.id === currentUserId) {
          return { sentFriendRequests: [...state.sentFriendRequests, request] };
        }
        return state;
      }),

    updateFriendRequest: (requestId, updates) =>
      set((state) => ({
        friendRequests: state.friendRequests.map((req) =>
          req.id === requestId ? { ...req, ...updates } : req
        ),
        sentFriendRequests: state.sentFriendRequests.map((req) =>
          req.id === requestId ? { ...req, ...updates } : req
        ),
      })),

    removeFriendRequest: (requestId) =>
      set((state) => ({
        friendRequests: state.friendRequests.filter(
          (req) => req.id !== requestId
        ),
        sentFriendRequests: state.sentFriendRequests.filter(
          (req) => req.id !== requestId
        ),
      })),

    setFriendLoading: (loadingFriends) => set({ loadingFriends }),
    setFriendError: (friendError) => set({ friendError }),

    // Presence actions
    setUserPresence: (userId, presence) =>
      set((state) => ({
        userPresence: { ...state.userPresence, [userId]: presence },
        onlineUsers:
          presence.status === "online"
            ? new Set([...state.onlineUsers, userId])
            : new Set([...state.onlineUsers].filter((id) => id !== userId)),
      })),

    setMultipleUserPresence: (presenceMap) =>
      set((state) => {
        const newOnlineUsers = new Set<string>();
        Object.entries(presenceMap).forEach(([userId, presence]) => {
          if (presence.status === "online") {
            newOnlineUsers.add(userId);
          }
        });

        return {
          userPresence: { ...state.userPresence, ...presenceMap },
          onlineUsers: newOnlineUsers,
        };
      }),

    setUserOnline: (userId, isOnline) =>
      set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers);
        if (isOnline) {
          newOnlineUsers.add(userId);
        } else {
          newOnlineUsers.delete(userId);
        }
        return { onlineUsers: newOnlineUsers };
      }),

    updateLastPresenceUpdate: () =>
      set({ lastPresenceUpdate: new Date().toISOString() }),

    // Notification actions
    setNotifications: (notifications) =>
      set({
        notifications,
        unreadNotificationCount: notifications.filter((n) => !n.read).length,
      }),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadNotificationCount: !notification.read
          ? state.unreadNotificationCount + 1
          : state.unreadNotificationCount,
      })),

    markNotificationAsRead: (notificationId) =>
      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        return {
          notifications: updatedNotifications,
          unreadNotificationCount: updatedNotifications.filter((n) => !n.read)
            .length,
        };
      }),

    removeNotification: (notificationId) =>
      set((state) => {
        const notification = state.notifications.find(
          (n) => n.id === notificationId
        );
        const updatedNotifications = state.notifications.filter(
          (n) => n.id !== notificationId
        );
        return {
          notifications: updatedNotifications,
          unreadNotificationCount:
            notification && !notification.read
              ? state.unreadNotificationCount - 1
              : state.unreadNotificationCount,
        };
      }),

    setNotificationPreferences: (preferences) => set({ preferences }),
    setNotificationPermission: (permissionGranted) =>
      set({ permissionGranted }),

    // UI actions
    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    setSelectedUsers: (selectedUsers) => set({ selectedUsers }),
    toggleUserSelection: (userId) =>
      set((state) => ({
        selectedUsers: state.selectedUsers.includes(userId)
          ? state.selectedUsers.filter((id) => id !== userId)
          : [...state.selectedUsers, userId],
      })),
    setShowUserSearch: (showUserSearch) => set({ showUserSearch }),
    setShowFriendRequests: (showFriendRequests) => set({ showFriendRequests }),
    setShowBlockedUsers: (showBlockedUsers) => set({ showBlockedUsers }),

    // Blocked user actions
    setBlockedUsers: (blockedUsers) => set({ blockedUsers }),

    addBlockedUser: (blockedUser) =>
      set((state) => ({
        blockedUsers: [...state.blockedUsers, blockedUser],
      })),

    removeBlockedUser: (userId) =>
      set((state) => ({
        blockedUsers: state.blockedUsers.filter(
          (blocked) => blocked.blocked_user.id !== userId
        ),
      })),

    blockUser: async (userId) => {
      set({ blockingUser: true });
      try {
        // TODO: Implement API call to block user
        // const response = await api.blockUser(userId);

        // For now, simulate the API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Add to blocked users list (mock data)
        const blockedUser: BlockedUser = {
          id: `blocked-${userId}-${Date.now()}`,
          blocked_user: {
            id: userId,
            name: "Blocked User",
            username: "blocked_user",
            email: "blocked@example.com",
          },
          blocked_at: new Date().toISOString(),
        };

        get().addBlockedUser(blockedUser);

        // Remove any conversations with this user
        set((state) => ({
          conversations: state.conversations.filter(
            (conv) =>
              conv.participant1.id !== userId && conv.participant2.id !== userId
          ),
        }));
      } catch (error) {
        console.error("Failed to block user:", error);
        throw error;
      } finally {
        set({ blockingUser: false });
      }
    },

    unblockUser: async (userId) => {
      set({ unblockingUser: true });
      try {
        // TODO: Implement API call to unblock user
        // const response = await api.unblockUser(userId);

        // For now, simulate the API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        get().removeBlockedUser(userId);
      } catch (error) {
        console.error("Failed to unblock user:", error);
        throw error;
      } finally {
        set({ unblockingUser: false });
      }
    },

    setLoadingBlockedUsers: (loadingBlockedUsers) =>
      set({ loadingBlockedUsers }),
    setBlockingUser: (blockingUser) => set({ blockingUser }),
    setUnblockingUser: (unblockingUser) => set({ unblockingUser }),

    isUserBlocked: (userId) => {
      const state = get();
      return state.blockedUsers.some(
        (blocked) => blocked.blocked_user.id === userId
      );
    },

    // Computed getters
    getActiveConversation: () => {
      const state = get();
      return (
        state.conversations.find(
          (conv) => conv.id === state.activeConversationId
        ) || null
      );
    },

    getConversationMessages: (conversationId) => {
      const state = get();
      return state.messagesByConversation[conversationId] || [];
    },

    getUnreadCount: () => {
      const state = get();
      return getTotalUnreadCount(state.conversations);
    },

    getConversationUnreadCount: (conversationId) => {
      const state = get();
      const conversation = state.conversations.find(
        (conv) => conv.id === conversationId
      );
      return conversation?.unread_count || 0;
    },

    getFilteredConversations: () => {
      const state = get();
      let filtered = state.conversations.filter((conv) =>
        state.showArchived ? conv.is_archived : !conv.is_archived
      );

      if (state.searchQuery && state.currentUserId) {
        filtered = searchConversations(
          filtered,
          state.searchQuery,
          state.currentUserId
        );
      }

      return filtered;
    },

    getUserPresence: (userId) => {
      const state = get();
      return state.userPresence[userId] || null;
    },

    isUserOnline: (userId) => {
      const state = get();
      return state.onlineUsers.has(userId);
    },

    getFriendshipStatusWithUser: (userId) => {
      const state = get();
      if (!state.currentUserId) return "not_friends";
      return getFriendshipStatus(
        state.currentUserId,
        userId,
        state.friendships,
        [...state.friendRequests, ...state.sentFriendRequests]
      );
    },

    canMessageUser: (userId) => {
      const state = get();
      if (!state.currentUserId)
        return { canSend: false, reason: "Not authenticated" };
      return canSendMessage(state.currentUserId, userId, state.friendships, []);
    },

    canCallUser: (userId) => {
      const state = get();
      if (!state.currentUserId)
        return { canCall: false, reason: "Not authenticated" };
      return canInitiateCall(
        state.currentUserId,
        userId,
        state.friendships,
        []
      );
    },

    getFriendsList: () => {
      const state = get();
      if (!state.currentUserId) return [];
      return state.friendships
        .filter(
          (friendship) =>
            friendship.user1.id === state.currentUserId ||
            friendship.user2.id === state.currentUserId
        )
        .map((friendship) =>
          friendship.user1.id === state.currentUserId
            ? friendship.user2
            : friendship.user1
        );
    },

    getPendingFriendRequests: () => {
      const state = get();
      return state.friendRequests.filter((req) => req.status === "pending");
    },

    getSentFriendRequests: () => {
      const state = get();
      return state.sentFriendRequests.filter((req) => req.status === "pending");
    },

    // Search integration
    startConversation: async (userId) => {
      const state = get();
      if (!state.currentUserId) return;

      // Check if conversation already exists
      const existingConversation = state.conversations.find(
        (conv) =>
          (conv.participant1.id === state.currentUserId &&
            conv.participant2.id === userId) ||
          (conv.participant1.id === userId &&
            conv.participant2.id === state.currentUserId)
      );

      if (existingConversation) {
        // Set as active conversation
        get().setActiveConversation(existingConversation.id);
        return;
      }

      try {
        // TODO: Implement API call to create conversation
        // const response = await api.createConversation(userId);

        // For now, create a mock conversation
        const newConversation: Conversation = {
          id: `conv-${state.currentUserId}-${userId}-${Date.now()}`,
          participant1: {
            id: state.currentUserId,
            name: "Current User",
            username: "current_user",
            email: "current@example.com",
          },
          participant2: {
            id: userId,
            name: "Other User",
            username: "other_user",
            email: "other@example.com",
          },
          last_message: null,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        get().addConversation(newConversation);
        get().setActiveConversation(newConversation.id);
      } catch (error) {
        console.error("Failed to start conversation:", error);
      }
    },

    // WebSocket message handler
    handleWebSocketMessage: (message) => {
      const state = get();

      switch (message.type) {
        case "message":
          if (message.payload?.message) {
            get().addMessage(message.payload.message);
          }
          break;

        case "typing_start":
          if (message.payload?.conversation_id && message.payload?.user_id) {
            get().addTypingUser(
              message.payload.conversation_id,
              message.payload.user_id
            );
          }
          break;

        case "typing_stop":
          if (message.payload?.conversation_id && message.payload?.user_id) {
            get().removeTypingUser(
              message.payload.conversation_id,
              message.payload.user_id
            );
          }
          break;

        case "presence_update":
          if (message.payload?.user_id && message.payload?.status) {
            get().setUserPresence(message.payload.user_id, {
              user_id: message.payload.user_id,
              status: message.payload.status,
              last_seen_at:
                message.payload.last_seen_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
          break;

        case "friend_request":
          if (message.payload?.friend_request) {
            get().addFriendRequest(message.payload.friend_request);
          }
          break;

        case "friend_request_accepted":
          if (message.payload?.friend_request_id) {
            get().updateFriendRequest(message.payload.friend_request_id, {
              status: "accepted",
              responded_at: new Date().toISOString(),
            });
          }
          break;

        case "friend_request_declined":
          if (message.payload?.friend_request_id) {
            get().removeFriendRequest(message.payload.friend_request_id);
          }
          break;

        case "message_read":
          if (message.payload?.conversation_id) {
            get().markMessagesAsRead(message.payload.conversation_id);
          }
          break;
      }
    },

    // Initialization
    initialize: (currentUserId) => set({ currentUserId }),

    reset: () => set(initialState),
  }))
);
