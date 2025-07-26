package ws

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, you should check the origin properly
		return true
	},
}

// NewConnection creates a new WebSocket connection
func NewConnection(userID string, conn *websocket.Conn, hub *Hub) *Connection {
	return &Connection{
		UserID:   userID,
		Conn:     conn,
		Send:     make(chan WSMessage, 256),
		Hub:      hub,
		LastPing: time.Now(),
	}
}

// readPump handles reading messages from the WebSocket connection
func (c *Connection) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		c.LastPing = time.Now()
		return nil
	})

	for {
		var message WSMessage
		err := c.Conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("WebSocket error", "error", err, "user_id", c.UserID)
			}
			break
		}

		// Handle incoming messages
		c.handleMessage(message)
	}
}

// writePump handles writing messages to the WebSocket connection
func (c *Connection) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				slog.Error("Failed to write message", "error", err, "user_id", c.UserID)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (c *Connection) handleMessage(message WSMessage) {
	switch message.Type {
	case MessageTypePing:
		// Respond with pong
		pongMessage := WSMessage{
			Type:      MessageTypePong,
			Data:      nil,
			Timestamp: time.Now(),
		}
		select {
		case c.Send <- pongMessage:
		default:
			slog.Warn("Failed to send pong message", "user_id", c.UserID)
		}

	case MessageTypePong:
		// Update last ping time
		c.LastPing = time.Now()

	case MessageTypeTyping:
		// Handle typing indicator - broadcast to conversation participants
		if data, ok := message.Data.(map[string]interface{}); ok {
			if conversationID, exists := data["conversation_id"].(string); exists {
				c.Hub.BroadcastTypingIndicator(conversationID, c.UserID, true)
			}
		}

	case MessageTypeStopTyping:
		// Handle stop typing indicator
		if data, ok := message.Data.(map[string]interface{}); ok {
			if conversationID, exists := data["conversation_id"].(string); exists {
				c.Hub.BroadcastTypingIndicator(conversationID, c.UserID, false)
			}
		}

	case MessageTypeMessage:
		// Handle incoming message - this will be processed by the messaging service
		slog.Info("Received message via WebSocket", "user_id", c.UserID, "type", message.Type)
		// Note: Message sending should be handled through HTTP endpoints for proper validation
		// WebSocket messages are primarily for real-time notifications

	default:
		// Log unhandled message types
		slog.Info("Received unhandled message type", "type", message.Type, "user_id", c.UserID)
	}
}

// Start begins the connection's read and write pumps
func (c *Connection) Start() {
	// Register the connection with the hub
	c.Hub.register <- c

	// Start the read and write pumps in separate goroutines
	go c.writePump()
	go c.readPump()
}

// SendMessage sends a message to this connection
func (c *Connection) SendMessage(message WSMessage) {
	select {
	case c.Send <- message:
	default:
		// Channel is full, close the connection
		close(c.Send)
	}
}

// Close gracefully closes the connection
func (c *Connection) Close() {
	c.Conn.Close()
}
