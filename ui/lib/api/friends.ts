import { Api, handleApiCall } from "./api";
import { User } from "../schemas/user";

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

export class FriendsApiService {
  /**
   * Get user's friends list
   */
  static async getFriends(): Promise<User[]> {
    return handleApiCall(() => Api.get("/friends"));
  }

  /**
   * Get pending friend requests (incoming only)
   */
  static async getPendingRequests(): Promise<BackendFriendRequest[]> {
    return handleApiCall(() => Api.get("/friends/requests"));
  }

  /**
   * Send a friend request to another user
   */
  static async sendFriendRequest(addresseeId: string): Promise<void> {
    return handleApiCall(() =>
      Api.post("/friends/request", { addressee_id: addresseeId })
    );
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requesterId: string): Promise<void> {
    return handleApiCall(() =>
      Api.post("/friends/accept", { requester_id: requesterId })
    );
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(requesterId: string): Promise<void> {
    return handleApiCall(() =>
      Api.post("/friends/decline", { requester_id: requesterId })
    );
  }

  /**
   * Remove a friend (unfriend)
   */
  static async removeFriend(friendId: string): Promise<void> {
    return handleApiCall(() => Api.delete(`/friends/${friendId}`));
  }

  /**
   * Block a user
   */
  static async blockUser(blockedId: string): Promise<void> {
    return handleApiCall(() => Api.post("/blocks", { blocked_id: blockedId }));
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockedUserId: string): Promise<void> {
    return handleApiCall(() => Api.delete(`/blocks/${blockedUserId}`));
  }

  /**
   * Get blocked users list
   */
  static async getBlockedUsers(): Promise<User[]> {
    return handleApiCall(() => Api.get("/blocks"));
  }

  /**
   * Search friends by name or username
   */
  static async searchFriends(query: string): Promise<User[]> {
    return handleApiCall(() =>
      Api.get("/friends/search", {
        params: { q: query },
      })
    );
  }
}
