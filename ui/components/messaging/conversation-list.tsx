"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Archive, Users, UserPlus } from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { SearchBar } from "./search-bar";
import { NavigationSection } from "./navigation-section";
import {
  formatMessageTime,
  getOtherParticipant,
  getStatusColor,
  getStatusText,
} from "@/lib/utils/messaging-utils";
import { Conversation } from "@/lib/schemas/messaging";
import { cn } from "@/lib/utils";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isActive,
  currentUserId,
  onSelect,
}) => {
  const otherUser = getOtherParticipant(conversation, currentUserId);
  const { getUserPresence, isUserOnline, typingUsers } = useMessagingStore();

  const userPresence = getUserPresence(otherUser.id);
  const isOnline = isUserOnline(otherUser.id);
  const isTyping =
    typingUsers[conversation.id]?.includes(otherUser.id) || false;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="text-blue-500 italic">
          {otherUser.name.split(" ")[0]} is typing...
        </span>
      );
    }

    if (!conversation.last_message) {
      return <span className="text-muted-foreground">No messages yet</span>;
    }

    const { last_message } = conversation;
    const isFromCurrentUser = last_message.sender.id === currentUserId;
    const senderName = isFromCurrentUser
      ? "You"
      : last_message.sender.name.split(" ")[0];

    let content = last_message.content;
    if (last_message.message_type === "call_start") {
      content = "📞 Call started";
    } else if (last_message.message_type === "call_end") {
      content = "📞 Call ended";
    }

    return (
      <span
        className={cn(
          "truncate",
          conversation.unread_count > 0 && !isFromCurrentUser
            ? "font-medium text-foreground"
            : "text-muted-foreground"
        )}
      >
        {last_message.message_type === "text" && `${senderName}: `}
        {content}
      </span>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/50 border-b border-border/50",
        isActive && "bg-accent"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(otherUser.name)}
          </AvatarFallback>
        </Avatar>

        {/* Online status indicator */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
            getStatusColor(userPresence?.status || "offline")
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3
            className={cn(
              "font-medium truncate",
              conversation.unread_count > 0
                ? "text-foreground"
                : "text-foreground/90"
            )}
          >
            {otherUser.name}
          </h3>

          <div className="flex items-center gap-2 flex-shrink-0">
            {conversation.last_message && (
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(conversation.last_message_at)}
              </span>
            )}
            {conversation.unread_count > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                {conversation.unread_count > 99
                  ? "99+"
                  : conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 text-sm">
            {getLastMessagePreview()}
          </div>

          {isOnline && !isTyping && (
            <span className="text-xs text-green-500 font-medium ml-2">
              {getStatusText(userPresence?.status || "offline")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { getFriendsList, getFriendshipStatusWithUser } = useMessagingStore();

  const friends = getFriendsList();
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;

    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) ||
        friend.username.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Start a Conversation</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="max-h-64">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No friends found" : "No friends yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => {
                    onSelectUser(friend.id);
                    onClose();
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={friend.avatar_url} alt={friend.name} />
                    <AvatarFallback className="text-xs">
                      {friend.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{friend.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{friend.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

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
    setShowFriendRequests,
    getPendingFriendRequests,
    loading,
    error,
  } = useMessagingStore();

  // Local state for navigation section
  const [activeSection, setActiveSection] = useState<string>("messages");

  const conversations = getFilteredConversations();
  const totalUnreadCount = getUnreadCount();
  const pendingFriendRequests = getPendingFriendRequests();

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
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Direct Messages
            </h2>
            {totalUnreadCount > 0 && (
              <Badge variant="default" className="h-4 min-w-4 px-1 text-xs">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserSearch(true)}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {showArchived
                ? "No archived conversations"
                : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {showArchived
                ? "Your archived conversations will appear here"
                : "Start a conversation with your friends"}
            </p>
            {!showArchived && (
              <Button onClick={() => setShowUserSearch(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
            )}
          </div>
        ) : (
          <div>
            {conversations.map((conversation) => (
              <ConversationListItem
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
