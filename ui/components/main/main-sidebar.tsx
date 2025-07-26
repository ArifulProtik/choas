"use client";

import { useAuthStore } from "@/components/store/auth-store";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getOtherParticipant } from "@/lib/utils/messaging-utils";
import { Headphones, Plus, Search } from "lucide-react";
import Link from "next/link";

// Server data removed - this app focuses on private messaging, not servers

const MainSidebar = () => {
  const { user } = useAuthStore();
  const {
    conversations,
    getUnreadCount,
    setActiveConversation,
    markMessagesAsRead,
  } = useMessagingStore();

  // Get conversations with unread messages for DM notifications
  const unseenConversations = conversations.filter(
    (conv) => conv.unread_count > 0
  );
  const totalDMUnread = getUnreadCount();

  const handleDMClick = (conversationId: string) => {
    // Mark messages as read when clicking on DM notification
    markMessagesAsRead(conversationId);
    setActiveConversation(conversationId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getServerInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col w-20 bg-background border-r border-border">
      {/* Home/DM Button */}
      <div className="p-3">
        <Link href="/" className="block">
          <div className="relative group">
            <div
              className={cn(
                "flex justify-center items-center h-12 w-12 rounded-2xl transition-all duration-200 mx-auto",
                "bg-primary text-primary-foreground hover:rounded-xl",
                "group-hover:bg-primary/90"
              )}
            >
              <Headphones size={24} />
            </div>

            {/* DM notification badge */}
            {totalDMUnread > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs font-bold"
              >
                {totalDMUnread > 99 ? "99+" : totalDMUnread}
              </Badge>
            )}
          </div>
        </Link>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-border mb-2" />

      {/* Unseen DMs Section - At Top */}
      {unseenConversations.length > 0 && (
        <div className="px-3 pb-2">
          <div className="space-y-2">
            {unseenConversations.slice(0, 3).map((conversation) => {
              if (!user || !conversation) return null;

              const otherUser = getOtherParticipant(conversation, user.id);
              if (!otherUser) return null;

              return (
                <div key={conversation.id} className="relative group">
                  <button
                    onClick={() => handleDMClick(conversation.id)}
                    className="block w-full"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 rounded-2xl transition-all duration-200 group-hover:rounded-xl mx-auto">
                        <AvatarImage
                          src={otherUser.avatar_url}
                          alt={otherUser.name}
                        />
                        <AvatarFallback className="rounded-2xl group-hover:rounded-xl bg-primary/10 text-primary font-medium text-xs">
                          {getInitials(otherUser.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Unread count badge */}
                      <Badge
                        variant="destructive"
                        className="absolute -bottom-1 -right-1 h-4 min-w-4 px-1 text-xs font-bold"
                      >
                        {(conversation.unread_count || 0) > 99
                          ? "99+"
                          : conversation.unread_count || 0}
                      </Badge>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Show more indicator if there are more unseen conversations */}
            {unseenConversations.length > 3 && (
              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  +{unseenConversations.length - 3} more
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Separator between DMs and Servers */}
      {unseenConversations.length > 0 && (
        <div className="mx-4 h-px bg-border mb-2" />
      )}

      {/* Server list removed - this app focuses on private messaging */}
      <div className="flex-1 px-3">
        <div className="space-y-2">
          {/* Server functionality removed for private messaging focus */}
        </div>
      </div>

      {/* Search Button */}
      <div className="p-3">
        <Link href="/search" className="block">
          <div className="relative group">
            <div
              className={cn(
                "flex justify-center items-center h-12 w-12 rounded-2xl transition-all duration-200 mx-auto",
                "bg-muted text-muted-foreground hover:bg-purple-600 hover:text-white group-hover:rounded-xl"
              )}
            >
              <Search size={20} />
            </div>
          </div>
        </Link>
      </div>

      {/* Add Server Button */}
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 rounded-2xl hover:rounded-xl transition-all duration-200 mx-auto p-0 hover:bg-green-600 hover:text-white"
        >
          <Plus size={20} />
        </Button>
      </div>
    </div>
  );
};

export default MainSidebar;
