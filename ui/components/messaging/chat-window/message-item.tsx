"use client";

import React from "react";
import { Phone, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { MessageStatus } from "@/lib/schemas/messaging";
import { formatMessageTime } from "@/lib/utils/messaging-utils";
import { cn } from "@/lib/utils";
import { MessageItemProps } from "./types";

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFromCurrentUser,
  showAvatar = true,
  showTimestamp = false,
  onRetry,
  searchQuery,
  isHighlighted = false,
}) => {
  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const highlightSearchQuery = (text: string, query?: string) => {
    if (!query || !query.trim()) {
      return <span className="whitespace-pre-wrap break-words">{text}</span>;
    }

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return (
      <span className="whitespace-pre-wrap break-words">
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-800 rounded px-1"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getMessageContent = () => {
    if (message.message_type === "call_start") {
      return (
        <div className="flex items-center gap-2 text-muted-foreground italic">
          <Phone className="h-4 w-4" />
          <span>Call started</span>
        </div>
      );
    }

    if (message.message_type === "call_end") {
      return (
        <div className="flex items-center gap-2 text-muted-foreground italic">
          <Phone className="h-4 w-4" />
          <span>{message.content}</span>
        </div>
      );
    }

    return highlightSearchQuery(message.content, searchQuery);
  };

  const formatDetailedTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 group scroll-mt-4",
        isFromCurrentUser ? "flex-row-reverse" : "flex-row",
        isHighlighted &&
          "bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 -m-2"
      )}
      id={`message-${message.id}`}
    >
      {/* Avatar */}
      {showAvatar && !isFromCurrentUser && (
        <UserAvatar user={message.sender} size="sm" className="flex-shrink-0" />
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isFromCurrentUser ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (only for received messages) */}
        {!isFromCurrentUser && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.sender.name}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full",
            isFromCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted",
            message.message_type !== "text" &&
              "bg-muted/50 border border-border"
          )}
        >
          {getMessageContent()}
        </div>

        {/* Message metadata */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1 px-1",
            isFromCurrentUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-xs text-muted-foreground">
            {showTimestamp
              ? formatDetailedTimestamp(message.created_at)
              : formatMessageTime(message.created_at)}
          </span>

          {/* Status icon for sent messages */}
          {isFromCurrentUser && (
            <div className="flex items-center">
              {getStatusIcon(message.status)}
              {message.status === "failed" && onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1 text-xs text-destructive hover:text-destructive"
                  onClick={() => onRetry(message.id)}
                >
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
