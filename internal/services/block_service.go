package services

import (
	"context"
	"fmt"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/block"
	"kakashi/chaos/internal/ent/friend"
	"kakashi/chaos/internal/ent/user"
)

// BlockUser creates a block relationship from blocker to blocked user
func (s *Services) BlockUser(ctx context.Context, blockerID, blockedID string) error {
	// Validate that both users exist
	_, err := s.ent.User.Query().Where(user.IDEQ(blockerID)).First(ctx)
	if err != nil {
		return fmt.Errorf("blocker not found: %w", err)
	}

	_, err = s.ent.User.Query().Where(user.IDEQ(blockedID)).First(ctx)
	if err != nil {
		return fmt.Errorf("blocked user not found: %w", err)
	}

	// Prevent users from blocking themselves
	if blockerID == blockedID {
		return fmt.Errorf("cannot block yourself")
	}

	// Check if block already exists
	count, err := s.ent.Block.Query().
		Where(
			block.BlockerIDEQ(blockerID),
			block.BlockedIDEQ(blockedID),
		).
		Count(ctx)

	if err != nil {
		return fmt.Errorf("failed to check existing block: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("user is already blocked")
	}

	// Create new block record
	_, err = s.ent.Block.Create().
		SetBlockerID(blockerID).
		SetBlockedID(blockedID).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to create block: %w", err)
	}

	// Remove existing friendship if it exists (in either direction)
	_, err = s.ent.Friend.Delete().
		Where(
			friend.Or(
				friend.And(
					friend.RequesterIDEQ(blockerID),
					friend.AddresseeIDEQ(blockedID),
				),
				friend.And(
					friend.RequesterIDEQ(blockedID),
					friend.AddresseeIDEQ(blockerID),
				),
			),
		).
		Exec(ctx)

	if err != nil {
		// Log the error but don't fail the block operation
		// The friendship removal is a side effect, not critical
		fmt.Printf("Warning: failed to remove friendship when blocking user: %v\n", err)
	}

	return nil
}

// UnblockUser removes a block relationship from blocker to blocked user
func (s *Services) UnblockUser(ctx context.Context, blockerID, blockedID string) error {
	// Find and delete the block record
	deletedCount, err := s.ent.Block.Delete().
		Where(
			block.BlockerIDEQ(blockerID),
			block.BlockedIDEQ(blockedID),
		).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to unblock user: %w", err)
	}

	if deletedCount == 0 {
		return fmt.Errorf("block not found")
	}

	return nil
}

// GetBlockedUsers returns all users blocked by the given user
func (s *Services) GetBlockedUsers(ctx context.Context, userID string) ([]*ent.User, error) {
	blockedUsers, err := s.ent.User.Query().
		Where(
			user.HasBlockedByUsersWith(
				block.BlockerIDEQ(userID),
			),
		).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get blocked users: %w", err)
	}

	return blockedUsers, nil
}

// IsBlockedByUser checks if blockerID has blocked blockedID (one-directional check)
func (s *Services) IsBlockedByUser(ctx context.Context, blockerID, blockedID string) (bool, error) {
	count, err := s.ent.Block.Query().
		Where(
			block.BlockerIDEQ(blockerID),
			block.BlockedIDEQ(blockedID),
		).
		Count(ctx)

	if err != nil {
		return false, fmt.Errorf("failed to check block status: %w", err)
	}

	return count > 0, nil
}
