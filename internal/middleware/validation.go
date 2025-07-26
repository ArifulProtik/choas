package middleware

import (
	"context"
	"fmt"
	"kakashi/chaos/internal/services"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

// RateLimiter implements a simple in-memory rate limiter
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// Allow checks if a request is allowed for the given key
func (rl *RateLimiter) Allow(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// Get existing requests for this key
	requests := rl.requests[key]

	// Filter out old requests
	var validRequests []time.Time
	for _, req := range requests {
		if req.After(cutoff) {
			validRequests = append(validRequests, req)
		}
	}

	// Check if we're under the limit
	if len(validRequests) >= rl.limit {
		rl.requests[key] = validRequests
		return false
	}

	// Add current request
	validRequests = append(validRequests, now)
	rl.requests[key] = validRequests
	return true
}

// ValidationMiddleware provides security validation middleware
type ValidationMiddleware struct {
	services         *services.Services
	messageRateLimit *RateLimiter
	friendRateLimit  *RateLimiter
	generalRateLimit *RateLimiter
}

// NewValidationMiddleware creates a new validation middleware
func NewValidationMiddleware(services *services.Services) *ValidationMiddleware {
	return &ValidationMiddleware{
		services:         services,
		messageRateLimit: NewRateLimiter(60, time.Minute),  // 60 messages per minute
		friendRateLimit:  NewRateLimiter(10, time.Minute),  // 10 friend requests per minute
		generalRateLimit: NewRateLimiter(100, time.Minute), // 100 general requests per minute
	}
}

// ValidateFriendshipForMessaging validates that users are friends before allowing messaging
func (vm *ValidationMiddleware) ValidateFriendshipForMessaging() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Only apply to messaging endpoints
			if !strings.Contains(c.Request().URL.Path, "/conversations/") ||
				!strings.Contains(c.Request().URL.Path, "/messages") {
				return next(c)
			}

			// Skip for GET requests (reading messages)
			if c.Request().Method == "GET" {
				return next(c)
			}

			ctx := c.Request().Context()
			userID := c.Get("user_id").(string)
			conversationID := c.Param("conversationID")

			if conversationID != "" {
				// Validate that user is a participant and has permission to send messages
				err := vm.validateConversationAccess(ctx, userID, conversationID)
				if err != nil {
					return c.JSON(http.StatusForbidden, map[string]interface{}{
						"code":    http.StatusForbidden,
						"message": err.Error(),
					})
				}
			}

			return next(c)
		}
	}
}

// ValidateConversationParticipant validates that user is a participant in the conversation
func (vm *ValidationMiddleware) ValidateConversationParticipant() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Only apply to conversation-specific endpoints
			conversationID := c.Param("conversationID")
			if conversationID == "" {
				return next(c)
			}

			ctx := c.Request().Context()
			userID := c.Get("user_id").(string)

			// Validate conversation access
			err := vm.validateConversationAccess(ctx, userID, conversationID)
			if err != nil {
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"code":    http.StatusForbidden,
					"message": err.Error(),
				})
			}

			return next(c)
		}
	}
}

// ValidateBlockStatus validates that users are not blocked
func (vm *ValidationMiddleware) ValidateBlockStatus() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Apply to friend and messaging operations
			if !strings.Contains(c.Request().URL.Path, "/friends") &&
				!strings.Contains(c.Request().URL.Path, "/conversations") {
				return next(c)
			}

			// Skip for GET requests and block-related endpoints
			if c.Request().Method == "GET" || strings.Contains(c.Request().URL.Path, "/blocks") {
				return next(c)
			}

			ctx := c.Request().Context()
			userID := c.Get("user_id").(string)

			// For friend requests, check the target user
			if strings.Contains(c.Request().URL.Path, "/friends") {
				var targetUserID string

				// Extract target user from request body or path
				if c.Request().Method == "POST" && strings.HasSuffix(c.Request().URL.Path, "/request") {
					var req struct {
						AddresseeID string `json:"addressee_id"`
					}
					if err := c.Bind(&req); err == nil {
						targetUserID = req.AddresseeID
					}
				} else {
					targetUserID = c.Param("friendID")
				}

				if targetUserID != "" {
					isBlocked, err := vm.services.IsBlocked(ctx, userID, targetUserID)
					if err != nil {
						return c.JSON(http.StatusInternalServerError, map[string]interface{}{
							"code":    http.StatusInternalServerError,
							"message": "Failed to check block status",
						})
					}
					if isBlocked {
						return c.JSON(http.StatusForbidden, map[string]interface{}{
							"code":    http.StatusForbidden,
							"message": "Cannot perform action with blocked user",
						})
					}
				}
			}

			return next(c)
		}
	}
}

// RateLimitMessages applies rate limiting to message sending
func (vm *ValidationMiddleware) RateLimitMessages() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Only apply to POST message endpoints
			if c.Request().Method != "POST" ||
				!strings.Contains(c.Request().URL.Path, "/messages") {
				return next(c)
			}

			userID := c.Get("user_id").(string)
			if !vm.messageRateLimit.Allow(userID) {
				return c.JSON(http.StatusTooManyRequests, map[string]interface{}{
					"code":    http.StatusTooManyRequests,
					"message": "Message rate limit exceeded. Please wait before sending more messages.",
				})
			}

			return next(c)
		}
	}
}

// RateLimitFriendRequests applies rate limiting to friend requests
func (vm *ValidationMiddleware) RateLimitFriendRequests() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Only apply to POST friend request endpoints
			if c.Request().Method != "POST" ||
				!strings.HasSuffix(c.Request().URL.Path, "/request") {
				return next(c)
			}

			userID := c.Get("user_id").(string)
			if !vm.friendRateLimit.Allow(userID) {
				return c.JSON(http.StatusTooManyRequests, map[string]interface{}{
					"code":    http.StatusTooManyRequests,
					"message": "Friend request rate limit exceeded. Please wait before sending more requests.",
				})
			}

			return next(c)
		}
	}
}

// RateLimitGeneral applies general rate limiting
func (vm *ValidationMiddleware) RateLimitGeneral() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userID := c.Get("user_id").(string)
			if !vm.generalRateLimit.Allow(userID) {
				return c.JSON(http.StatusTooManyRequests, map[string]interface{}{
					"code":    http.StatusTooManyRequests,
					"message": "Rate limit exceeded. Please wait before making more requests.",
				})
			}

			return next(c)
		}
	}
}

// validateConversationAccess checks if user has access to a conversation
func (vm *ValidationMiddleware) validateConversationAccess(ctx context.Context, userID, conversationID string) error {
	// Check if user is a participant in the conversation
	participants, err := vm.services.GetConversationParticipantsPublic(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get conversation participants")
	}

	isParticipant := false
	for _, participantID := range participants {
		if participantID == userID {
			isParticipant = true
			break
		}
	}

	if !isParticipant {
		return fmt.Errorf("not authorized to access this conversation")
	}

	return nil
}
