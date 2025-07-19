"use client";

import React, { useState } from "react";
import { Archive } from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  formatMessageTime,
  getOtherParticipant,
  getStatusColor,
  getStatusText,
} from "@/lib/utils/messaging-utils";
import { Conversation } from "@/lib/schemas/messaging";
import { ConversationActions } from "./conversation-actions";
import { cn } from "@/lib/utils";

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  currentUserId,
  onSelect,
}) => {
  const [showActions, setShowActions] = useState(false);
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
        "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/50 border-b border-border/50 group",
        isActive && "bg-accent"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
          <div className="flex items-center gap-2">
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
            {conversation.is_archived && (
              <Archive className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showActions && (
              <div onClick={(e) => e.stopPropagation()}>
                <ConversationActions
                  conversation={conversation}
                  currentUserId={currentUserId}
                />
              </div>
            )}
            {!showActions && conversation.last_message && (
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(conversation.last_message_at)}
              </span>
            )}
            {!showActions && conversation.unread_count > 0 && (
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
