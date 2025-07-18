"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MessageSkeletonProps {
  isFromCurrentUser?: boolean;
  showAvatar?: boolean;
  className?: string;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  isFromCurrentUser = false,
  showAvatar = true,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex gap-3 animate-pulse",
        isFromCurrentUser ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* Avatar skeleton */}
      {showAvatar && !isFromCurrentUser && (
        <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
      )}

      {/* Message content skeleton */}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isFromCurrentUser ? "items-end" : "items-start"
        )}
      >
        {/* Sender name skeleton (only for received messages) */}
        {!isFromCurrentUser && showAvatar && (
          <div className="h-3 w-16 bg-muted rounded mb-1" />
        )}

        {/* Message bubble skeleton */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full",
            isFromCurrentUser ? "bg-muted/60" : "bg-muted/40"
          )}
        >
          <div className="h-4 bg-muted rounded w-32 mb-1" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>

        {/* Timestamp skeleton */}
        <div className="h-3 w-12 bg-muted rounded mt-1" />
      </div>
    </div>
  );
};

interface MessageListSkeletonProps {
  count?: number;
  className?: string;
}

export const MessageListSkeleton: React.FC<MessageListSkeletonProps> = ({
  count = 5,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton
          key={index}
          isFromCurrentUser={index % 3 === 0}
          showAvatar={index % 2 === 0}
        />
      ))}
    </div>
  );
};
