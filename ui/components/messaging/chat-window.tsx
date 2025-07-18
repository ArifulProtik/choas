"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send } from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { ChatHeader } from "./chat-window/chat-header";
import { MessageList } from "./chat-window/message-list";
import { ChatInput } from "./chat-window/chat-input";
import { MessageSearch } from "./chat-window/message-search";
import { UserProfile } from "./user-profile";

import { getOtherParticipant } from "@/lib/utils/messaging-utils";
import { Message } from "@/lib/schemas/messaging";

export const ChatWindow: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const {
    getActiveConversation,
    getConversationMessages,
    getUserPresence,
    isUserOnline,
    typingUsers,
    addTypingUser,
    removeTypingUser,
    addMessage,
    canMessageUser,
    canCallUser,
    loadingMessages,
    loadingMoreMessages,
    hasMoreMessages,
    messageErrors,
  } = useMessagingStore();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultMessages, setSearchResultMessages] = useState<Message[]>(
    []
  );
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const conversation = getActiveConversation();
  const messages = conversation ? getConversationMessages(conversation.id) : [];
  const conversationTypingUsers = conversation
    ? typingUsers[conversation.id] || []
    : [];
  const isLoading = conversation
    ? loadingMessages[conversation.id] || false
    : false;
  const isLoadingMore = conversation
    ? loadingMoreMessages[conversation.id] || false
    : false;
  const hasMore = conversation
    ? hasMoreMessages[conversation.id] || false
    : false;
  const error = conversation ? messageErrors[conversation.id] : null;

  // Reset search when conversation changes
  useEffect(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResultMessages([]);
    setCurrentSearchIndex(0);
  }, [conversation?.id]);

  const handleSearchResults = useCallback(
    (results: Message[], currentIndex: number) => {
      setSearchResultMessages(results);
      setCurrentSearchIndex(currentIndex);
    },
    []
  );

  const handleToggleSearch = useCallback(() => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
      setSearchResultMessages([]);
      setCurrentSearchIndex(0);
    }
  }, [showSearch]);

  const handleToggleUserProfile = useCallback(() => {
    setShowUserProfile(!showUserProfile);
  }, [showUserProfile]);

  const handleSendMessage = (content: string) => {
    if (!conversation || !currentUser) return;

    // Check permissions
    const otherUser = getOtherParticipant(conversation, currentUser.id);
    const canSend = canMessageUser(otherUser.id);

    if (!canSend.canSend) {
      console.error("Cannot send message:", canSend.reason);
      return;
    }

    // Create optimistic message
    const newMessage: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: conversation.id,
      sender: currentUser,
      content,
      message_type: "text",
      status: "sending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addMessage(newMessage);

    // TODO: Send message via API/WebSocket
    console.log("Sending message:", content);
  };

  const handleTypingStart = () => {
    if (!conversation || !currentUser) return;
    addTypingUser(conversation.id, currentUser.id);
    // TODO: Send typing start via WebSocket
  };

  const handleTypingStop = () => {
    if (!conversation || !currentUser) return;
    removeTypingUser(conversation.id, currentUser.id);
    // TODO: Send typing stop via WebSocket
  };

  const handleRetryMessage = (messageId: string) => {
    // TODO: Implement message retry logic
    console.log("Retrying message:", messageId);
  };

  const handleLoadMoreMessages = () => {
    if (!conversation || isLoadingMore || !hasMore) return;

    // TODO: Implement API call to load more messages
    console.log("Loading more messages for conversation:", conversation.id);

    // For now, simulate loading more messages
    // In a real implementation, this would call an API endpoint
    // and update the store with older messages
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-muted-foreground">Please sign in to view messages</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-center p-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Send className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
        <p className="text-muted-foreground">
          Choose a conversation from the sidebar to start messaging
        </p>
      </div>
    );
  }

  const otherUser = getOtherParticipant(conversation, currentUser.id);
  const userPresence = getUserPresence(otherUser.id);
  const isOnline = isUserOnline(otherUser.id);
  const canSend = canMessageUser(otherUser.id);
  const canCall = canCallUser(otherUser.id);

  const handleCallClick = () => {
    // TODO: Implement call functionality
    console.log("Starting call with:", otherUser.name);
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat Header */}
        <div className="border-b border-border flex-shrink-0">
          <ChatHeader
            otherUser={otherUser}
            userPresence={userPresence}
            isOnline={isOnline}
            canCall={canCall}
            onCallClick={handleCallClick}
            onSearchClick={handleToggleSearch}
            onInfoClick={handleToggleUserProfile}
            showUserProfile={showUserProfile}
          />
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-shrink-0">
            <MessageSearch
              messages={messages}
              onSearchResults={handleSearchResults}
              onClose={handleToggleSearch}
              isVisible={showSearch}
            />
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 min-h-0">
          <MessageList
            messages={messages}
            currentUserId={currentUser.id}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMoreMessages={hasMore}
            error={error}
            typingUsers={conversationTypingUsers}
            otherUserName={otherUser.name}
            onRetryMessage={handleRetryMessage}
            onLoadMoreMessages={handleLoadMoreMessages}
            scrollAreaRef={scrollAreaRef}
            searchQuery={showSearch ? searchQuery : ""}
            searchResults={searchResultMessages}
            currentSearchIndex={currentSearchIndex}
          />
        </div>

        {/* Chat Input */}
        <div className="flex-shrink-0">
          {!canSend.canSend ? (
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-center py-3">
                <p className="text-sm text-muted-foreground">
                  {canSend.reason || "You cannot send messages to this user"}
                </p>
              </div>
            </div>
          ) : (
            <ChatInput
              conversationId={conversation.id}
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={isLoading}
              placeholder={`Message ${otherUser.name.split(" ")[0]}...`}
            />
          )}
        </div>
      </div>

      {/* User Profile Sidebar */}
      {showUserProfile && (
        <div className="w-96 flex-shrink-0 h-full border-l border-border">
          <UserProfile user={otherUser} onClose={handleToggleUserProfile} />
        </div>
      )}
    </div>
  );
};
