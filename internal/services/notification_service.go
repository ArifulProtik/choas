package services

import (
	"context"
	"fmt"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/notification"
	"kakashi/chaos/internal/ent/user"
)

// CreateNotification creates a new notification for a user
func (s *Services) CreateNotification(ctx context.Context, userID, notificationType, title, content string, relatedUserID, relatedConversationID *string) (*ent.Notification, error) {
	// Validate that the user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Validate related user if provided
	if relatedUserID != nil && *relatedUserID != "" {
		_, err := s.ent.User.Query().Where(user.IDEQ(*relatedUserID)).First(ctx)
		if err != nil {
			return nil, fmt.Errorf("related user not found: %w", err)
		}
	}

	// Create notification builder
	builder := s.ent.Notification.Create().
		SetUserID(userID).
		SetType(notification.Type(notificationType)).
		SetTitle(title).
		SetContent(content)

	// Add optional fields if provided
	if relatedUserID != nil && *relatedUserID != "" {
		builder = builder.SetRelatedUserID(*relatedUserID)
	}
	if relatedConversationID != nil && *relatedConversationID != "" {
		builder = builder.SetRelatedConversationID(*relatedConversationID)
	}

	// Save the notification
	notif, err := builder.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	// Send real-time notification if WebSocket hub is available
	if s.WSHub != nil {
		relatedUserIDStr := ""
		if relatedUserID != nil {
			relatedUserIDStr = *relatedUserID
		}
		s.BroadcastNotification(userID, notif.ID, notificationType, title, content, relatedUserIDStr)
	}

	return notif, nil
}

// GetUserNotifications returns paginated notifications for a user, ordered by creation date (newest first)
func (s *Services) GetUserNotifications(ctx context.Context, userID string, limit, offset int) ([]*ent.Notification, error) {
	// Validate that the user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Set default limit if not provided or invalid
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	// Set default offset if negative
	if offset < 0 {
		offset = 0
	}

	notifications, err := s.ent.Notification.Query().
		Where(notification.UserIDEQ(userID)).
		WithRelatedUser().
		WithRelatedConversation().
		Order(ent.Desc(notification.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}

	return notifications, nil
}

// MarkNotificationAsRead marks a specific notification as read
func (s *Services) MarkNotificationAsRead(ctx context.Context, notificationID, userID string) error {
	// Find the notification and verify ownership
	notif, err := s.ent.Notification.Query().
		Where(
			notification.IDEQ(notificationID),
			notification.UserIDEQ(userID),
		).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("notification not found")
		}
		return fmt.Errorf("failed to find notification: %w", err)
	}

	// Update the notification to mark as read
	_, err = notif.Update().
		SetIsRead(true).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}

	return nil
}

// MarkAllNotificationsAsRead marks all notifications for a user as read
func (s *Services) MarkAllNotificationsAsRead(ctx context.Context, userID string) error {
	// Validate that the user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Update all unread notifications for the user
	_, err = s.ent.Notification.Update().
		Where(
			notification.UserIDEQ(userID),
			notification.IsReadEQ(false),
		).
		SetIsRead(true).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}

	return nil
}

// DeleteNotification performs soft deletion by removing the notification record
// Note: Based on the design, we're doing actual deletion rather than soft deletion
// as the schema doesn't include a deleted_at field
func (s *Services) DeleteNotification(ctx context.Context, notificationID, userID string) error {
	// Delete the notification, ensuring the user owns it
	deletedCount, err := s.ent.Notification.Delete().
		Where(
			notification.IDEQ(notificationID),
			notification.UserIDEQ(userID),
		).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	if deletedCount == 0 {
		return fmt.Errorf("notification not found")
	}

	return nil
}

// CreateFriendRequestNotification creates a notification for a friend request
func (s *Services) CreateFriendRequestNotification(ctx context.Context, addresseeID, requesterID string) (*ent.Notification, error) {
	// Get requester details for the notification content
	requester, err := s.ent.User.Query().Where(user.IDEQ(requesterID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("requester not found: %w", err)
	}

	title := "New Friend Request"
	content := fmt.Sprintf("%s sent you a friend request", requester.Username)

	return s.CreateNotification(ctx, addresseeID, string(notification.TypeFriendRequest), title, content, &requesterID, nil)
}

// CreateFriendAcceptedNotification creates a notification when a friend request is accepted
func (s *Services) CreateFriendAcceptedNotification(ctx context.Context, requesterID, addresseeID string) (*ent.Notification, error) {
	// Get addressee details for the notification content
	addressee, err := s.ent.User.Query().Where(user.IDEQ(addresseeID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("addressee not found: %w", err)
	}

	title := "Friend Request Accepted"
	content := fmt.Sprintf("%s accepted your friend request", addressee.Username)

	return s.CreateNotification(ctx, requesterID, string(notification.TypeFriendAccepted), title, content, &addresseeID, nil)
}

// CreateMessageNotification creates a notification for a new message
func (s *Services) CreateMessageNotification(ctx context.Context, recipientID, senderID, conversationID string) (*ent.Notification, error) {
	// Get sender details for the notification content
	sender, err := s.ent.User.Query().Where(user.IDEQ(senderID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("sender not found: %w", err)
	}

	title := "New Message"
	content := fmt.Sprintf("You have a new message from %s", sender.Username)

	return s.CreateNotification(ctx, recipientID, string(notification.TypeMessage), title, content, &senderID, &conversationID)
}

// GetUnreadNotificationCount returns the count of unread notifications for a user
func (s *Services) GetUnreadNotificationCount(ctx context.Context, userID string) (int, error) {
	// Validate that the user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return 0, fmt.Errorf("user not found: %w", err)
	}

	count, err := s.ent.Notification.Query().
		Where(
			notification.UserIDEQ(userID),
			notification.IsReadEQ(false),
		).
		Count(ctx)

	if err != nil {
		return 0, fmt.Errorf("failed to get unread notification count: %w", err)
	}

	return count, nil
}
