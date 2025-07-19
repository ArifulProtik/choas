"use client";

import { useEffect, useState } from "react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { FriendList } from "@/components/friends/friend-list";
import { FriendRequests } from "@/components/friends/friend-requests";
import { FriendManagementDemo } from "@/components/messaging/friend-management-demo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import {
  mockFriendships,
  mockFriendRequests,
  mockUserPresence,
} from "@/lib/mock/messaging-data";

export default function FriendsPage() {
  const { user } = useAuthStore();
  const {
    initialize,
    setFriendships,
    setFriendRequests,
    setMultipleUserPresence,
    getFriendsList,
    getPendingFriendRequests,
    getSentFriendRequests,
  } = useMessagingStore();

  useEffect(() => {
    if (user) {
      // Initialize the messaging store with current user
      initialize(user.id);

      // Load mock data
      setFriendships(mockFriendships);
      setFriendRequests(mockFriendRequests);

      // Set user presence
      const presenceMap = mockUserPresence.reduce((acc, presence) => {
        acc[presence.user_id] = presence;
        return acc;
      }, {} as Record<string, any>);
      setMultipleUserPresence(presenceMap);
    }
  }, [user]);

  const friends = getFriendsList();
  const receivedRequests = getPendingFriendRequests();
  const sentRequests = getSentFriendRequests();

  const handleStartConversation = (userId: string) => {
    console.log("Start conversation with:", userId);
    // In a real app, this would navigate to the conversation
  };

  const handleStartCall = (userId: string) => {
    console.log("Start call with:", userId);
    // In a real app, this would initiate a call
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view friends</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">
          Manage your friends and friend requests
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Friends Management */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Friends & Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="friends"
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Friends
                    {friends.length > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {friends.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="requests"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Requests
                    {receivedRequests.length + sentRequests.length > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {receivedRequests.length + sentRequests.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="mt-6">
                  <FriendList
                    onStartConversation={handleStartConversation}
                    onStartCall={handleStartCall}
                  />
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                  <FriendRequests />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
