"use client";

import React from "react";
import { ChatWindow } from "./chat-window";
import { ConversationList } from "./conversation-list";

export const ChatLayout: React.FC = () => {
  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border h-full">
        <ConversationList />
      </div>

      {/* Chat Window Container */}
      <div className="flex-1 h-full flex">
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};
