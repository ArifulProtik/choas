package ws

import (
	"log/slog"
)

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		connections: make(map[string]*Connection),
		register:    make(chan *Connection),
		unregister:  make(chan *Connection),
		broadcast:   make(chan BroadcastMessage),
	}
}

// Run starts the hub and handles connection management
func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.registerConnection(conn)

		case conn := <-h.unregister:
			h.unregisterConnection(conn)

		case message := <-h.broadcast:
			h.broadcastMessage(message)
		}
	}
}

// registerConnection adds a new connection to the hub
func (h *Hub) registerConnection(conn *Connection) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	// If user already has a connection, close the old one
	if existingConn, exists := h.connections[conn.UserID]; exists {
		close(existingConn.Send)
		existingConn.Conn.Close()
		slog.Info("Replaced existing connection for user", "user_id", conn.UserID)
	}

	h.connections[conn.UserID] = conn
	slog.Info("User connected", "user_id", conn.UserID, "total_connections", len(h.connections))

	// Notify other users that this user is online
	h.broadcastUserStatus(conn.UserID, true)
}

// unregisterConnection removes a connection from the hub
func (h *Hub) unregisterConnection(conn *Connection) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if _, exists := h.connections[conn.UserID]; exists {
		delete(h.connections, conn.UserID)
		close(conn.Send)
		slog.Info("User disconnected", "user_id", conn.UserID, "total_connections", len(h.connections))

		// Notify other users that this user is offline
		h.broadcastUserStatus(conn.UserID, false)
	}
}

// broadcastMessage sends a message to specific users
func (h *Hub) broadcastMessage(message BroadcastMessage) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for _, userID := range message.UserIDs {
		if conn, exists := h.connections[userID]; exists {
			select {
			case conn.Send <- message.Message:
				// Message sent successfully
			default:
				// Connection is blocked, close it
				h.closeConnection(conn)
			}
		}
	}
}

// broadcastUserStatus notifies friends about user online/offline status
func (h *Hub) broadcastUserStatus(userID string, online bool) {
	// This will be implemented when we integrate with friend service
	// For now, we'll just log the status change
	status := "offline"
	if online {
		status = "online"
	}
	slog.Info("User status changed", "user_id", userID, "status", status)
}

// closeConnection safely closes a connection
func (h *Hub) closeConnection(conn *Connection) {
	delete(h.connections, conn.UserID)
	close(conn.Send)
	conn.Conn.Close()
}

// BroadcastToUser sends a message to a specific user
func (h *Hub) BroadcastToUser(userID string, message WSMessage) {
	select {
	case h.broadcast <- BroadcastMessage{
		UserIDs: []string{userID},
		Message: message,
	}:
	default:
		slog.Warn("Broadcast channel is full, dropping message", "user_id", userID)
	}
}

// BroadcastToUsers sends a message to multiple users
func (h *Hub) BroadcastToUsers(userIDs []string, message WSMessage) {
	select {
	case h.broadcast <- BroadcastMessage{
		UserIDs: userIDs,
		Message: message,
	}:
	default:
		slog.Warn("Broadcast channel is full, dropping message", "user_ids", userIDs)
	}
}

// IsUserOnline checks if a user is currently connected
func (h *Hub) IsUserOnline(userID string) bool {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	_, exists := h.connections[userID]
	return exists
}

// GetOnlineUsers returns a list of currently online user IDs
func (h *Hub) GetOnlineUsers() []string {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	users := make([]string, 0, len(h.connections))
	for userID := range h.connections {
		users = append(users, userID)
	}
	return users
}

// DisconnectUser forcefully disconnects a user
func (h *Hub) DisconnectUser(userID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if conn, exists := h.connections[userID]; exists {
		h.closeConnection(conn)
		slog.Info("User forcefully disconnected", "user_id", userID)
	}
}

// BroadcastTypingIndicator broadcasts typing status to conversation participants
func (h *Hub) BroadcastTypingIndicator(conversationID, userID string, isTyping bool) {
	// This method will be called by the WebSocket service with proper participant lookup
	// For now, we'll just log the typing event
	status := "stopped typing"
	if isTyping {
		status = "is typing"
	}
	slog.Info("Typing indicator", "user_id", userID, "conversation_id", conversationID, "status", status)
}
