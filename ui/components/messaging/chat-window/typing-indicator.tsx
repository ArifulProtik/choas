"use client";

import React from "react";
import { TypingIndicatorProps } from "./types";

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  currentUserId,
}) => {
  const otherTypingUsers = typingUsers.filter(
    (userId) => userId !== currentUserId
  );

  if (otherTypingUsers.length === 0) return null;

  const getTypingText = () => {
    if (otherTypingUsers.length === 1) {
      return `Someone is typing...`;
    } else if (otherTypingUsers.length === 2) {
      return `2 people are typing...`;
    } else {
      return `Several people are typing...`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic flex items-center gap-2">
      <div className="flex gap-1">
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};
