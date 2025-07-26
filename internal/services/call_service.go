package services

import (
	"context"
	"fmt"
	"time"

	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/call"
	"kakashi/chaos/internal/ent/message"
	"kakashi/chaos/internal/ent/user"
)

// CallWithDetails represents a call with additional details
type CallWithDetails struct {
	*ent.Call
	Caller   *ent.User `json:"caller"`
	Callee   *ent.User `json:"callee"`
	Duration int       `json:"duration_seconds"`
}

// InitiateCall creates a new call between caller and callee
func (s *Services) InitiateCall(ctx context.Context, callerID, calleeID string, callType string) (*ent.Call, error) {
	// Validate that both users exist
	_, err := s.ent.User.Query().Where(user.IDEQ(callerID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("caller not found: %w", err)
	}

	_, err = s.ent.User.Query().Where(user.IDEQ(calleeID)).First(ctx)
	if err != nil {
		return nil, fmt.Errorf("callee not found: %w", err)
	}

	// Check if users are friends
	areFriends, err := s.AreFriends(ctx, callerID, calleeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check friendship status: %w", err)
	}
	if !areFriends {
		return nil, fmt.Errorf("can only call friends")
	}

	// Check if users are blocked
	isBlocked, err := s.IsBlocked(ctx, callerID, calleeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check block status: %w", err)
	}
	if isBlocked {
		return nil, fmt.Errorf("cannot call blocked user")
	}

	// Check if either user is already in an active call
	activeCall, err := s.GetActiveCall(ctx, callerID)
	if err != nil {
		return nil, fmt.Errorf("failed to check caller's active call: %w", err)
	}
	if activeCall != nil {
		return nil, fmt.Errorf("caller is already in a call")
	}

	activeCall, err = s.GetActiveCall(ctx, calleeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check callee's active call: %w", err)
	}
	if activeCall != nil {
		return nil, fmt.Errorf("callee is already in a call")
	}

	// Validate call type
	if callType != "voice" && callType != "video" {
		callType = "voice" // default to voice
	}

	// Create the call
	newCall, err := s.ent.Call.Create().
		SetCallerID(callerID).
		SetCalleeID(calleeID).
		SetCallType(call.CallType(callType)).
		SetStatus(call.StatusPending).
		SetStartedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create call: %w", err)
	}

	// Load the call with caller and callee information
	newCall, err = s.ent.Call.Query().
		Where(call.IDEQ(newCall.ID)).
		WithCaller().
		WithCallee().
		First(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load call with user details: %w", err)
	}

	// Broadcast call request to callee if WebSocket hub is available
	if s.WSHub != nil {
		s.BroadcastCallRequest(newCall)
	}

	return newCall, nil
}

// AcceptCall accepts an incoming call
func (s *Services) AcceptCall(ctx context.Context, callID, userID string) error {
	// Get the call
	existingCall, err := s.ent.Call.Query().
		Where(call.IDEQ(callID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("call not found")
		}
		return fmt.Errorf("failed to get call: %w", err)
	}

	// Verify that the user is the callee
	if existingCall.CalleeID != userID {
		return fmt.Errorf("only the callee can accept the call")
	}

	// Verify call is in pending or ringing status
	if existingCall.Status != call.StatusPending && existingCall.Status != call.StatusRinging {
		return fmt.Errorf("call cannot be accepted in current status: %s", existingCall.Status)
	}

	// Update call status to accepted
	_, err = existingCall.Update().
		SetStatus(call.StatusAccepted).
		SetAnsweredAt(time.Now()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to accept call: %w", err)
	}

	// Broadcast call response to caller if WebSocket hub is available
	if s.WSHub != nil {
		s.BroadcastCallResponse(callID, "accepted", existingCall.CallerID, existingCall.CalleeID)
	}

	// Create call_start message in conversation
	err = s.CreateCallMessages(ctx, existingCall)
	if err != nil {
		// Log error but don't fail the call acceptance
		fmt.Printf("Failed to create call start message: %v\n", err)
	}

	return nil
}

// DeclineCall declines an incoming call
func (s *Services) DeclineCall(ctx context.Context, callID, userID string) error {
	// Get the call
	existingCall, err := s.ent.Call.Query().
		Where(call.IDEQ(callID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("call not found")
		}
		return fmt.Errorf("failed to get call: %w", err)
	}

	// Verify that the user is the callee
	if existingCall.CalleeID != userID {
		return fmt.Errorf("only the callee can decline the call")
	}

	// Verify call is in pending or ringing status
	if existingCall.Status != call.StatusPending && existingCall.Status != call.StatusRinging {
		return fmt.Errorf("call cannot be declined in current status: %s", existingCall.Status)
	}

	// Update call status to declined
	_, err = existingCall.Update().
		SetStatus(call.StatusDeclined).
		SetEndedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to decline call: %w", err)
	}

	// Broadcast call response to caller if WebSocket hub is available
	if s.WSHub != nil {
		s.BroadcastCallResponse(callID, "declined", existingCall.CallerID, existingCall.CalleeID)
	}

	return nil
}

// EndCall ends an active call
func (s *Services) EndCall(ctx context.Context, callID, userID string) error {
	// Get the call
	existingCall, err := s.ent.Call.Query().
		Where(call.IDEQ(callID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("call not found")
		}
		return fmt.Errorf("failed to get call: %w", err)
	}

	// Verify that the user is either caller or callee
	if existingCall.CallerID != userID && existingCall.CalleeID != userID {
		return fmt.Errorf("only call participants can end the call")
	}

	// Verify call is in accepted status
	if existingCall.Status != call.StatusAccepted {
		return fmt.Errorf("call cannot be ended in current status: %s", existingCall.Status)
	}

	// Calculate duration
	var duration int
	if !existingCall.AnsweredAt.IsZero() {
		duration = int(time.Since(existingCall.AnsweredAt).Seconds())
	}

	// Update call status to ended
	_, err = existingCall.Update().
		SetStatus(call.StatusEnded).
		SetEndedAt(time.Now()).
		SetDuration(duration).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to end call: %w", err)
	}

	// Broadcast call end to both participants if WebSocket hub is available
	if s.WSHub != nil {
		s.BroadcastCallEnd(callID, duration, userID, existingCall.CallerID, existingCall.CalleeID)
	}

	// Create call_end message in conversation
	err = s.CreateCallEndMessage(ctx, existingCall, duration)
	if err != nil {
		// Log error but don't fail the call ending
		fmt.Printf("Failed to create call end message: %v\n", err)
	}

	return nil
}

// GetActiveCall returns the active call for a user (if any)
func (s *Services) GetActiveCall(ctx context.Context, userID string) (*ent.Call, error) {
	// Look for calls where user is caller or callee and status is pending, ringing, or accepted
	activeCall, err := s.ent.Call.Query().
		Where(
			call.Or(
				call.CallerIDEQ(userID),
				call.CalleeIDEQ(userID),
			),
			call.StatusIn(call.StatusPending, call.StatusRinging, call.StatusAccepted),
		).
		WithCaller().
		WithCallee().
		Order(ent.Desc(call.FieldCreatedAt)).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil // No active call
		}
		return nil, fmt.Errorf("failed to get active call: %w", err)
	}

	return activeCall, nil
}

// GetCallHistory returns paginated call history for a user
func (s *Services) GetCallHistory(ctx context.Context, userID string, limit, offset int) ([]*ent.Call, error) {
	// Validate that user exists
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

	// Get calls where user is caller or callee, ordered by creation date (newest first)
	calls, err := s.ent.Call.Query().
		Where(
			call.Or(
				call.CallerIDEQ(userID),
				call.CalleeIDEQ(userID),
			),
		).
		WithCaller().
		WithCallee().
		Order(ent.Desc(call.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get call history: %w", err)
	}

	return calls, nil
}

// HandleCallTimeout handles call timeout (marks as missed after 30 seconds)
func (s *Services) HandleCallTimeout(ctx context.Context, callID string) error {
	// Get the call
	existingCall, err := s.ent.Call.Query().
		Where(call.IDEQ(callID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("call not found")
		}
		return fmt.Errorf("failed to get call: %w", err)
	}

	// Only timeout calls that are still pending or ringing
	if existingCall.Status != call.StatusPending && existingCall.Status != call.StatusRinging {
		return nil // Call already handled
	}

	// Check if call has been pending for more than 30 seconds
	if time.Since(existingCall.CreatedAt) < 30*time.Second {
		return nil // Not yet timed out
	}

	// Update call status to missed
	_, err = existingCall.Update().
		SetStatus(call.StatusMissed).
		SetEndedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to timeout call: %w", err)
	}

	// Broadcast call timeout if WebSocket hub is available
	if s.WSHub != nil {
		s.BroadcastCallEnd(callID, 0, "timeout", existingCall.CallerID, existingCall.CalleeID)
	}

	return nil
}

// CreateCallMessages creates call_start message when call is accepted
func (s *Services) CreateCallMessages(ctx context.Context, call *ent.Call) error {
	// Get or create conversation between caller and callee
	conversation, err := s.GetOrCreateDirectConversation(ctx, call.CallerID, call.CalleeID)
	if err != nil {
		return fmt.Errorf("failed to get conversation: %w", err)
	}

	// Create call_start message
	_, err = s.ent.Message.Create().
		SetConversationID(conversation.ID).
		SetSenderID(call.CallerID).
		SetContent(fmt.Sprintf("Call started")).
		SetMessageType(message.MessageTypeCallStart).
		SetCallID(call.ID).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to create call start message: %w", err)
	}

	return nil
}

// CreateCallEndMessage creates call_end message when call ends
func (s *Services) CreateCallEndMessage(ctx context.Context, call *ent.Call, duration int) error {
	// Get or create conversation between caller and callee
	conversation, err := s.GetOrCreateDirectConversation(ctx, call.CallerID, call.CalleeID)
	if err != nil {
		return fmt.Errorf("failed to get conversation: %w", err)
	}

	// Format duration
	durationText := formatCallDuration(duration)
	content := fmt.Sprintf("Call ended • %s", durationText)

	// Create call_end message
	_, err = s.ent.Message.Create().
		SetConversationID(conversation.ID).
		SetSenderID(call.CallerID).
		SetContent(content).
		SetMessageType(message.MessageTypeCallEnd).
		SetCallID(call.ID).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to create call end message: %w", err)
	}

	return nil
}

// formatCallDuration formats duration in seconds to human readable format
func formatCallDuration(seconds int) string {
	if seconds < 60 {
		return fmt.Sprintf("%d seconds", seconds)
	}

	minutes := seconds / 60
	remainingSeconds := seconds % 60

	if minutes < 60 {
		if remainingSeconds == 0 {
			return fmt.Sprintf("%d minutes", minutes)
		}
		return fmt.Sprintf("%d minutes %d seconds", minutes, remainingSeconds)
	}

	hours := minutes / 60
	remainingMinutes := minutes % 60

	if remainingMinutes == 0 && remainingSeconds == 0 {
		return fmt.Sprintf("%d hours", hours)
	} else if remainingSeconds == 0 {
		return fmt.Sprintf("%d hours %d minutes", hours, remainingMinutes)
	}

	return fmt.Sprintf("%d hours %d minutes %d seconds", hours, remainingMinutes, remainingSeconds)
}
