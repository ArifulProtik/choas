"use client";

import { SearchBar } from "@/components/search";
import { EmptyState, LoadingSpinner } from "@/components/shared";
import { useAuthStore } from "@/components/store/auth-store";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useSearchStore } from "@/components/store/search-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import React, { useState } from "react";
import { BlockedUsersModal } from "./blocked-users-modal";
import { ConversationItem } from "./conversation-list/conversation-item";
import { ConversationListHeader } from "./conversation-list/conversation-list-header";
import { UserSearchModal } from "./conversation-list/user-search-modal";
import { NavigationSection } from "./navigation-section";

export const ConversationList: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const {
    getFilteredConversations,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setConversationSearch,
    showArchived,
    toggleShowArchived,
    getUnreadCount,
    showUserSearch,
    setShowUserSearch,
    showBlockedUsers,
    setShowBlockedUsers,
    loading,
    error,
    startConversation,
  } = useMessagingStore();

  const { addToRecentSearches } = useSearchStore();

  // Local state for navigation section
  const [activeSection, setActiveSection] = useState<string>("messages");

  const router = useRouter();
  const pathname = usePathname();
  const conversations = getFilteredConversations();
  const totalUnreadCount = getUnreadCount();

  // Check if we're on the home route (friends page)
  const isOnHomePage = pathname === "/";

  // Navigation items for the conversation list
  const navigationItems = [
    {
      id: "friends",
      label: "Friends",
      icon: Users,
      onClick: () => {
        router.push("/");
      },
      isActive: isOnHomePage,
    },
  ];

  const handleSelectUser = async (userId: string) => {
    const conversationId = await startConversation(userId);
    setShowUserSearch(false);
    if (conversationId) {
      router.push(`/conversation/${conversationId}`);
    }
  };

  const handleUserSelectFromSearch = async (user: any) => {
    addToRecentSearches(user);
    const conversationId = await startConversation(user.id);
    if (conversationId) {
      router.push(`/conversation/${conversationId}`);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversation(conversationId);
    router.push(`/conversation/${conversationId}`);
  };

  const handleArchiveConversation = (conversationId: string) => {
    // Implementation would go here
    console.log("Archive conversation:", conversationId);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Please sign in to view conversations
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Global Search Bar */}
      <div className="p-4">
        <SearchBar
          placeholder="Find or start a conversation"
          onUserSelect={handleUserSelectFromSearch}
          className="w-full"
        />
      </div>

      {/* Navigation Section */}
      <NavigationSection
        items={navigationItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Direct Messages Header */}
      <ConversationListHeader
        totalUnreadCount={totalUnreadCount}
        onStartConversation={() => setShowUserSearch(true)}
        onShowBlockedUsers={() => setShowBlockedUsers(true)}
        onToggleArchived={toggleShowArchived}
        showArchived={showArchived}
      />

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            title={
              showArchived
                ? "No archived conversations"
                : "No conversations yet"
            }
            description={
              showArchived
                ? "Your archived conversations will appear here"
                : "Start a conversation with your friends"
            }
            action={
              !showArchived
                ? {
                    label: "Start Conversation",
                    onClick: () => setShowUserSearch(true),
                  }
                : undefined
            }
          />
        ) : (
          <div>
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                currentUserId={currentUser.id}
                onSelect={handleConversationSelect}
                onArchive={handleArchiveConversation}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUser={handleSelectUser}
      />

      {/* Blocked Users Modal */}
      <BlockedUsersModal
        isOpen={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
      />
    </div>
  );
};
