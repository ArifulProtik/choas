package controller

import (
	"kakashi/chaos/internal/services"
	"kakashi/chaos/internal/utility"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// SendMessage handles POST /conversations/:conversationID/messages
func (c *Controller) SendMessage(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	type sendMessageInput struct {
		Content string `json:"content" validate:"required"`
	}

	input := new(sendMessageInput)
	if err := e.Bind(input); err != nil {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: utility.ErrInvalidInput,
		})
	}

	if err := e.Validate(input); err != nil {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
	}

	message, err := c.services.SendMessage(ctx, authUserID, conversationID, input.Content)
	if err != nil {
		if err.Error() == "sender not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to send messages in this conversation",
			})
		}
		if err.Error() == "can only send messages to friends" || err.Error() == "cannot send message to blocked user" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Cannot send message to this user",
			})
		}
		c.log.Error("controller: send message failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusCreated, message)
}

// GetUserConversations handles GET /conversations
func (c *Controller) GetUserConversations(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	// Parse pagination parameters
	limitStr := e.QueryParam("limit")
	offsetStr := e.QueryParam("offset")

	limit := 20 // default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := 0 // default offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	conversations, err := c.services.GetUserConversations(ctx, authUserID, limit, offset)
	if err != nil {
		if err.Error() == "user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: get user conversations failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, conversations)
}

// GetConversationDetails handles GET /conversations/:conversationID
func (c *Controller) GetConversationDetails(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	// Get single conversation details by getting conversations with limit 1 and filtering by ID
	conversations, err := c.services.GetUserConversations(ctx, authUserID, 1, 0)
	if err != nil {
		if err.Error() == "user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: get conversation details failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	// Find the specific conversation
	var targetConversation *services.ConversationWithDetails
	for _, conv := range conversations {
		if conv.ID == conversationID {
			targetConversation = conv
			break
		}
	}

	// If not found in first page, we need to check if user is participant
	if targetConversation == nil {
		// This is a simplified approach - in production you might want to optimize this
		// by adding a specific service method to get conversation details by ID
		return e.JSON(http.StatusNotFound, ErrorResponse{
			Code:    http.StatusNotFound,
			Message: "Conversation not found or access denied",
		})
	}

	return e.JSON(http.StatusOK, targetConversation)
}

// GetConversationMessages handles GET /conversations/:conversationID/messages
func (c *Controller) GetConversationMessages(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	// Parse pagination parameters
	limitStr := e.QueryParam("limit")
	offsetStr := e.QueryParam("offset")

	limit := 50 // default limit for messages
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := 0 // default offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	messages, err := c.services.GetConversationMessages(ctx, conversationID, authUserID, limit, offset)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to access this conversation",
			})
		}
		c.log.Error("controller: get conversation messages failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, messages)
}

// MarkMessagesAsRead handles PUT /conversations/:conversationID/read
func (c *Controller) MarkMessagesAsRead(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	err := c.services.MarkMessagesAsRead(ctx, conversationID, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to access this conversation",
			})
		}
		c.log.Error("controller: mark messages as read failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Messages marked as read successfully",
	})
}

// DeleteMessage handles DELETE /messages/:messageID
func (c *Controller) DeleteMessage(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	messageID := e.Param("messageID")
	if messageID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Message ID is required",
		})
	}

	err := c.services.DeleteMessage(ctx, messageID, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "message not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "can only delete own messages" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Can only delete your own messages",
			})
		}
		if err.Error() == "message is already deleted" {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: "Message is already deleted",
			})
		}
		c.log.Error("controller: delete message failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Message deleted successfully",
	})
}

// SearchMessages handles GET /messages/search
func (c *Controller) SearchMessages(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	query := e.QueryParam("q")
	if query == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Search query parameter 'q' is required",
		})
	}

	// Parse pagination parameters
	limitStr := e.QueryParam("limit")
	offsetStr := e.QueryParam("offset")

	limit := 20 // default limit for search results
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := 0 // default offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	results, err := c.services.SearchMessages(ctx, authUserID, query, limit, offset)
	if err != nil {
		if err.Error() == "user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: search messages failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, results)
}

// ArchiveConversation archives a conversation for the authenticated user
// PUT /conversations/:conversationID/archive
func (c *Controller) ArchiveConversation(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	err := c.services.ArchiveConversation(ctx, conversationID, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to access this conversation",
			})
		}
		c.log.Error("controller: archive conversation failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Conversation archived successfully",
	})
}

// UnarchiveConversation unarchives a conversation for the authenticated user
// PUT /conversations/:conversationID/unarchive
func (c *Controller) UnarchiveConversation(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	err := c.services.UnarchiveConversation(ctx, conversationID, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to access this conversation",
			})
		}
		c.log.Error("controller: unarchive conversation failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Conversation unarchived successfully",
	})
}

// MuteConversation mutes a conversation for the authenticated user
// PUT /conversations/:conversationID/mute
func (c *Controller) MuteConversation(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	err := c.services.MuteConversation(ctx, conversationID, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to access this conversation",
			})
		}
		c.log.Error("controller: mute conversation failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Conversation muted successfully",
	})
}

// UnmuteConversation unmutes a conversation for the authenticated user
// PUT /conversations/:conversationID/unmute
func (c *Controller) UnmuteConversation(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	conversationID := e.Param("conversationID")
	if conversationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Conversation ID is required",
		})
	}

	err := c.services.UnmuteConversation(ctx, conversationID, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" || err.Error() == "conversation not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Resource not found",
			})
		}
		if err.Error() == "user is not a participant in this conversation" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to access this conversation",
			})
		}
		c.log.Error("controller: unmute conversation failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Conversation unmuted successfully",
	})
}

// SearchConversations searches conversations by participant names
// GET /conversations/search?q=query&limit=20&offset=0
func (c *Controller) SearchConversations(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	query := e.QueryParam("q")
	if query == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Search query parameter 'q' is required",
		})
	}

	// Parse pagination parameters
	limitStr := e.QueryParam("limit")
	offsetStr := e.QueryParam("offset")

	limit := 20 // default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offset := 0 // default offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	conversations, err := c.services.SearchConversations(ctx, authUserID, query, limit, offset)
	if err != nil {
		if err.Error() == "user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: search conversations failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, conversations)
}
