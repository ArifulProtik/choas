package controller

import (
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/utility"
	"net/http"

	"github.com/labstack/echo/v4"
)

// BlockUser handles POST /blocks
func (c *Controller) BlockUser(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	type blockUserInput struct {
		BlockedID string `json:"blocked_id" validate:"required"`
	}

	input := new(blockUserInput)
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

	// Prevent users from blocking themselves
	if authUserID == input.BlockedID {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Cannot block yourself",
		})
	}

	err := c.services.BlockUser(ctx, authUserID, input.BlockedID)
	if err != nil {
		if ent.IsNotFound(err) || err.Error() == "blocked user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		if err.Error() == "user is already blocked" {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: "User is already blocked",
			})
		}
		if err.Error() == "cannot block yourself" {
			return e.JSON(http.StatusBadRequest, ErrorResponse{
				Code:    http.StatusBadRequest,
				Message: "Cannot block yourself",
			})
		}
		c.log.Error("controller: block user failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusCreated, echo.Map{
		"message": "User blocked successfully",
	})
}

// UnblockUser handles DELETE /blocks/:blockedUserID
func (c *Controller) UnblockUser(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	blockedUserID := e.Param("blockedUserID")
	if blockedUserID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Blocked user ID is required",
		})
	}

	err := c.services.UnblockUser(ctx, authUserID, blockedUserID)
	if err != nil {
		if err.Error() == "block not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Block not found",
			})
		}
		c.log.Error("controller: unblock user failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "User unblocked successfully",
	})
}

// GetBlockedUsers handles GET /blocks
func (c *Controller) GetBlockedUsers(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	blockedUsers, err := c.services.GetBlockedUsers(ctx, authUserID)
	if err != nil {
		c.log.Error("controller: get blocked users failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, blockedUsers)
}
