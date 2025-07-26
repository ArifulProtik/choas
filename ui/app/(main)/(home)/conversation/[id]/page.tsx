"use client";

import { ChatWindow } from "@/components/messaging/chat-window";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { setActiveConversation, activeConversationId } = useMessagingStore();

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  return (
    <div className="flex-1 h-full overflow-hidden">
      <ChatWindow />
    </div>
  );
}
