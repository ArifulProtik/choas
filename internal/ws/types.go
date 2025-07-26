package ws

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// MessageType represents different types of WebSocket messages
type MessageType string

const (
	MessageTypeMessage        MessageType = "message"
	MessageTypeNotification   MessageType = "notification"
	MessageTypeFriendRequest  MessageType = "friend_request"
	MessageTypeFriendAccepted MessageType = "friend_accepted"
	MessageTypeUserOnline     MessageType = "user_online"
	MessageTypeUserOffline    MessageType = "user_offline"
	MessageTypePing           MessageType = "ping"
	MessageTypePong           MessageType = "pong"
	MessageTypeTyping         MessageType = "typing"
	MessageTypeStopTyping     MessageType = "stop_typing"
	MessageTypeMessageRead    MessageType = "message_read"
	MessageTypeCallRequest    MessageType = "call_request"
	MessageTypeCallResponse   MessageType = "call_response"
	MessageTypeCallEnd        MessageType = "call_end"
)

// WSMessage represents a WebSocket message structure
type WSMessage struct {
	Type      MessageType `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}

// Connection represents a WebSocket connection with user information
type Connection struct {
	UserID   string
	Conn     *websocket.Conn
	Send     chan WSMessage
	Hub      *Hub
	LastPing time.Time
	mutex    sync.RWMutex
}

// Hub maintains active connections and handles broadcasting
type Hub struct {
	// Registered connections mapped by user ID
	connections map[string]*Connection

	// Register requests from connections
	register chan *Connection

	// Unregister requests from connections
	unregister chan *Connection

	// Broadcast message to specific user
	broadcast chan BroadcastMessage

	// Mutex for thread-safe operations
	mutex sync.RWMutex
}

// BroadcastMessage represents a message to be broadcast to specific users
type BroadcastMessage struct {
	UserIDs []string
	Message WSMessage
}

// MessageData represents the data structure for different message types
type MessageData struct {
	MessageID      string `json:"message_id,omitempty"`
	ConversationID string `json:"conversation_id,omitempty"`
	Content        string `json:"content,omitempty"`
	SenderID       string `json:"sender_id,omitempty"`
	SenderUsername string `json:"sender_username,omitempty"`
	MessageType    string `json:"message_type,omitempty"`
	CreatedAt      string `json:"created_at,omitempty"`
}

// NotificationData represents notification-specific data
type NotificationData struct {
	NotificationID string `json:"notification_id"`
	Type           string `json:"type"`
	Title          string `json:"title"`
	Content        string `json:"content"`
	RelatedUserID  string `json:"related_user_id,omitempty"`
}

// FriendRequestData represents friend request notification data
type FriendRequestData struct {
	RequesterID       string `json:"requester_id"`
	RequesterUsername string `json:"requester_username"`
}

// UserStatusData represents user online/offline status data
type UserStatusData struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Online   bool   `json:"online"`
}

// TypingData represents typing indicator data
type TypingData struct {
	ConversationID string `json:"conversation_id"`
	UserID         string `json:"user_id"`
	Username       string `json:"username"`
	IsTyping       bool   `json:"is_typing"`
}

// MessageReadData represents message read status data
type MessageReadData struct {
	ConversationID string `json:"conversation_id"`
	UserID         string `json:"user_id"`
	LastReadAt     string `json:"last_read_at"`
}

// CallRequestData represents call invitation data
type CallRequestData struct {
	CallID   string `json:"call_id"`
	CallerID string `json:"caller_id"`
	CalleeID string `json:"callee_id"`
	CallType string `json:"call_type"`
}

// CallResponseData represents call response data
type CallResponseData struct {
	CallID   string `json:"call_id"`
	Response string `json:"response"` // "accepted" or "declined"
	CallerID string `json:"caller_id"`
	CalleeID string `json:"callee_id"`
}

// CallEndData represents call end data
type CallEndData struct {
	CallID   string `json:"call_id"`
	Duration int    `json:"duration,omitempty"`
	EndedBy  string `json:"ended_by"`
	CallerID string `json:"caller_id"`
	CalleeID string `json:"callee_id"`
}
