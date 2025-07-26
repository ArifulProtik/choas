"use client";

import React from "react";
import { MessageList } from "./message-list";
import { MessageListProps } from "./types";
import { useConversationMessages } from "@/lib/hooks/use-conversations";

interface EnhancedMessageListProps extends Partial<MessageListProps> {
  conversationId?: string;
  useQueryHook?: boolean;
}

export const EnhancedMessageList: React.FC<EnhancedMessageListProps> = ({
  // Props-based data (fallback)
  messages: propMessages,
  currentUserId: propCurrentUserId,
  isLoading: propIsLoading,
  isLoadingMore: propIsLoadingMore = false,
  hasMoreMessages: propHasMoreMessages = false,
  error: propError,
  typingUsers: propTypingUsers,
  otherUserName: propOtherUserName,
  onRetryMessage: propOnRetryMessage,
  onLoadMoreMessages: propOnLoadMoreMessages,
  scrollAreaRef,
  searchQuery,
  searchResults = [],
  currentSearchIndex = 0,
  // New props for TanStack Query integration
  conversationId,
  useQueryHook = false,
}) => {
  // Use TanStack Query hook if conversationId is provided and useQueryHook is true
  const queryResult = useConversationMessages(
    conversationId || "",
    useQueryHook && !!conversationId
  );

  // Determine data source (query hook vs props)
  const messages =
    useQueryHook && conversationId
      ? queryResult.data?.messages || []
      : propMessages || [];

  const isLoading =
    useQueryHook && conversationId
      ? queryResult.isLoading
      : propIsLoading || false;

  const isLoadingMore =
    useQueryHook && conversationId
      ? queryResult.isFetchingNextPage
      : propIsLoadingMore;

  const hasMoreMessages =
    useQueryHook && conversationId
      ? queryResult.hasNextPage
      : propHasMoreMessages;

  const error =
    useQueryHook && conversationId
      ? queryResult.error?.message || null
      : propError;

  const onLoadMoreMessages =
    useQueryHook && conversationId
      ? () => queryResult.fetchNextPage()
      : propOnLoadMoreMessages;

  // Use fallback values for required props
  const currentUserId = propCurrentUserId || "";
  const typingUsers = propTypingUsers || [];
  const otherUserName = propOtherUserName || "User";
  const onRetryMessage = propOnRetryMessage || (() => {});

  return (
    <MessageList
      messages={messages}
      currentUserId={currentUserId}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMoreMessages={hasMoreMessages}
      error={error}
      typingUsers={typingUsers}
      otherUserName={otherUserName}
      onRetryMessage={onRetryMessage}
      onLoadMoreMessages={onLoadMoreMessages}
      scrollAreaRef={scrollAreaRef}
      searchQuery={searchQuery}
      searchResults={searchResults}
      currentSearchIndex={currentSearchIndex}
    />
  );
};
