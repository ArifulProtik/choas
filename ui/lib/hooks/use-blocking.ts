import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendsApiService } from "../api/friends";
import { User } from "../schemas/user";
import { useMessagingStore } from "@/components/store/messaging-store";
import { toast } from "sonner";

// Query keys
const blockingKeys = {
  all: ["blocking"] as const,
  lists: () => [...blockingKeys.all, "list"] as const,
  list: () => [...blockingKeys.lists()] as const,
};

/**
 * Hook to get blocked users list
 */
export const useBlockedUsers = () => {
  const messagingStore = useMessagingStore();

  const query = useQuery({
    queryKey: blockingKeys.list(),
    queryFn: FriendsApiService.getBlockedUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update MessagingStore when data changes
  useEffect(() => {
    if (query.data && messagingStore.currentUserId) {
      const transformedBlockedUsers = query.data.map((user) => ({
        id: `block-${messagingStore.currentUserId}-${user.id}`,
        blocked_user: user,
        blocked_at: new Date().toISOString(),
      }));
      messagingStore.setBlockedUsers(transformedBlockedUsers);
    }
  }, [query.data, messagingStore]);

  return query;
};

/**
 * Hook for blocking actions (block, unblock)
 */
export const useBlockingActions = () => {
  const queryClient = useQueryClient();
  const messagingStore = useMessagingStore();

  const blockUser = useMutation({
    mutationFn: FriendsApiService.blockUser,
    onMutate: async (blockedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: blockingKeys.list() });

      // Snapshot previous value
      const previousBlockedUsers = queryClient.getQueryData(
        blockingKeys.list()
      );

      // Optimistically update blocked users list
      const userToBlock = {
        id: blockedId,
        name: "Blocked User",
        username: "blocked_user",
        email: "blocked@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newBlockedUser = {
        id: `block-${messagingStore.currentUserId}-${blockedId}`,
        blocked_user: userToBlock,
        blocked_at: new Date().toISOString(),
      };

      messagingStore.addBlockedUser(newBlockedUser);

      // Remove any existing friendship
      const friendship = messagingStore.friendships.find(
        (f) => f.user1.id === blockedId || f.user2.id === blockedId
      );
      if (friendship) {
        messagingStore.removeFriendship(friendship.id);
      }

      // Remove any friend requests
      const incomingRequest = messagingStore.friendRequests.find(
        (req) => req.requester.id === blockedId
      );
      if (incomingRequest) {
        messagingStore.removeFriendRequest(incomingRequest.id);
      }

      const outgoingRequest = messagingStore
        .getSentFriendRequests()
        .find((req) => req.recipient.id === blockedId);
      if (outgoingRequest) {
        messagingStore.removeFriendRequest(outgoingRequest.id);
      }

      // Remove conversations with blocked user
      const conversationsToRemove = messagingStore.conversations.filter(
        (conv) =>
          conv.participants.some((participant) => participant.id === blockedId)
      );
      conversationsToRemove.forEach((conv) => {
        messagingStore.removeConversation(conv.id);
      });

      return { previousBlockedUsers };
    },
    onSuccess: (_, blockedId) => {
      toast.success("User blocked successfully");

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: blockingKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error: any, blockedId, context) => {
      // Rollback optimistic update
      if (context?.previousBlockedUsers) {
        queryClient.setQueryData(
          blockingKeys.list(),
          context.previousBlockedUsers
        );
      }

      // Remove optimistic blocked user from store
      messagingStore.removeBlockedUser(blockedId);

      const message = error.response?.data?.message || "Failed to block user";
      toast.error(message);
    },
  });

  const unblockUser = useMutation({
    mutationFn: FriendsApiService.unblockUser,
    onMutate: async (blockedUserId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: blockingKeys.list() });

      // Snapshot previous value
      const previousBlockedUsers = queryClient.getQueryData(
        blockingKeys.list()
      );

      // Optimistically remove from blocked users
      messagingStore.removeBlockedUser(blockedUserId);

      return { previousBlockedUsers };
    },
    onSuccess: (_, blockedUserId) => {
      toast.success("User unblocked successfully");

      // Invalidate blocked users query
      queryClient.invalidateQueries({ queryKey: blockingKeys.list() });
    },
    onError: (error: any, blockedUserId, context) => {
      // Rollback optimistic update
      if (context?.previousBlockedUsers) {
        queryClient.setQueryData(
          blockingKeys.list(),
          context.previousBlockedUsers
        );
      }

      const message = error.response?.data?.message || "Failed to unblock user";
      toast.error(message);
    },
  });

  return {
    blockUser,
    unblockUser,
  };
};

/**
 * Hook to check if a user is blocked
 */
export const useIsUserBlocked = (userId: string) => {
  const messagingStore = useMessagingStore();

  return {
    isBlocked: messagingStore.isUserBlocked(userId),
    blockedUser: messagingStore.blockedUsers.find(
      (blocked) => blocked.blocked_user.id === userId
    ),
  };
};
