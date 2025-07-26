"use client";

import React from "react";
import { ChatInput } from "./chat-input";
import { ChatInputProps } from "./types";

interface EnhancedChatInputProps extends Partial<ChatInputProps> {
  useQueryHook?: boolean;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  conversationId,
  onSendMessage: propOnSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
  useQueryHook = false,
}) => {
  return (
    <ChatInput
      conversationId={conversationId}
      onSendMessage={propOnSendMessage}
      onTypingStart={onTypingStart}
      onTypingStop={onTypingStop}
      disabled={disabled}
      placeholder={placeholder}
      useQueryHook={useQueryHook}
    />
  );
};
