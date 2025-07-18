"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "./search-bar";
import { NavigationSection } from "./navigation-section";
import { ConversationItem } from "./conversation-list/conversation-item";
import { ConversationListHeader } from "./conversation-list/conversation-list-header";
import { UserSearchModal } from "./conversation-list/user-search-modal";
import { EmptyState } from "./shared/empty-state";
import { LoadingSpinner } from "./shared/loading-spinner";

export const ConversationList: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const {
    getFilteredConversations,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setConversationSearch,
    showArchived,
    getUnreadCount,
    showUserSearch,
    setShowUserSearch,
    loading,
    error,
  } = useMessagingStore();

  // Local state for navigation section
  const [activeSection, setActiveSection] = useState<string>("messages");

  const conversations = getFilteredConversations();
  const totalUnreadCount = getUnreadCount();

  const handleSelectUser = (userId: string) => {
    // This would typically create a new conversation or navigate to existing one
    // For now, we'll just close the modal
    console.log("Selected user:", userId);
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
      {/* Discord-style Search Bar */}
      <div className="p-4">
        <SearchBar
          placeholder="Find or start a conversation"
          value={searchQuery}
          onChange={setConversationSearch}
        />
      </div>

      {/* Navigation Section */}
      <NavigationSection
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Direct Messages Header */}
      <ConversationListHeader
        totalUnreadCount={totalUnreadCount}
        onStartConversation={() => setShowUserSearch(true)}
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
                onSelect={setActiveConversation}
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
    </div>
  );
};
