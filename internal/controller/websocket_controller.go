package controller

import (
	"kakashi/chaos/internal/utility"
	"kakashi/chaos/internal/ws"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, you should check the origin properly
		return true
	},
}

// HandleWebSocket handles WebSocket connection upgrades
// GET /ws - WebSocket endpoint with JWT authentication
func (c *Controller) HandleWebSocket(e echo.Context) error {
	ctx := e.Request().Context()

	// Extract JWT token from query parameter or Authorization header
	token := c.extractWebSocketToken(e)
	if token == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: "Missing authentication token",
		})
	}

	// Validate JWT token and extract user ID
	userID, err := c.services.ValidateWebSocketToken(token)
	if err != nil {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: "Invalid authentication token",
		})
	}

	// Verify user exists in database
	err = c.services.ValidateWebSocketUser(ctx, userID)
	if err != nil {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: "User not found",
		})
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(e.Response(), e.Request(), nil)
	if err != nil {
		c.log.Error("controller: failed to upgrade WebSocket connection", "error", err.Error(), "user_id", userID)
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	// Handle user connection (broadcast online status)
	err = c.services.HandleUserConnection(ctx, userID)
	if err != nil {
		c.log.Error("Failed to handle user connection", "error", err.Error(), "user_id", userID)
		// Continue with connection establishment even if this fails
	}

	// Create and start the WebSocket connection
	wsConn := ws.NewConnection(userID, conn, c.services.WSHub)
	wsConn.Start()

	c.log.Info("WebSocket connection established", "user_id", userID)
	return nil
}

// extractWebSocketToken extracts JWT token from query parameter or Authorization header
func (c *Controller) extractWebSocketToken(e echo.Context) string {
	// First, try to get token from query parameter
	token := e.QueryParam("token")
	if token != "" {
		return token
	}

	// Then, try to get token from Authorization header
	authHeader := e.Request().Header.Get("Authorization")
	if authHeader != "" {
		// Remove "Bearer " prefix if present
		if strings.HasPrefix(authHeader, "Bearer ") {
			return strings.TrimPrefix(authHeader, "Bearer ")
		}
		return authHeader
	}

	return ""
}
