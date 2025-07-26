package services

import (
	"context"
	"fmt"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/call"
	"kakashi/chaos/internal/ent/conversationparticipant"
	"kakashi/chaos/internal/ent/user"
	"kakashi/chaos/internal/ws"
	"log/slog"
	"time"
)

// ValidateWebSocketToken validates JWT token for WebSocket connections
func (s *Services) ValidateWebSocketToken(token string) (string, error) {
	// Use existing token verification method
	return s.Verifytoken(token)
}

// ValidateWebSocketUser checks if user exists in database
func (s *Services) ValidateWebSocketUser(ctx context.Context, userID string) error {
	exists, err := s.ent.User.Query().Where(user.IDEQ(userID)).Exist(ctx)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("user not found")
	}
	return nil
}

// BroadcastToUser sends a WebSocket message to a specific user
func (s *Services) BroadcastToUser(userID string, messageType ws.MessageType, data interface{}) {
	message := ws.WSMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now(),
	}

	s.WSHub.BroadcastToUser(userID, message)
}

// BroadcastToUsers sends a WebSocket message to multiple users
func (s *Services) BroadcastToUsers(userIDs []string, messageType ws.MessageType, data interface{}) {
	message := ws.WSMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now(),
	}

	s.WSHub.BroadcastToUsers(userIDs, message)
}

// BroadcastToConversation sends a message to all participants in a conversation
func (s *Services) BroadcastToConversation(ctx context.Context, conversationID string, messageType ws.MessageType, data interface{}, excludeUserID string) error {
	// Get conversation participants
	participants, err := s.getConversationParticipants(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get conversation participants: %w", err)
	}

	// Filter out the excluded user (usually the sender) and only include online users
	var onlineTargetUsers []string
	for _, participantID := range participants {
		if participantID != excludeUserID && s.WSHub.IsUserOnline(participantID) {
			onlineTargetUsers = append(onlineTargetUsers, participantID)
		}
	}

	if len(onlineTargetUsers) > 0 {
		s.BroadcastToUsers(onlineTargetUsers, messageType, data)
	}

	return nil
}

// getConversationParticipants retrieves all participant IDs for a conversation
func (s *Services) getConversationParticipants(ctx context.Context, conversationID string) ([]string, error) {
	participants, err := s.ent.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationIDEQ(conversationID)).
		WithUser().
		All(ctx)

	if err != nil {
		return nil, err
	}

	userIDs := make([]string, len(participants))
	for i, participant := range participants {
		userIDs[i] = participant.Edges.User.ID
	}

	return userIDs, nil
}

// IsUserOnline checks if a user is currently connected via WebSocket
func (s *Services) IsUserOnline(userID string) bool {
	return s.WSHub.IsUserOnline(userID)
}

// GetOnlineUsers returns a list of currently online user IDs
func (s *Services) GetOnlineUsers() []string {
	return s.WSHub.GetOnlineUsers()
}

// DisconnectUser forcefully disconnects a user from WebSocket
func (s *Services) DisconnectUser(userID string) {
	s.WSHub.DisconnectUser(userID)
	slog.Info("User disconnected via service", "user_id", userID)
}

// BroadcastFriendRequestNotification sends real-time friend request notification to online users
func (s *Services) BroadcastFriendRequestNotification(addresseeID, requesterID, requesterUsername string) {
	if s.WSHub.IsUserOnline(addresseeID) {
		data := ws.FriendRequestData{
			RequesterID:       requesterID,
			RequesterUsername: requesterUsername,
		}
		s.BroadcastToUser(addresseeID, ws.MessageTypeFriendRequest, data)
	}
}

// BroadcastFriendAcceptedNotification sends real-time friend accepted notification to online users
func (s *Services) BroadcastFriendAcceptedNotification(requesterID, addresseeID, addresseeUsername string) {
	if s.WSHub.IsUserOnline(requesterID) {
		data := ws.FriendRequestData{
			RequesterID:       addresseeID,
			RequesterUsername: addresseeUsername,
		}
		s.BroadcastToUser(requesterID, ws.MessageTypeFriendAccepted, data)
	}
}

// BroadcastNotification sends real-time notification to online users only
func (s *Services) BroadcastNotification(userID, notificationID, notificationType, title, content, relatedUserID string) {
	// Only broadcast if user is online - offline users will get notifications via REST API
	if s.WSHub.IsUserOnline(userID) {
		data := ws.NotificationData{
			NotificationID: notificationID,
			Type:           notificationType,
			Title:          title,
			Content:        content,
			RelatedUserID:  relatedUserID,
		}
		s.BroadcastToUser(userID, ws.MessageTypeNotification, data)
	}
}

// BroadcastTypingIndicator broadcasts typing status to conversation participants
func (s *Services) BroadcastTypingIndicator(ctx context.Context, conversationID, userID, username string, isTyping bool) error {
	// Get conversation participants
	participants, err := s.getConversationParticipants(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get conversation participants: %w", err)
	}

	// Create typing data
	data := ws.TypingData{
		ConversationID: conversationID,
		UserID:         userID,
		Username:       username,
		IsTyping:       isTyping,
	}

	// Broadcast to online participants except the typing user
	var onlineTargetUsers []string
	for _, participantID := range participants {
		if participantID != userID && s.WSHub.IsUserOnline(participantID) {
			onlineTargetUsers = append(onlineTargetUsers, participantID)
		}
	}

	if len(onlineTargetUsers) > 0 {
		messageType := ws.MessageTypeTyping
		if !isTyping {
			messageType = ws.MessageTypeStopTyping
		}
		s.BroadcastToUsers(onlineTargetUsers, messageType, data)
	}

	return nil
}

// BroadcastMessageRead broadcasts message read status to conversation participants
func (s *Services) BroadcastMessageRead(ctx context.Context, conversationID, userID string) error {
	// Get conversation participants
	participants, err := s.getConversationParticipants(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get conversation participants: %w", err)
	}

	// Create message read data
	data := ws.MessageReadData{
		ConversationID: conversationID,
		UserID:         userID,
		LastReadAt:     time.Now().Format(time.RFC3339),
	}

	// Broadcast to online participants except the reading user
	var onlineTargetUsers []string
	for _, participantID := range participants {
		if participantID != userID && s.WSHub.IsUserOnline(participantID) {
			onlineTargetUsers = append(onlineTargetUsers, participantID)
		}
	}

	if len(onlineTargetUsers) > 0 {
		s.BroadcastToUsers(onlineTargetUsers, ws.MessageTypeMessageRead, data)
	}

	return nil
}

// BroadcastMessageNotification sends real-time message notification to online users
func (s *Services) BroadcastMessageNotification(ctx context.Context, message *ent.Message) error {
	if message.Edges.Sender == nil {
		return fmt.Errorf("message sender not loaded")
	}

	data := ws.MessageData{
		MessageID:      message.ID,
		ConversationID: message.ConversationID,
		Content:        message.Content,
		SenderID:       message.SenderID,
		SenderUsername: message.Edges.Sender.Username,
		MessageType:    string(message.MessageType),
		CreatedAt:      message.CreatedAt.Format(time.RFC3339),
	}

	// Broadcast to online conversation participants except the sender
	return s.BroadcastToConversation(ctx, message.ConversationID, ws.MessageTypeMessage, data, message.SenderID)
}

// HandleUserConnection handles when a user connects via WebSocket
func (s *Services) HandleUserConnection(ctx context.Context, userID string) error {
	// Broadcast user online status to friends
	err := s.BroadcastUserOnlineStatus(ctx, userID, true)
	if err != nil {
		slog.Error("Failed to broadcast user online status", "user_id", userID, "error", err)
	}

	slog.Info("User connected", "user_id", userID)
	return nil
}

// HandleUserDisconnection handles when a user disconnects from WebSocket
func (s *Services) HandleUserDisconnection(ctx context.Context, userID string) error {
	// Broadcast user offline status to friends
	err := s.BroadcastUserOnlineStatus(ctx, userID, false)
	if err != nil {
		slog.Error("Failed to broadcast user offline status", "user_id", userID, "error", err)
	}

	slog.Info("User disconnected", "user_id", userID)
	return nil
}

// BroadcastUserOnlineStatus broadcasts user online/offline status to their friends
func (s *Services) BroadcastUserOnlineStatus(ctx context.Context, userID string, isOnline bool) error {
	// Get user details
	user, err := s.ent.User.Query().Where(user.IDEQ(userID)).First(ctx)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Get user's friends
	friends, err := s.GetFriends(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get friends: %w", err)
	}

	// Create status data
	data := ws.UserStatusData{
		UserID:   userID,
		Username: user.Username,
		Online:   isOnline,
	}

	// Broadcast to online friends only
	var onlineFriends []string
	for _, friend := range friends {
		if s.WSHub.IsUserOnline(friend.ID) {
			onlineFriends = append(onlineFriends, friend.ID)
		}
	}

	if len(onlineFriends) > 0 {
		messageType := ws.MessageTypeUserOnline
		if !isOnline {
			messageType = ws.MessageTypeUserOffline
		}
		s.BroadcastToUsers(onlineFriends, messageType, data)
	}

	return nil
}

// BroadcastCallRequest broadcasts call invitation to online callee only
func (s *Services) BroadcastCallRequest(call *ent.Call) {
	// Only broadcast if callee is online - offline users won't receive call invitations
	if s.WSHub.IsUserOnline(call.CalleeID) {
		data := ws.CallRequestData{
			CallID:   call.ID,
			CallerID: call.CallerID,
			CalleeID: call.CalleeID,
			CallType: string(call.CallType),
		}
		s.BroadcastToUser(call.CalleeID, ws.MessageTypeCallRequest, data)
	}
}

// BroadcastCallResponse broadcasts call response to online caller only
func (s *Services) BroadcastCallResponse(callID, response, callerID, calleeID string) {
	if s.WSHub.IsUserOnline(callerID) {
		data := ws.CallResponseData{
			CallID:   callID,
			Response: response,
			CallerID: callerID,
			CalleeID: calleeID,
		}
		s.BroadcastToUser(callerID, ws.MessageTypeCallResponse, data)
	}
}

// BroadcastCallEnd broadcasts call end to online participants only
func (s *Services) BroadcastCallEnd(callID string, duration int, endedBy, callerID, calleeID string) {
	data := ws.CallEndData{
		CallID:   callID,
		Duration: duration,
		EndedBy:  endedBy,
		CallerID: callerID,
		CalleeID: calleeID,
	}

	// Broadcast to online participants only
	participants := []string{callerID, calleeID}
	for _, participantID := range participants {
		if s.WSHub.IsUserOnline(participantID) {
			s.BroadcastToUser(participantID, ws.MessageTypeCallEnd, data)
		}
	}
}

// HandleCallTimeoutBroadcast broadcasts call timeout to online participants
func (s *Services) HandleCallTimeoutBroadcast(ctx context.Context, callID string) error {
	// Get the call details
	call, err := s.ent.Call.Query().
		Where(call.IDEQ(callID)).
		First(ctx)
	if err != nil {
		return fmt.Errorf("failed to get call for timeout: %w", err)
	}

	// Handle the timeout in the service
	err = s.HandleCallTimeout(ctx, callID)
	if err != nil {
		return err
	}

	// Broadcast timeout as call end with 0 duration to online users only
	s.BroadcastCallEnd(callID, 0, "timeout", call.CallerID, call.CalleeID)

	return nil
}

// GetConversationParticipantsPublic is a public wrapper for getting conversation participants
func (s *Services) GetConversationParticipantsPublic(ctx context.Context, conversationID string) ([]string, error) {
	return s.getConversationParticipants(ctx, conversationID)
}
