"use client";

import { useEffect } from "react";

import { ConversationList } from "@/components/messaging/conversation-list";
import { ChatWindow } from "@/components/messaging/chat-window";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import {
  mockConversations,
  mockMessages,
  mockFriendships,
  mockFriendRequests,
  mockUserPresence,
  mockNotifications,
  mockNotificationPreferences,
} from "@/lib/mock/messaging-data";

function MessagingApp() {
  const { user } = useAuthStore();
  const {
    initialize,
    setConversations,
    setMessages,
    setHasMoreMessages,
    setFriendships,
    setFriendRequests,
    setMultipleUserPresence,
    setNotifications,
    setNotificationPreferences,
  } = useMessagingStore();

  useEffect(() => {
    if (user) {
      // Initialize the messaging store with current user
      initialize(user.id);

      // Load mock data
      setConversations(mockConversations);
      setFriendships(mockFriendships);
      setFriendRequests(mockFriendRequests);
      setNotifications(mockNotifications);
      setNotificationPreferences(mockNotificationPreferences);

      // Set user presence
      const presenceMap = mockUserPresence.reduce((acc, presence) => {
        acc[presence.user_id] = presence;
        return acc;
      }, {} as Record<string, any>);
      setMultipleUserPresence(presenceMap);

      // Load messages for each conversation
      mockConversations.forEach((conversation) => {
        const conversationMessages = mockMessages.filter(
          (msg) => msg.conversation_id === conversation.id
        );
        if (conversationMessages.length > 0) {
          setMessages(conversation.id, conversationMessages);
          // Simulate having more messages for pagination testing
          setHasMoreMessages(conversation.id, conversationMessages.length > 10);
        }
      });
    }
  }, [user]);

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border h-full">
        <ConversationList />
      </div>

      {/* Chat Window Container */}
      <div className="flex-1 h-full">
        <ChatWindow />
      </div>
    </div>
  );
}

export default function Home() {
  return <MessagingApp />;
}
