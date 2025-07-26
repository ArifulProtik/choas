package services

import (
	"context"
	"fmt"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/block"
	"kakashi/chaos/internal/ent/friend"
	"kakashi/chaos/internal/ent/user"
)

// SendFriendRequest creates a new friend request from requester to addressee
func (s *Services) SendFriendRequest(ctx context.Context, requesterID, addresseeID string) error {
	// Validate that both users exist
	_, err := s.ent.User.Query().Where(user.IDEQ(requesterID)).First(ctx)
	if err != nil {
		return fmt.Errorf("requester not found: %w", err)
	}

	_, err = s.ent.User.Query().Where(user.IDEQ(addresseeID)).First(ctx)
	if err != nil {
		return fmt.Errorf("addressee not found: %w", err)
	}

	// Check if users are blocked
	isBlocked, err := s.IsBlocked(ctx, requesterID, addresseeID)
	if err != nil {
		return fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return fmt.Errorf("cannot send friend request to blocked user")
	}

	// Check if friendship already exists (in any direction)
	existingFriend, err := s.ent.Friend.Query().
		Where(
			friend.Or(
				friend.And(
					friend.RequesterIDEQ(requesterID),
					friend.AddresseeIDEQ(addresseeID),
				),
				friend.And(
					friend.RequesterIDEQ(addresseeID),
					friend.AddresseeIDEQ(requesterID),
				),
			),
		).
		First(ctx)

	if err == nil {
		// Friendship exists
		if existingFriend.Status == friend.StatusAccepted {
			return fmt.Errorf("users are already friends")
		}
		if existingFriend.Status == friend.StatusPending {
			return fmt.Errorf("friend request already exists")
		}
	} else if !ent.IsNotFound(err) {
		return fmt.Errorf("failed to check existing friendship: %w", err)
	}

	// Create new friend request
	_, err = s.ent.Friend.Create().
		SetRequesterID(requesterID).
		SetAddresseeID(addresseeID).
		SetStatus(friend.StatusPending).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to create friend request: %w", err)
	}

	// Create notification for the addressee
	_, err = s.CreateFriendRequestNotification(ctx, addresseeID, requesterID)
	if err != nil {
		// Log error but don't fail the friend request creation
		fmt.Printf("Failed to create friend request notification: %v\n", err)
	}

	// Send real-time notification if WebSocket hub is available
	if s.WSHub != nil {
		requester, err := s.ent.User.Query().Where(user.IDEQ(requesterID)).First(ctx)
		if err == nil {
			s.BroadcastFriendRequestNotification(addresseeID, requesterID, requester.Username)
		}
	}

	return nil
}

// AcceptFriendRequest accepts a pending friend request
func (s *Services) AcceptFriendRequest(ctx context.Context, requesterID, addresseeID string) error {
	// Check if users are blocked
	isBlocked, err := s.IsBlocked(ctx, requesterID, addresseeID)
	if err != nil {
		return fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return fmt.Errorf("cannot accept friend request from blocked user")
	}

	// Find the pending friend request
	friendRequest, err := s.ent.Friend.Query().
		Where(
			friend.RequesterIDEQ(requesterID),
			friend.AddresseeIDEQ(addresseeID),
			friend.StatusEQ(friend.StatusPending),
		).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("friend request not found")
		}
		return fmt.Errorf("failed to find friend request: %w", err)
	}

	// Update the friend request status to accepted
	_, err = friendRequest.Update().
		SetStatus(friend.StatusAccepted).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to accept friend request: %w", err)
	}

	// Create notification for the requester
	_, err = s.CreateFriendAcceptedNotification(ctx, requesterID, addresseeID)
	if err != nil {
		// Log error but don't fail the acceptance
		fmt.Printf("Failed to create friend accepted notification: %v\n", err)
	}

	// Send real-time notification if WebSocket hub is available
	if s.WSHub != nil {
		addressee, err := s.ent.User.Query().Where(user.IDEQ(addresseeID)).First(ctx)
		if err == nil {
			s.BroadcastFriendAcceptedNotification(requesterID, addresseeID, addressee.Username)
		}
	}

	return nil
}

// DeclineFriendRequest declines a pending friend request by deleting it
func (s *Services) DeclineFriendRequest(ctx context.Context, requesterID, addresseeID string) error {
	// Find and delete the pending friend request
	deletedCount, err := s.ent.Friend.Delete().
		Where(
			friend.RequesterIDEQ(requesterID),
			friend.AddresseeIDEQ(addresseeID),
			friend.StatusEQ(friend.StatusPending),
		).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to decline friend request: %w", err)
	}

	if deletedCount == 0 {
		return fmt.Errorf("friend request not found")
	}

	return nil
}

// RemoveFriend removes an existing friendship by deleting the friend record
func (s *Services) RemoveFriend(ctx context.Context, userID, friendID string) error {
	// Find and delete the friendship (could be in either direction)
	deletedCount, err := s.ent.Friend.Delete().
		Where(
			friend.Or(
				friend.And(
					friend.RequesterIDEQ(userID),
					friend.AddresseeIDEQ(friendID),
					friend.StatusEQ(friend.StatusAccepted),
				),
				friend.And(
					friend.RequesterIDEQ(friendID),
					friend.AddresseeIDEQ(userID),
					friend.StatusEQ(friend.StatusAccepted),
				),
			),
		).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to remove friend: %w", err)
	}

	if deletedCount == 0 {
		return fmt.Errorf("friendship not found")
	}

	return nil
}

// GetFriends returns all accepted friends for a user
func (s *Services) GetFriends(ctx context.Context, userID string) ([]*ent.User, error) {
	// Query friends where user is either requester or addressee and status is accepted
	friends, err := s.ent.User.Query().
		Where(
			user.Or(
				user.HasFriendRequestsSentWith(
					friend.AddresseeIDEQ(userID),
					friend.StatusEQ(friend.StatusAccepted),
				),
				user.HasFriendRequestsReceivedWith(
					friend.RequesterIDEQ(userID),
					friend.StatusEQ(friend.StatusAccepted),
				),
			),
		).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get friends: %w", err)
	}

	return friends, nil
}

// GetPendingRequests returns all pending friend requests where the user is the addressee
func (s *Services) GetPendingRequests(ctx context.Context, userID string) ([]*ent.Friend, error) {
	pendingRequests, err := s.ent.Friend.Query().
		Where(
			friend.AddresseeIDEQ(userID),
			friend.StatusEQ(friend.StatusPending),
		).
		WithRequester().
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get pending requests: %w", err)
	}

	return pendingRequests, nil
}

// AreFriends checks if two users are friends (have an accepted friendship)
func (s *Services) AreFriends(ctx context.Context, userID1, userID2 string) (bool, error) {
	count, err := s.ent.Friend.Query().
		Where(
			friend.Or(
				friend.And(
					friend.RequesterIDEQ(userID1),
					friend.AddresseeIDEQ(userID2),
					friend.StatusEQ(friend.StatusAccepted),
				),
				friend.And(
					friend.RequesterIDEQ(userID2),
					friend.AddresseeIDEQ(userID1),
					friend.StatusEQ(friend.StatusAccepted),
				),
			),
		).
		Count(ctx)

	if err != nil {
		return false, fmt.Errorf("failed to check friendship: %w", err)
	}

	return count > 0, nil
}

// IsBlocked checks if one user has blocked another (in either direction)
func (s *Services) IsBlocked(ctx context.Context, userID1, userID2 string) (bool, error) {
	count, err := s.ent.Block.Query().
		Where(
			block.Or(
				block.And(
					block.BlockerIDEQ(userID1),
					block.BlockedIDEQ(userID2),
				),
				block.And(
					block.BlockerIDEQ(userID2),
					block.BlockedIDEQ(userID1),
				),
			),
		).
		Count(ctx)

	if err != nil {
		return false, fmt.Errorf("failed to check block status: %w", err)
	}

	return count > 0, nil
}

// UserSearchResult represents a user in search results with friendship status
type UserSearchResult struct {
	*ent.User
	IsFriend bool `json:"is_friend"`
}

// SearchUsers searches for users by username or name (case-insensitive partial match)
func (s *Services) SearchUsers(ctx context.Context, query string, currentUserID string) ([]*UserSearchResult, error) {
	if query == "" {
		return []*UserSearchResult{}, nil
	}

	users, err := s.ent.User.Query().
		Where(
			user.And(
				user.IDNEQ(currentUserID), // Exclude current user from results
				user.Or(
					user.UsernameContainsFold(query),
					user.NameContainsFold(query),
				),
			),
		).
		Limit(20). // Limit results to prevent large responses
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}

	// Filter out blocked users and convert to UserSearchResult with friendship status
	var results []*UserSearchResult
	for _, user := range users {
		// Check if user is blocked (in either direction)
		isBlocked, err := s.IsBlocked(ctx, currentUserID, user.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to check block status for user %s: %w", user.ID, err)
		}

		// Skip blocked users
		if isBlocked {
			continue
		}

		// Check friendship status
		isFriend, err := s.AreFriends(ctx, currentUserID, user.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to check friendship status for user %s: %w", user.ID, err)
		}

		results = append(results, &UserSearchResult{
			User:     user,
			IsFriend: isFriend,
		})
	}

	return results, nil
}

// SearchFriends searches within user's friends by username or name (case-insensitive partial match)
func (s *Services) SearchFriends(ctx context.Context, query string, userID string) ([]*ent.User, error) {
	if query == "" {
		return []*ent.User{}, nil
	}

	// Query friends where user is either requester or addressee, status is accepted,
	// and the friend's username or name matches the query
	friends, err := s.ent.User.Query().
		Where(
			user.And(
				user.Or(
					user.HasFriendRequestsSentWith(
						friend.AddresseeIDEQ(userID),
						friend.StatusEQ(friend.StatusAccepted),
					),
					user.HasFriendRequestsReceivedWith(
						friend.RequesterIDEQ(userID),
						friend.StatusEQ(friend.StatusAccepted),
					),
				),
				user.Or(
					user.UsernameContainsFold(query),
					user.NameContainsFold(query),
				),
			),
		).
		Limit(20). // Limit results to prevent large responses
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to search friends: %w", err)
	}

	return friends, nil
}
