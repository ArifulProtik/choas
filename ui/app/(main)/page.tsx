"use client";

import { useEffect, useState } from "react";

import { ConversationList } from "@/components/messaging/conversation-list";
import { ChatWindow } from "@/components/messaging/chat-window";
import { UserProfile } from "@/components/messaging/user-profile";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, InfoIcon, User, Users } from "lucide-react";
import {
  mockConversations,
  mockMessages,
  mockFriendships,
  mockFriendRequests,
  mockUserPresence,
  mockNotifications,
  mockNotificationPreferences,
} from "@/lib/mock/messaging-data";
import { getOtherParticipant } from "@/lib/utils/messaging-utils";
import { cn } from "@/lib/utils";

function MessagingApp() {
  const { user } = useAuthStore();
  const {
    initialize,
    setConversations,
    setMessages,
    setFriendships,
    setFriendRequests,
    setMultipleUserPresence,
    setNotifications,
    setNotificationPreferences,
    getActiveConversation,
  } = useMessagingStore();

  const [showUserProfile, setShowUserProfile] = useState(false);
  const activeConversation = getActiveConversation();
  const profileUser =
    activeConversation && user
      ? getOtherParticipant(activeConversation, user.id)
      : null;

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
        }
      });
    }
  }, [
    user,
    initialize,
    setConversations,
    setMessages,
    setFriendships,
    setFriendRequests,
    setMultipleUserPresence,
    setNotifications,
    setNotificationPreferences,
  ]);

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border h-full">
        <ConversationList />
      </div>

      {/* Chat Window Container */}
      <div className="flex-1 relative flex h-full">
        {/* Chat Window */}
        <div className="flex-1 relative h-full">
          <div className="h-full w-full">
            <ChatWindow />
          </div>

          {/* User Profile Toggle Button */}
          {activeConversation && (
            <Button
              size={"icon"}
              variant={"ghost"}
              onClick={() => setShowUserProfile(!showUserProfile)}
              className={cn(
                "absolute top-4 right-4 z-10 transition-colors size-10",
                showUserProfile && "bg-accent"
              )}
            >
              <InfoIcon className="size-5" />
            </Button>
          )}
        </div>

        {/* User Profile Sidebar */}
        {showUserProfile && profileUser && (
          <div className="w-96 flex-shrink-0 h-full">
            <div className="h-full w-full">
              <UserProfile
                user={profileUser}
                onClose={() => setShowUserProfile(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return <MessagingApp />;
}
