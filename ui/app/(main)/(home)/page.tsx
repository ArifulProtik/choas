"use client";

import { FriendList } from "@/components/friends/friend-list";
import { SearchBar } from "@/components/search";
import UserSearch from "@/components/search/global-user-search";
import { useAuthStore } from "@/components/store/auth-store";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useSearchStore } from "@/components/store/search-store";
import { useTitleBarStore } from "@/components/store/titlebar-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Mock data imports removed - now using real backend data
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
  const { setTitle } = useTitleBarStore();

  useEffect(() => {
    if (user) {
      // Initialize the messaging store with current user
      initialize(user.id);

      // Data will be loaded via TanStack Query hooks in the components
      // No more mock data initialization needed
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
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Friends</h1>
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
  return (
    <div className="flex flex-1">
      <div className="flex-1  border-r border">
        <HomePage />
      </div>
      <div className="w-80">{/* <UserSearch /> */}</div>
    </div>
  );
}
