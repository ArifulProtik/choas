"use client";

import { useState } from "react";
import { FriendRequest } from "@/lib/schemas/messaging";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationBadge } from "@/components/shared/notification-badge";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Removed TanStack Query imports

export function FriendRequests() {
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  const {
    getPendingFriendRequests,
    getSentFriendRequests,
    updateFriendRequest,
    removeFriendRequest,
    addFriendship,
    currentUserId,
  } = useMessagingStore();

  const receivedRequests = getPendingFriendRequests();

  // For now, get sent requests from store (could be moved to a separate hook)
  const sentRequests = getSentFriendRequests();

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!currentUserId) return;

    setProcessingRequest(request.id);
    try {
      // Update the request status
      updateFriendRequest(request.id, {
        status: "accepted",
        responded_at: new Date().toISOString(),
      });

      // Add the friendship
      addFriendship({
        id: `friendship_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        user1: request.requester,
        user2: request.recipient,
        status: "accepted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Remove the request after a short delay to show the accepted state
      setTimeout(() => {
        removeFriendRequest(request.id);
      }, 1000);
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    setProcessingRequest(request.id);
    try {
      // Simply remove the request (decline)
      removeFriendRequest(request.id);
    } catch (error) {
      console.error("Failed to decline friend request:", error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCancelRequest = async (request: FriendRequest) => {
    setProcessingRequest(request.id);
    try {
      // For now, just remove from store - could be enhanced with API call
      // removeFriendRequest(request.id);
      toast.success("Friend request cancelled");
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
      toast.error("Failed to cancel friend request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="received" className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Received
          {receivedRequests.length > 0 && (
            <NotificationBadge count={receivedRequests.length} size="sm" />
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Sent
          {sentRequests.length > 0 && (
            <NotificationBadge
              count={sentRequests.length}
              size="sm"
              variant="secondary"
            />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load friend requests"}
            </p>
          </div>
        ) : receivedRequests.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="w-8 h-8" />}
            title="No friend requests"
            description="You don't have any pending friend requests"
          />
        ) : (
          <div className="space-y-3">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <UserAvatar user={request.requester} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {request.requester.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{request.requester.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(request.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request)}
                    disabled={processingRequest === request.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeclineRequest(request)}
                    disabled={processingRequest === request.id}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sent" className="mt-4">
        {sentRequests.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No sent requests"
            description="You haven't sent any friend requests yet"
          />
        ) : (
          <div className="space-y-3">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <UserAvatar user={request.recipient} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {request.recipient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{request.recipient.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatTimeAgo(request.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    Pending
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelRequest(request)}
                    disabled={processingRequest === request.id}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
