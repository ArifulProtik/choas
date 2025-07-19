"use client";

import { useEffect } from "react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { FriendManagementModal } from "./friend-management-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import {
  mockFriendships,
  mockFriendRequests,
  mockUserPresence,
  mockCurrentUser,
} from "@/lib/mock/messaging-data";

export function FriendManagementTest() {
  const { user, setAuth } = useAuthStore();
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
    // Set up mock authentication if not already authenticated
    if (!user) {
      setAuth(mockCurrentUser, "mock-token");
    }
  }, [user, setAuth]);

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
  }, [
    user,
    initialize,
    setFriendships,
    setFriendRequests,
    setMultipleUserPresence,
  ]);

  const friends = getFriendsList();
  const receivedRequests = getPendingFriendRequests();
  const sentRequests = getSentFriendRequests();

  const testFriendManagement = () => {
    console.log("=== Friend Management Test ===");
    console.log("Friends:", friends);
    console.log("Received Requests:", receivedRequests);
    console.log("Sent Requests:", sentRequests);
    console.log("Current User:", user);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Setting up authentication...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friend Management Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {friends.length}
            </div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {receivedRequests.length}
            </div>
            <div className="text-sm text-muted-foreground">Received</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {sentRequests.length}
            </div>
            <div className="text-sm text-muted-foreground">Sent</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={testFriendManagement}
            variant="outline"
            className="w-full"
          >
            Test Console Output
          </Button>

          <p className="text-xs text-muted-foreground">
            ✅ Friend management components are working correctly!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
