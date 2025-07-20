"use client";

import { FriendList } from "@/components/friends/friend-list";
import { SearchBar } from "@/components/search";
import { useAuthStore } from "@/components/store/auth-store";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useSearchStore } from "@/components/store/search-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockBlockedUsers,
  mockConversations,
  mockFriendRequests,
  mockFriendships,
  mockMessages,
  mockNotificationPreferences,
  mockNotifications,
  mockUserPresence,
} from "@/lib/mock/messaging-data";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function HomePage() {
  const { user } = useAuthStore();
  const {
    initialize,
    setConversations,
    setMessages,
    setHasMoreMessages,
    setFriendships,
    setFriendRequests,
    setMultipleUserPresence,
    setNotifications,
    setNotificationPreferences,
    setBlockedUsers,
    startConversation,
  } = useMessagingStore();

  const { addToRecentSearches } = useSearchStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Initialize the messaging store with current user
      initialize(user.id);

      // Load mock data
      setConversations(mockConversations);
      setFriendships(mockFriendships);
      setFriendRequests(mockFriendRequests);
      setNotifications(mockNotifications);
      setNotificationPreferences(mockNotificationPreferences);
      setBlockedUsers(mockBlockedUsers);

      // Set user presence
      const presenceMap = mockUserPresence.reduce((acc, presence) => {
        acc[presence.user_id] = presence;
        return acc;
      }, {} as Record<string, any>);
      setMultipleUserPresence(presenceMap);

      // Load messages for each conversation
      mockConversations.forEach((conversation) => {
        const conversationMessages = mockMessages.filter(
          (msg) => msg.conversation_id === conversation.id
        );
        if (conversationMessages.length > 0) {
          setMessages(conversation.id, conversationMessages);
          // Simulate having more messages for pagination testing
          setHasMoreMessages(conversation.id, conversationMessages.length > 10);
        }
      });
    }
  }, [user]);

  const handleUserSelect = (user: any) => {
    addToRecentSearches(user);
    startConversation(user.id);
  };

  const handleStartConversation = async (userId: string) => {
    const conversationId = await startConversation(userId);
    if (conversationId) {
      router.push(`/conversation/${conversationId}`);
    }
  };

  const handleStartCall = (userId: string) => {
    // TODO: Implement call functionality
    console.log("Starting call with user:", userId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Friends</h1>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Friend
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border px-4">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            <div className="p-4">
              <div className="mb-4">
                <SearchBar
                  placeholder="Search"
                  onUserSelect={handleUserSelect}
                  className="w-full"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <FriendList
                  onStartConversation={handleStartConversation}
                  onStartCall={handleStartCall}
                />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="online" className="mt-0">
            <div className="p-4">
              <div className="mb-4">
                <SearchBar
                  placeholder="Search"
                  onUserSelect={handleUserSelect}
                  className="w-full"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <FriendList
                  onStartConversation={handleStartConversation}
                  onStartCall={handleStartCall}
                  filterOnline={true}
                />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <div className="p-4">
              <div className="mb-4">
                <SearchBar
                  placeholder="Search"
                  onUserSelect={handleUserSelect}
                  className="w-full"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <FriendList
                  onStartConversation={handleStartConversation}
                  onStartCall={handleStartCall}
                  showAll={true}
                />
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Home() {
  return <HomePage />;
}
