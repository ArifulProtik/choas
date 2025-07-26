"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageItem } from "./message-item";
import { TypingIndicator } from "./typing-indicator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageListSkeleton } from "@/components/shared/message-skeleton";
import { Message } from "@/lib/schemas/messaging";
import { isMessageFromCurrentUser } from "@/lib/utils/messaging-utils";
import { MessageListProps } from "./types";

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isLoading,
  isLoadingMore = false,
  hasMoreMessages = false,
  error,
  typingUsers,
  otherUserName,
  onRetryMessage,
  onLoadMoreMessages,
  scrollAreaRef,
  searchQuery,
  searchResults = [],
  currentSearchIndex = 0,
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef<number>(0);
  const shouldMaintainScroll = useRef<boolean>(false);
  const isInitialLoad = useRef<boolean>(true);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (
      !loadMoreRef.current ||
      !onLoadMoreMessages ||
      !hasMoreMessages ||
      isLoadingMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          shouldMaintainScroll.current = true;
          onLoadMoreMessages();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "20px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMoreMessages, hasMoreMessages, isLoadingMore]);

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (!scrollAreaRef.current || !shouldMaintainScroll.current) return;

    const scrollElement = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    if (scrollElement && lastScrollHeight.current > 0) {
      const newScrollHeight = scrollElement.scrollHeight;
      const scrollDiff = newScrollHeight - lastScrollHeight.current;
      scrollElement.scrollTop = scrollElement.scrollTop + scrollDiff;
      shouldMaintainScroll.current = false;
    }
  }, [messages.length]);

  // Auto-scroll to bottom on initial load and new messages
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const scrollElement = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    if (scrollElement) {
      const previousScrollHeight = lastScrollHeight.current;
      const currentScrollHeight = scrollElement.scrollHeight;

      // Update last scroll height
      lastScrollHeight.current = currentScrollHeight;

      // Auto-scroll to bottom on initial load
      if (isInitialLoad.current) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
          isInitialLoad.current = false;
        }, 0);
        return;
      }

      // Don't auto-scroll when loading more messages (maintain scroll position)
      if (shouldMaintainScroll.current) {
        return;
      }

      // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
      if (
        previousScrollHeight > 0 &&
        currentScrollHeight > previousScrollHeight
      ) {
        const isNearBottom =
          scrollElement.scrollTop + scrollElement.clientHeight >=
          previousScrollHeight - 100; // 100px threshold

        if (isNearBottom) {
          setTimeout(() => {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }, 0);
        }
      }
    }
  }, [messages.length]);

  // Initial scroll to bottom when component mounts
  useEffect(() => {
    if (!scrollAreaRef.current || messages.length === 0) return;

    const scrollElement = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    if (scrollElement) {
      // Scroll to bottom on mount
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 100);
    }
  }, []); // Empty dependency array - only run on mount

  // Scroll to highlighted search result
  useEffect(() => {
    if (searchResults.length > 0 && currentSearchIndex >= 0) {
      const targetMessage = searchResults[currentSearchIndex];
      if (targetMessage) {
        const messageElement = document.getElementById(
          `message-${targetMessage.id}`
        );
        if (messageElement) {
          messageElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  }, [searchResults, currentSearchIndex]);

  const handleLoadMore = useCallback(() => {
    if (onLoadMoreMessages && hasMoreMessages && !isLoadingMore) {
      shouldMaintainScroll.current = true;
      onLoadMoreMessages();
    }
  }, [onLoadMoreMessages, hasMoreMessages, isLoadingMore]);

  if (isLoading) {
    return (
      <ScrollArea ref={scrollAreaRef} className="h-full w-full">
        <div className="p-4">
          <MessageListSkeleton count={8} />
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <ScrollArea ref={scrollAreaRef} className="h-full w-full">
        <div className="p-4 flex items-center justify-center py-8">
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  if (messages.length === 0) {
    return (
      <ScrollArea ref={scrollAreaRef} className="h-full w-full">
        <div className="p-4 h-full flex items-center justify-center">
          <EmptyState
            icon={<Send className="h-8 w-8 text-muted-foreground" />}
            title="Start the conversation"
            description={`Send a message to ${
              otherUserName.split(" ")[0]
            } to get started`}
          />
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full w-full">
      <div className="p-4 space-y-4">
        {/* Load more messages trigger */}
        {hasMoreMessages && (
          <div ref={loadMoreRef} className="flex justify-center py-2">
            {isLoadingMore ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                className="text-muted-foreground hover:text-foreground"
              >
                Load older messages
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];

          // Show avatar logic
          const showAvatar =
            !prevMessage ||
            prevMessage.sender.id !== message.sender.id ||
            new Date(message.created_at).getTime() -
              new Date(prevMessage.created_at).getTime() >
              5 * 60 * 1000; // 5 minutes

          // Show detailed timestamp for first message of the day or after long gaps
          const showTimestamp =
            !prevMessage ||
            new Date(message.created_at).toDateString() !==
              new Date(prevMessage.created_at).toDateString() ||
            new Date(message.created_at).getTime() -
              new Date(prevMessage.created_at).getTime() >
              60 * 60 * 1000; // 1 hour

          // Check if this message is highlighted in search
          const isHighlighted =
            searchResults.length > 0 &&
            currentSearchIndex >= 0 &&
            searchResults[currentSearchIndex]?.id === message.id;

          return (
            <React.Fragment key={message.id}>
              {/* Date separator */}
              {showTimestamp && (
                <div className="flex items-center justify-center py-2">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleDateString([], {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}

              <MessageItem
                message={message}
                isFromCurrentUser={isMessageFromCurrentUser(
                  message,
                  currentUserId
                )}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                onRetry={onRetryMessage}
                searchQuery={searchQuery}
                isHighlighted={isHighlighted}
              />
            </React.Fragment>
          );
        })}

        {/* Typing Indicator */}
        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={currentUserId}
        />
      </div>
    </ScrollArea>
  );
};
