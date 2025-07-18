"use client";

import React from "react";
import { Message } from "@/lib/schemas/messaging";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
  message: Message | null;
  isFromCurrentUser: boolean;
  isTyping?: boolean;
  typingUserName?: string;
  unreadCount: number;
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({
  message,
  isFromCurrentUser,
  isTyping = false,
  typingUserName,
  unreadCount,
}) => {
  if (isTyping && typingUserName) {
    return (
      <span className="text-blue-500 italic truncate">
        {typingUserName} is typing...
      </span>
    );
  }

  if (!message) {
    return <span className="text-muted-foreground">No messages yet</span>;
  }

  const senderName = isFromCurrentUser
    ? "You"
    : message.sender.name.split(" ")[0];

  let content = message.content;
  if (message.message_type === "call_start") {
    content = "📞 Call started";
  } else if (message.message_type === "call_end") {
    content = "📞 Call ended";
  }

  return (
    <span
      className={cn(
        "truncate",
        unreadCount > 0 && !isFromCurrentUser
          ? "font-medium text-foreground"
          : "text-muted-foreground"
      )}
    >
      {message.message_type === "text" && `${senderName}: `}
      {content}
    </span>
  );
};
