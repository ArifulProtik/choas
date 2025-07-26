import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendsApiService } from "../api/friends";
import { User } from "../schemas/user";
import { useMessagingStore } from "@/components/store/messaging-store";
import { toast } from "sonner";

// Backend response types matching actual Go implementation
interface BackendFriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  requester?: User; // Populated with .WithRequester()
}

// Query keys
const friendsKeys = {
  all: ["friends"] as const,
  lists: () => [...friendsKeys.all, "list"] as const,
  list: () => [...friendsKeys.lists()] as const,
  requests: () => [...friendsKeys.all, "requests"] as const,
  search: (query: string) => [...friendsKeys.all, "search", query] as const,
};

/**
 * Hook to get user's friends list
 */
export const useFriends = () => {
  const messagingStore = useMessagingStore();

  const query = useQuery({
    queryKey: friendsKeys.list(),
    queryFn: FriendsApiService.getFriends,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update MessagingStore when data changes
  useEffect(() => {
    if (query.data && messagingStore.currentUserId) {
      const friendships = query.data.map((friend) => ({
        id: `friendship-${messagingStore.currentUserId}-${friend.id}`,
        user1: {
          id: messagingStore.currentUserId!,
          name: "Current User",
          username: "current_user",
          email: "current@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        user2: friend,
        status: "accepted" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      messagingStore.setFriendships(friendships);
    }
  }, [query.data, messagingStore]);

  return query;
};

/**
 * Hook to get pending friend requests
 */
export const useFriendRequests = () => {
  const messagingStore = useMessagingStore();

  const query = useQuery({
    queryKey: friendsKeys.requests(),
    queryFn: FriendsApiService.getPendingRequests,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update MessagingStore when data changes
  useEffect(() => {
    if (query.data && messagingStore.currentUserId) {
      const transformedRequests = query.data.map((request) => ({
        id: request.id,
        requester: request.requester!,
        recipient: {
          id: messagingStore.currentUserId!,
          name: "Current User",
          username: "current_user",
          email: "current@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        status: request.status as "pending" | "accepted" | "declined",
        created_at: request.created_at,
        updated_at: request.updated_at,
      }));
      messagingStore.setFriendRequests(transformedRequests);
    }
  }, [query.data, messagingStore]);

  return query;
};

/**
 * Hook to search friends
 */
export const useSearchFriends = (query: string, enabled = true) => {
  return useQuery({
    queryKey: friendsKeys.search(query),
    queryFn: () => FriendsApiService.searchFriends(query),
    enabled: enabled && query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook for friend actions (send, accept, decline, remove)
 */
export const useFriendActions = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  const sendFriendRequest = useMutation({
    mutationFn: FriendsApiService.sendFriendRequest,
    onSuccess: (_, addresseeId) => {
      toast.success("Friend request sent successfully");

      // Optimistically update sent requests in store
      const newRequest = {
        id: `temp-${Date.now()}`,
        requester: {
          id: messagingStore.currentUserId!,
          name: "Current User",
          username: "current_user",
          email: "current@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        recipient: {
          id: addresseeId,
          name: "Unknown User",
          username: "unknown_user",
          email: "unknown@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        status: "pending" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      messagingStore.addFriendRequest(newRequest);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to send friend request";
      toast.error(message);
    },
  });

  const acceptFriendRequest = useMutation({
    mutationFn: FriendsApiService.acceptFriendRequest,
    onSuccess: (_, requesterId) => {
      toast.success("Friend request accepted");

      // Remove from friend requests and add to friends
      const request = messagingStore.friendRequests.find(
        (req) => req.requester.id === requesterId
      );

      if (request) {
        messagingStore.removeFriendRequest(request.id);

        // Add to friendships
        const newFriendship = {
          id: `friendship-${messagingStore.currentUserId}-${requesterId}`,
          user1: {
            id: messagingStore.currentUserId!,
            name: "Current User",
            username: "current_user",
            email: "current@example.com",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          user2: request.requester,
          status: "accepted" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        messagingStore.addFriendship(newFriendship);
      }

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: friendsKeys.list() });
      queryClient.invalidateQueries({ queryKey: friendsKeys.requests() });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to accept friend request";
      toast.error(message);
    },
  });

  const declineFriendRequest = useMutation({
    mutationFn: FriendsApiService.declineFriendRequest,
    onSuccess: (_, requesterId) => {
      toast.success("Friend request declined");

      // Remove from friend requests
      const request = messagingStore.friendRequests.find(
        (req) => req.requester.id === requesterId
      );

      if (request) {
        messagingStore.removeFriendRequest(request.id);
      }

      // Invalidate requests query
      queryClient.invalidateQueries({ queryKey: friendsKeys.requests() });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to decline friend request";
      toast.error(message);
    },
  });

  const removeFriend = useMutation({
    mutationFn: FriendsApiService.removeFriend,
    onSuccess: (_, friendId) => {
      toast.success("Friend removed successfully");

      // Remove from friendships
      const friendship = messagingStore.friendships.find(
        (f) => f.user1.id === friendId || f.user2.id === friendId
      );

      if (friendship) {
        messagingStore.removeFriendship(friendship.id);
      }

      // Invalidate friends query
      queryClient.invalidateQueries({ queryKey: friendsKeys.list() });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to remove friend";
      toast.error(message);
    },
  });

  return {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  };
};

/**
 * Hook to get friendship status with a specific user
 */
export const useFriendshipStatus = (userId: string) => {
  const messagingStore = useMessagingStore();

  return {
    status: messagingStore.getFriendshipStatusWithUser(userId),
    isFriend: messagingStore
      .getFriendsList()
      .some((friend) => friend.id === userId),
    hasPendingRequest: messagingStore.friendRequests.some(
      (req) => req.requester.id === userId && req.status === "pending"
    ),
    hasSentRequest: messagingStore
      .getSentFriendRequests()
      .some((req) => req.recipient.id === userId && req.status === "pending"),
  };
};
