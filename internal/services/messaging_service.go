package services

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/conversation"
	"kakashi/chaos/internal/ent/conversationparticipant"
	"kakashi/chaos/internal/ent/message"
	"kakashi/chaos/internal/ent/user"
)

// ConversationWithDetails represents a conversation with additional details
type ConversationWithDetails struct {
	*ent.Conversation
	Participants []*ent.User  `json:"participants"`
	LastMessage  *ent.Message `json:"last_message,omitempty"`
	UnreadCount  int          `json:"unread_count"`
	IsArchived   bool         `json:"is_archived"`
	IsMuted      bool         `json:"is_muted"`
}

// MessageSearchResult represents a message in search results with context
type MessageSearchResult struct {
	*ent.Message
	ConversationID   string `json:"conversation_id"`
	ConversationName string `json:"conversation_name"`
	Highlight        string `json:"highlight"`
}

// SendMessage creates a new message in the specified conversation
func (s *Services) SendMessage(ctx context.Context, senderID, conversationID, content string) (*ent.Message, error) {
	// Validate that sender exists
	_, err := s.ent.User.Query().Where(user.IDEQ(senderID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("sender not found: %w", err)
	}

	// Validate that conversation exists
	conv, err := s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	// Check if sender is a participant in the conversation
	participantExists, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(senderID),
		).
		Exist(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to check participant status: %w", err)
	}
	if !participantExists {
		return nil, fmt.Errorf("user is not a participant in this conversation")
	}

	// For direct conversations, check if users are friends and not blocked
	if conv.Type == conversation.TypeDirect {
		// Get the other participant
		participants, err := s.ent.ConversationParticipant.Query().
			Where(conversationparticipant.ConversationIDEQ(conversationID)).
			WithUser().
			All(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get conversation participants: %w", err)
		}

		var otherUserID string
		for _, p := range participants {
			if p.UserID != senderID {
				otherUserID = p.UserID
				break
			}
		}

		if otherUserID != "" {
			// Check if users are friends
			areFriends, err := s.AreFriends(ctx, senderID, otherUserID)
			if err != nil {
				return nil, fmt.Errorf("failed to check friendship status: %w", err)
			}
			if !areFriends {
				return nil, fmt.Errorf("can only send messages to friends")
			}

			// Check if users are blocked
			isBlocked, err := s.IsBlocked(ctx, senderID, otherUserID)
			if err != nil {
				return nil, fmt.Errorf("failed to check block status: %w", err)
			}
			if isBlocked {
				return nil, fmt.Errorf("cannot send message to blocked user")
			}
		}
	}

	// Create the message
	msg, err := s.ent.Message.Create().
		SetConversationID(conversationID).
		SetSenderID(senderID).
		SetContent(content).
		SetMessageType(message.MessageTypeText).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Update conversation's last_message_at
	_, err = s.ent.Conversation.UpdateOneID(conversationID).
		SetLastMessageAt(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update conversation timestamp: %w", err)
	}

	// Load the message with sender information
	msg, err = s.ent.Message.Query().
		Where(message.IDEQ(msg.ID)).
		WithSender().
		First(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load message with sender: %w", err)
	}

	// Broadcast real-time message notification if WebSocket hub is available
	if s.WSHub != nil {
		err = s.BroadcastMessageNotification(ctx, msg)
		if err != nil {
			// Log error but don't fail the message creation
			slog.Error("Failed to broadcast message notification", "message_id", msg.ID, "error", err)
		}
	}

	return msg, nil
}

// GetOrCreateDirectConversation gets or creates a direct conversation between two users
func (s *Services) GetOrCreateDirectConversation(ctx context.Context, userID1, userID2 string) (*ent.Conversation, error) {
	// Validate that both users exist
	_, err := s.ent.User.Query().Where(user.IDEQ(userID1)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user1 not found: %w", err)
	}

	_, err = s.ent.User.Query().Where(user.IDEQ(userID2)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user2 not found: %w", err)
	}

	// Check if users are friends
	areFriends, err := s.AreFriends(ctx, userID1, userID2)
	if err != nil {
		return nil, fmt.Errorf("failed to check friendship status: %w", err)
	}
	if !areFriends {
		return nil, fmt.Errorf("can only create conversations with friends")
	}

	// Check if users are blocked
	isBlocked, err := s.IsBlocked(ctx, userID1, userID2)
	if err != nil {
		return nil, fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return nil, fmt.Errorf("cannot create conversation with blocked user")
	}

	// Look for existing direct conversation between these users
	// First get all direct conversations for user1
	user1Conversations, err := s.ent.Conversation.Query().
		Where(
			conversation.TypeEQ(conversation.TypeDirect),
			conversation.HasParticipantsWith(
				conversationparticipant.UserIDEQ(userID1),
			),
		).
		WithParticipants().
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get user1 conversations: %w", err)
	}

	// Check if any of these conversations also has user2 as participant
	var existingConv *ent.Conversation
	for _, conv := range user1Conversations {
		hasUser2 := false
		for _, participant := range conv.Edges.Participants {
			if participant.UserID == userID2 {
				hasUser2 = true
				break
			}
		}
		if hasUser2 {
			existingConv = conv
			break
		}
	}

	if existingConv != nil {
		// Conversation already exists
		return existingConv, nil
	}

	// Create new direct conversation
	conv, err := s.ent.Conversation.Create().
		SetType(conversation.TypeDirect).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create conversation: %w", err)
	}

	// Add both users as participants
	_, err = s.ent.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetUserID(userID1).
		SetJoinedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to add user1 as participant: %w", err)
	}

	_, err = s.ent.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetUserID(userID2).
		SetJoinedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to add user2 as participant: %w", err)
	}

	return conv, nil
}

// GetUserConversations returns all conversations for a user with pagination and details
func (s *Services) GetUserConversations(ctx context.Context, userID string, limit, offset int) ([]*ConversationWithDetails, error) {
	return s.GetUserConversationsWithFilter(ctx, userID, limit, offset, false, false)
}

// GetUserConversationsWithFilter returns conversations for a user with filtering options
func (s *Services) GetUserConversationsWithFilter(ctx context.Context, userID string, limit, offset int, includeArchived, includeMuted bool) ([]*ConversationWithDetails, error) {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Build participant filter based on archive/mute preferences
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

	// Get conversations where user is a participant, ordered by last_message_at desc
	conversations, err := s.ent.Conversation.Query().
		Where(
			conversation.HasParticipantsWith(participantFilter),
		).
		Order(ent.Desc(conversation.FieldLastMessageAt)).
		Limit(limit).
		Offset(offset).
		WithParticipants(func(q *ent.ConversationParticipantQuery) {
			q.WithUser()
		}).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversations: %w", err)
	}

	var result []*ConversationWithDetails
	for _, conv := range conversations {
		// Get participants and find current user's participant record
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

		// Get last message
		var lastMessage *ent.Message
		lastMsg, err := s.ent.Message.Query().
			Where(
				message.ConversationIDEQ(conv.ID),
				message.IsDeletedEQ(false),
			).
			Order(ent.Desc(message.FieldCreatedAt)).
			WithSender().
			First(ctx)
		if err == nil {
			lastMessage = lastMsg
		} else if !ent.IsNotFound(err) {
			return nil, fmt.Errorf("failed to get last message for conversation %s: %w", conv.ID, err)
		}

		// Calculate unread count
		unreadCount, err := s.calculateUnreadCount(ctx, conv.ID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to calculate unread count for conversation %s: %w", conv.ID, err)
		}

		// Get user-specific archive and mute status
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

// calculateUnreadCount calculates the number of unread messages for a user in a conversation
func (s *Services) calculateUnreadCount(ctx context.Context, conversationID, userID string) (int, error) {
	// Get user's last read timestamp for this conversation
	participant, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		First(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to get participant info: %w", err)
	}

	// Count messages created after last read time (or all messages if never read)
	query := s.ent.Message.Query().
		Where(
			message.ConversationIDEQ(conversationID),
			message.IsDeletedEQ(false),
			message.SenderIDNEQ(userID), // Don't count own messages as unread
		)

	if !participant.LastReadAt.IsZero() {
		query = query.Where(message.CreatedAtGT(participant.LastReadAt))
	}

	count, err := query.Count(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to count unread messages: %w", err)
	}

	return count, nil
}

// GetConversationMessages returns paginated messages from a conversation with read status tracking
func (s *Services) GetConversationMessages(ctx context.Context, conversationID, userID string, limit, offset int) ([]*ent.Message, error) {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Validate that conversation exists
	_, err = s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant in the conversation
	participantExists, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		Exist(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to check participant status: %w", err)
	}
	if !participantExists {
		return nil, fmt.Errorf("user is not a participant in this conversation")
	}

	// Get messages from the conversation, ordered by created_at desc (newest first)
	messages, err := s.ent.Message.Query().
		Where(
			message.ConversationIDEQ(conversationID),
			message.IsDeletedEQ(false),
		).
		Order(ent.Desc(message.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		WithSender().
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	return messages, nil
}

// MarkMessagesAsRead marks all messages in a conversation as read for a user
func (s *Services) MarkMessagesAsRead(ctx context.Context, conversationID, userID string) error {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Validate that conversation exists
	_, err = s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant in the conversation
	participant, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("user is not a participant in this conversation")
		}
		return fmt.Errorf("failed to get participant: %w", err)
	}

	// Update the participant's last_read_at timestamp
	_, err = participant.Update().
		SetLastReadAt(time.Now()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to update last read timestamp: %w", err)
	}

	// Broadcast message read status if WebSocket hub is available
	if s.WSHub != nil {
		err = s.BroadcastMessageRead(ctx, conversationID, userID)
		if err != nil {
			// Log error but don't fail the operation
			slog.Error("Failed to broadcast message read status", "conversation_id", conversationID, "user_id", userID, "error", err)
		}
	}

	return nil
}

// DeleteMessage soft-deletes a message (marks as deleted but preserves record)
func (s *Services) DeleteMessage(ctx context.Context, messageID, userID string) error {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Get the message and validate ownership
	msg, err := s.ent.Message.Query().
		Where(message.IDEQ(messageID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("message not found")
		}
		return fmt.Errorf("failed to get message: %w", err)
	}

	// Check if user is the sender of the message
	if msg.SenderID != userID {
		return fmt.Errorf("can only delete own messages")
	}

	// Check if message is already deleted
	if msg.IsDeleted {
		return fmt.Errorf("message is already deleted")
	}

	// Soft delete the message
	_, err = msg.Update().
		SetIsDeleted(true).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}

	return nil
}

// SearchMessages searches for messages containing the query string with content matching
func (s *Services) SearchMessages(ctx context.Context, userID, query string, limit, offset int) ([]*MessageSearchResult, error) {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if strings.TrimSpace(query) == "" {
		return []*MessageSearchResult{}, nil
	}

	// Get all conversations where user is a participant
	userConversations, err := s.ent.ConversationParticipant.Query().
		Where(conversationparticipant.UserIDEQ(userID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get user conversations: %w", err)
	}

	var conversationIDs []string
	for _, cp := range userConversations {
		conversationIDs = append(conversationIDs, cp.ConversationID)
	}

	if len(conversationIDs) == 0 {
		return []*MessageSearchResult{}, nil
	}

	// Search for messages in user's conversations that contain the query
	messages, err := s.ent.Message.Query().
		Where(
			message.ConversationIDIn(conversationIDs...),
			message.IsDeletedEQ(false),
			message.ContentContainsFold(query),
		).
		Order(ent.Desc(message.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		WithSender().
		WithConversation(func(q *ent.ConversationQuery) {
			q.WithParticipants(func(pq *ent.ConversationParticipantQuery) {
				pq.WithUser()
			})
		}).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to search messages: %w", err)
	}

	var results []*MessageSearchResult
	for _, msg := range messages {
		// Generate conversation name for display
		conversationName := ""
		if msg.Edges.Conversation != nil {
			if msg.Edges.Conversation.Type == conversation.TypeDirect {
				// For direct conversations, use the other participant's name
				for _, p := range msg.Edges.Conversation.Edges.Participants {
					if p.UserID != userID && p.Edges.User != nil {
						conversationName = p.Edges.User.Name
						break
					}
				}
			} else {
				// For group conversations, use the conversation name
				conversationName = msg.Edges.Conversation.Name
			}
		}

		// Create highlight snippet (simple implementation)
		highlight := s.createHighlight(msg.Content, query)

		results = append(results, &MessageSearchResult{
			Message:          msg,
			ConversationID:   msg.ConversationID,
			ConversationName: conversationName,
			Highlight:        highlight,
		})
	}

	return results, nil
}

// createHighlight creates a highlighted snippet of the message content around the search query
func (s *Services) createHighlight(content, query string) string {
	lowerContent := strings.ToLower(content)
	lowerQuery := strings.ToLower(query)

	index := strings.Index(lowerContent, lowerQuery)
	if index == -1 {
		// Fallback: return first 100 characters if query not found
		if len(content) > 100 {
			return content[:100] + "..."
		}
		return content
	}

	// Create a snippet around the found query
	start := index - 50
	if start < 0 {
		start = 0
	}

	end := index + len(query) + 50
	if end > len(content) {
		end = len(content)
	}

	snippet := content[start:end]

	// Add ellipsis if we truncated
	if start > 0 {
		snippet = "..." + snippet
	}
	if end < len(content) {
		snippet = snippet + "..."
	}

	return snippet
}

// ArchiveConversation archives a conversation for a specific user
func (s *Services) ArchiveConversation(ctx context.Context, conversationID, userID string) error {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Validate that conversation exists
	_, err = s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant in the conversation
	participant, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("user is not a participant in this conversation")
		}
		return fmt.Errorf("failed to get participant: %w", err)
	}

	// Archive the conversation for this user
	_, err = participant.Update().
		SetIsArchived(true).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to archive conversation: %w", err)
	}

	return nil
}

// UnarchiveConversation unarchives a conversation for a specific user
func (s *Services) UnarchiveConversation(ctx context.Context, conversationID, userID string) error {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Validate that conversation exists
	_, err = s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant in the conversation
	participant, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("user is not a participant in this conversation")
		}
		return fmt.Errorf("failed to get participant: %w", err)
	}

	// Unarchive the conversation for this user
	_, err = participant.Update().
		SetIsArchived(false).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to unarchive conversation: %w", err)
	}

	return nil
}

// MuteConversation mutes a conversation for a specific user
func (s *Services) MuteConversation(ctx context.Context, conversationID, userID string) error {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Validate that conversation exists
	_, err = s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant in the conversation
	participant, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("user is not a participant in this conversation")
		}
		return fmt.Errorf("failed to get participant: %w", err)
	}

	// Mute the conversation for this user
	_, err = participant.Update().
		SetIsMuted(true).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to mute conversation: %w", err)
	}

	return nil
}

// UnmuteConversation unmutes a conversation for a specific user
func (s *Services) UnmuteConversation(ctx context.Context, conversationID, userID string) error {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Validate that conversation exists
	_, err = s.ent.Conversation.Query().Where(conversation.IDEQ(conversationID)).First(ctx)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	// Check if user is a participant in the conversation
	participant, err := s.ent.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationIDEQ(conversationID),
			conversationparticipant.UserIDEQ(userID),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("user is not a participant in this conversation")
		}
		return fmt.Errorf("failed to get participant: %w", err)
	}

	// Unmute the conversation for this user
	_, err = participant.Update().
		SetIsMuted(false).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to unmute conversation: %w", err)
	}

	return nil
}

// SearchConversations searches conversations by participant names
func (s *Services) SearchConversations(ctx context.Context, userID, query string, limit, offset int) ([]*ConversationWithDetails, error) {
	// Validate that user exists
	_, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if strings.TrimSpace(query) == "" {
		return []*ConversationWithDetails{}, nil
	}

	// Get conversations where user is a participant and other participants match the query
	conversations, err := s.ent.Conversation.Query().
		Where(
			conversation.HasParticipantsWith(
				conversationparticipant.UserIDEQ(userID),
			),
		).
		WithParticipants(func(q *ent.ConversationParticipantQuery) {
			q.WithUser(func(uq *ent.UserQuery) {
				uq.Where(
					user.Or(
						user.UsernameContainsFold(query),
						user.NameContainsFold(query),
					),
				)
			})
		}).
		Order(ent.Desc(conversation.FieldLastMessageAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to search conversations: %w", err)
	}

	var result []*ConversationWithDetails
	for _, conv := range conversations {
		// Check if any participant matches the search query
		hasMatchingParticipant := false
		var participants []*ent.User

		for _, p := range conv.Edges.Participants {
			if p.Edges.User != nil {
				participants = append(participants, p.Edges.User)
				// Check if this participant matches the query and is not the current user
				if p.UserID != userID {
					username := strings.ToLower(p.Edges.User.Username)
					name := strings.ToLower(p.Edges.User.Name)
					queryLower := strings.ToLower(query)
					if strings.Contains(username, queryLower) || strings.Contains(name, queryLower) {
						hasMatchingParticipant = true
					}
				}
			}
		}

		// Only include conversations with matching participants
		if !hasMatchingParticipant {
			continue
		}

		// Get last message
		var lastMessage *ent.Message
		lastMsg, err := s.ent.Message.Query().
			Where(
				message.ConversationIDEQ(conv.ID),
				message.IsDeletedEQ(false),
			).
			Order(ent.Desc(message.FieldCreatedAt)).
			WithSender().
			First(ctx)
		if err == nil {
			lastMessage = lastMsg
		} else if !ent.IsNotFound(err) {
			return nil, fmt.Errorf("failed to get last message for conversation %s: %w", conv.ID, err)
		}

		// Calculate unread count
		unreadCount, err := s.calculateUnreadCount(ctx, conv.ID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to calculate unread count for conversation %s: %w", conv.ID, err)
		}

		// Get user-specific archive and mute status
		isArchived := false
		isMuted := false
		for _, p := range conv.Edges.Participants {
			if p.UserID == userID {
				isArchived = p.IsArchived
				isMuted = p.IsMuted
				break
			}
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
