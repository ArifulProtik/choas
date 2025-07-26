package services

import (
	"context"
	"fmt"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/conversation"
	"kakashi/chaos/internal/ent/conversationparticipant"
	"kakashi/chaos/internal/ent/friend"
	"kakashi/chaos/internal/ent/message"
	"kakashi/chaos/internal/ent/notification"
	"kakashi/chaos/internal/ent/user"
	"time"
)

// PerformanceService provides optimized queries for better performance
type PerformanceService struct {
	ent *ent.Client
}

// NewPerformanceService creates a new performance service
func NewPerformanceService(entClient *ent.Client) *PerformanceService {
	return &PerformanceService{
		ent: entClient,
	}
}

// GetUserConversationsOptimized returns user conversations with optimized queries
func (ps *PerformanceService) GetUserConversationsOptimized(ctx context.Context, userID string, limit, offset int, includeArchived, includeMuted bool) ([]*ConversationWithDetails, error) {
	// Build participant filter
	participantFilter := conversationparticipant.UserIDEQ(userID)
	if !includeArchived {
		participantFilter = conversationparticipant.And(
			participantFilter,
			conversationparticipant.IsArchivedEQ(false),
		)
	}
	if !includeMuted {
		participantFilter = conversationparticipant.And(
			participantFilter,
			conversationparticipant.IsMutedEQ(false),
		)
	}

	// Optimized query with selective loading
	conversations, err := ps.ent.Conversation.Query().
		Where(
			conversation.HasParticipantsWith(participantFilter),
		).
		Order(ent.Desc(conversation.FieldLastMessageAt)).
		Limit(limit).
		Offset(offset).
		WithParticipants(func(q *ent.ConversationParticipantQuery) {
			q.WithUser(func(uq *ent.UserQuery) {
				// Only load necessary user fields
				uq.Select(user.FieldID, user.FieldUsername, user.FieldName, user.FieldAvaterURL)
			})
		}).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get conversations: %w", err)
	}

	// Batch load last messages for all conversations
	conversationIDs := make([]string, len(conversations))
	for i, conv := range conversations {
		conversationIDs[i] = conv.ID
	}

	lastMessages, err := ps.getLastMessagesForConversations(ctx, conversationIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get last messages: %w", err)
	}

	// Build result with optimized data
	var result []*ConversationWithDetails
	for _, conv := range conversations {
		var participants []*ent.User
		var userParticipant *ent.ConversationParticipant

		for _, p := range conv.Edges.Participants {
			if p.Edges.User != nil {
				participants = append(participants, p.Edges.User)
				if p.UserID == userID {
					userParticipant = p
				}
			}
		}

		// Get last message from batch result
		lastMessage := lastMessages[conv.ID]

		// Calculate unread count efficiently
		unreadCount := ps.calculateUnreadCountOptimized(ctx, conv.ID, userID, userParticipant)

		// Get user-specific settings
		isArchived := false
		isMuted := false
		if userParticipant != nil {
			isArchived = userParticipant.IsArchived
			isMuted = userParticipant.IsMuted
		}

		result = append(result, &ConversationWithDetails{
			Conversation: conv,
			Participants: participants,
			LastMessage:  lastMessage,
			UnreadCount:  unreadCount,
			IsArchived:   isArchived,
			IsMuted:      isMuted,
		})
	}

	return result, nil
}

// getLastMessagesForConversations batch loads last messages for multiple conversations
func (ps *PerformanceService) getLastMessagesForConversations(ctx context.Context, conversationIDs []string) (map[string]*ent.Message, error) {
	if len(conversationIDs) == 0 {
		return make(map[string]*ent.Message), nil
	}

	// Use a single query to get the latest message for each conversation
	messages, err := ps.ent.Message.Query().
		Where(
			message.ConversationIDIn(conversationIDs...),
			message.IsDeletedEQ(false),
		).
		WithSender(func(q *ent.UserQuery) {
			q.Select(user.FieldID, user.FieldUsername, user.FieldName)
		}).
		Order(ent.Desc(message.FieldCreatedAt)).
		All(ctx)

	if err != nil {
		return nil, err
	}

	// Group messages by conversation and keep only the latest
	result := make(map[string]*ent.Message)
	for _, msg := range messages {
		if _, exists := result[msg.ConversationID]; !exists {
			result[msg.ConversationID] = msg
		}
	}

	return result, nil
}

// calculateUnreadCountOptimized calculates unread count more efficiently
func (ps *PerformanceService) calculateUnreadCountOptimized(ctx context.Context, conversationID, userID string, participant *ent.ConversationParticipant) int {
	if participant == nil || participant.LastReadAt.IsZero() {
		// Count all messages if never read
		count, err := ps.ent.Message.Query().
			Where(
				message.ConversationIDEQ(conversationID),
				message.IsDeletedEQ(false),
				message.SenderIDNEQ(userID),
			).
			Count(ctx)
		if err != nil {
			return 0
		}
		return count
	}

	// Count messages after last read time
	count, err := ps.ent.Message.Query().
		Where(
			message.ConversationIDEQ(conversationID),
			message.IsDeletedEQ(false),
			message.SenderIDNEQ(userID),
			message.CreatedAtGT(participant.LastReadAt),
		).
		Count(ctx)
	if err != nil {
		return 0
	}
	return count
}

// GetFriendsOptimized returns friends with optimized query
func (ps *PerformanceService) GetFriendsOptimized(ctx context.Context, userID string) ([]*ent.User, error) {
	// Use a more efficient query with proper joins
	friends, err := ps.ent.User.Query().
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
		Select(user.FieldID, user.FieldUsername, user.FieldName, user.FieldAvaterURL, user.FieldBio).
		Order(ent.Asc(user.FieldName)).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get friends: %w", err)
	}

	return friends, nil
}

// GetNotificationsOptimized returns notifications with optimized query
func (ps *PerformanceService) GetNotificationsOptimized(ctx context.Context, userID string, limit, offset int) ([]*ent.Notification, error) {
	notifications, err := ps.ent.Notification.Query().
		Where(notification.UserIDEQ(userID)).
		WithRelatedUser(func(q *ent.UserQuery) {
			q.Select(user.FieldID, user.FieldUsername, user.FieldName, user.FieldAvaterURL)
		}).
		WithRelatedConversation(func(q *ent.ConversationQuery) {
			q.Select(conversation.FieldID, conversation.FieldName, conversation.FieldType)
		}).
		Order(ent.Desc(notification.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}

	return notifications, nil
}

// SearchMessagesOptimized provides optimized message search
func (ps *PerformanceService) SearchMessagesOptimized(ctx context.Context, userID, query string, limit, offset int) ([]*MessageSearchResult, error) {
	if query == "" {
		return []*MessageSearchResult{}, nil
	}

	// Get user's conversation IDs first (more efficient)
	participations, err := ps.ent.ConversationParticipant.Query().
		Where(conversationparticipant.UserIDEQ(userID)).
		Select(conversationparticipant.FieldConversationID).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get user conversations: %w", err)
	}

	if len(participations) == 0 {
		return []*MessageSearchResult{}, nil
	}

	conversationIDs := make([]string, len(participations))
	for i, p := range participations {
		conversationIDs[i] = p.ConversationID
	}

	// Search messages with optimized query
	messages, err := ps.ent.Message.Query().
		Where(
			message.ConversationIDIn(conversationIDs...),
			message.IsDeletedEQ(false),
			message.ContentContainsFold(query),
		).
		WithSender(func(q *ent.UserQuery) {
			q.Select(user.FieldID, user.FieldUsername, user.FieldName)
		}).
		WithConversation(func(q *ent.ConversationQuery) {
			q.Select(conversation.FieldID, conversation.FieldName, conversation.FieldType).
				WithParticipants(func(pq *ent.ConversationParticipantQuery) {
					pq.WithUser(func(uq *ent.UserQuery) {
						uq.Select(user.FieldID, user.FieldUsername, user.FieldName)
					})
				})
		}).
		Order(ent.Desc(message.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to search messages: %w", err)
	}

	// Build results efficiently
	var results []*MessageSearchResult
	for _, msg := range messages {
		conversationName := ""
		if msg.Edges.Conversation != nil {
			if msg.Edges.Conversation.Type == conversation.TypeDirect {
				for _, p := range msg.Edges.Conversation.Edges.Participants {
					if p.UserID != userID && p.Edges.User != nil {
						conversationName = p.Edges.User.Name
						break
					}
				}
			} else {
				conversationName = msg.Edges.Conversation.Name
			}
		}

		results = append(results, &MessageSearchResult{
			Message:          msg,
			ConversationID:   msg.ConversationID,
			ConversationName: conversationName,
			Highlight:        createHighlightOptimized(msg.Content, query),
		})
	}

	return results, nil
}

// createHighlightOptimized creates highlights more efficiently
func createHighlightOptimized(content, query string) string {
	// Simple implementation for now - can be enhanced with more sophisticated highlighting
	if len(content) <= 100 {
		return content
	}
	return content[:100] + "..."
}

// BatchUpdateLastReadAt updates last read timestamps in batch
func (ps *PerformanceService) BatchUpdateLastReadAt(ctx context.Context, updates []struct {
	ConversationID string
	UserID         string
}) error {
	// This would be implemented with a batch update query
	// For now, we'll do individual updates but this could be optimized further
	for _, update := range updates {
		_, err := ps.ent.ConversationParticipant.Update().
			Where(
				conversationparticipant.ConversationIDEQ(update.ConversationID),
				conversationparticipant.UserIDEQ(update.UserID),
			).
			SetLastReadAt(time.Now()).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to update last read at for conversation %s, user %s: %w",
				update.ConversationID, update.UserID, err)
		}
	}
	return nil
}
