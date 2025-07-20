package controller

import (
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/utility"
	"net/http"

	"github.com/labstack/echo/v4"
)

// SendFriendRequest handles POST /friends/request
func (c *Controller) SendFriendRequest(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	type friendRequestInput struct {
		AddresseeID string `json:"addressee_id" validate:"required"`
	}

	input := new(friendRequestInput)
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

	// Prevent users from sending friend requests to themselves
	if authUserID == input.AddresseeID {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Cannot send friend request to yourself",
		})
	}

	err := c.services.SendFriendRequest(ctx, authUserID, input.AddresseeID)
	if err != nil {
		if ent.IsNotFound(err) || err.Error() == "addressee not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		if err.Error() == "users are already friends" || err.Error() == "friend request already exists" {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: err.Error(),
			})
		}
		if err.Error() == "cannot send friend request to blocked user" {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Cannot send friend request to this user",
			})
		}
		c.log.Error("controller: send friend request failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusCreated, echo.Map{
		"message": "Friend request sent successfully",
	})
}

// AcceptFriendRequest handles POST /friends/accept
func (c *Controller) AcceptFriendRequest(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	type acceptRequestInput struct {
		RequesterID string `json:"requester_id" validate:"required"`
	}

	input := new(acceptRequestInput)
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

	err := c.services.AcceptFriendRequest(ctx, input.RequesterID, authUserID)
	if err != nil {
		if err.Error() == "friend request not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Friend request not found",
			})
		}
		c.log.Error("controller: accept friend request failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Friend request accepted successfully",
	})
}

// DeclineFriendRequest handles POST /friends/decline
func (c *Controller) DeclineFriendRequest(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	type declineRequestInput struct {
		RequesterID string `json:"requester_id" validate:"required"`
	}

	input := new(declineRequestInput)
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

	err := c.services.DeclineFriendRequest(ctx, input.RequesterID, authUserID)
	if err != nil {
		if err.Error() == "friend request not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Friend request not found",
			})
		}
		c.log.Error("controller: decline friend request failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Friend request declined successfully",
	})
}

// RemoveFriend handles DELETE /friends/:friendID
func (c *Controller) RemoveFriend(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	friendID := e.Param("friendID")
	if friendID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Friend ID is required",
		})
	}

	err := c.services.RemoveFriend(ctx, authUserID, friendID)
	if err != nil {
		if err.Error() == "friendship not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Friendship not found",
			})
		}
		c.log.Error("controller: remove friend failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Friend removed successfully",
	})
}

// GetFriends handles GET /friends
func (c *Controller) GetFriends(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	friends, err := c.services.GetFriends(ctx, authUserID)
	if err != nil {
		c.log.Error("controller: get friends failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, friends)
}

// GetPendingRequests handles GET /friends/requests
func (c *Controller) GetPendingRequests(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	pendingRequests, err := c.services.GetPendingRequests(ctx, authUserID)
	if err != nil {
		c.log.Error("controller: get pending requests failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, pendingRequests)
}
