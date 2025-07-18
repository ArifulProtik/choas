"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Phone,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  formatMessageTime,
  getOtherParticipant,
  getStatusColor,
  getStatusText,
  isMessageFromCurrentUser,
  formatLastSeen,
} from "@/lib/utils/messaging-utils";
import { Message, MessageStatus } from "@/lib/schemas/messaging";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  isFromCurrentUser: boolean;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  onRetry?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFromCurrentUser,
  showAvatar = true,
  onRetry,
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

    return (
      <span className="whitespace-pre-wrap break-words">{message.content}</span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isFromCurrentUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {showAvatar && !isFromCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={message.sender.avatar_url}
            alt={message.sender.name}
          />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
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
            {formatMessageTime(message.created_at)}
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

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | undefined>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = window.setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage("");

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTypingStop();
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Focus input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t border-border"
    >
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20 resize-none"
          maxLength={2000}
        />

        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            disabled={disabled}
          >
            <Smile className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={!message.trim() || disabled}
        className="h-10 w-10 p-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  currentUserId,
}) => {
  const { getUserPresence } = useMessagingStore();

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
    messageErrors,
  } = useMessagingStore();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const conversation = getActiveConversation();
  const messages = conversation ? getConversationMessages(conversation.id) : [];
  const conversationTypingUsers = conversation
    ? typingUsers[conversation.id] || []
    : [];
  const isLoading = conversation
    ? loadingMessages[conversation.id] || false
    : false;
  const error = conversation ? messageErrors[conversation.id] : null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages.length, conversationTypingUsers.length]);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(otherUser.name)}
              </AvatarFallback>
            </Avatar>

            {/* Online status indicator */}
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                getStatusColor(userPresence?.status || "offline")
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{otherUser.name}</h2>
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? getStatusText(userPresence?.status || "online")
                : userPresence?.last_seen_at
                ? `Last seen ${formatLastSeen(userPresence.last_seen_at)}`
                : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            disabled={!canCall.canCall}
          >
            <Phone className="h-4 w-4" />
          </Button>

          <Button
            disabled
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
          ></Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <p className="text-destructive text-sm">{error}</p>
            </Card>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Start the conversation</h3>
            <p className="text-sm text-muted-foreground">
              Send a message to {otherUser.name.split(" ")[0]} to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showAvatar =
                !prevMessage ||
                prevMessage.sender.id !== message.sender.id ||
                new Date(message.created_at).getTime() -
                  new Date(prevMessage.created_at).getTime() >
                  5 * 60 * 1000; // 5 minutes

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isFromCurrentUser={isMessageFromCurrentUser(
                    message,
                    currentUser.id
                  )}
                  showAvatar={showAvatar}
                  onRetry={handleRetryMessage}
                />
              );
            })}

            {/* Typing Indicator */}
            <TypingIndicator
              typingUsers={conversationTypingUsers}
              currentUserId={currentUser.id}
            />
          </div>
        )}
      </ScrollArea>

      {/* Chat Input */}
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
  );
};
