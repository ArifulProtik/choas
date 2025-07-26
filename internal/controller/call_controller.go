package controller

import (
	"kakashi/chaos/internal/utility"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

// InitiateCall handles POST /calls
func (c *Controller) InitiateCall(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	type initiateCallInput struct {
		CalleeID string `json:"callee_id" validate:"required"`
		CallType string `json:"call_type,omitempty"`
	}

	input := new(initiateCallInput)
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

	// Prevent calling yourself
	if input.CalleeID == authUserID {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Cannot call yourself",
		})
	}

	// Default to voice call if not specified
	if input.CallType == "" {
		input.CallType = "voice"
	}

	call, err := c.services.InitiateCall(ctx, authUserID, input.CalleeID, input.CallType)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		if strings.Contains(err.Error(), "can only call friends") {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Can only call friends",
			})
		}
		if strings.Contains(err.Error(), "cannot call blocked user") {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Cannot call blocked user",
			})
		}
		if strings.Contains(err.Error(), "already in a call") {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: err.Error(),
			})
		}
		c.log.Error("controller: initiate call failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusCreated, call)
}

// AcceptCall handles POST /calls/:callID/accept
func (c *Controller) AcceptCall(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	callID := e.Param("callID")
	if callID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Call ID is required",
		})
	}

	err := c.services.AcceptCall(ctx, callID, authUserID)
	if err != nil {
		if strings.Contains(err.Error(), "call not found") {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Call not found",
			})
		}
		if strings.Contains(err.Error(), "only the callee can accept") {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to accept this call",
			})
		}
		if strings.Contains(err.Error(), "cannot be accepted") {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: err.Error(),
			})
		}
		c.log.Error("controller: accept call failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Call accepted successfully",
	})
}

// DeclineCall handles POST /calls/:callID/decline
func (c *Controller) DeclineCall(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	callID := e.Param("callID")
	if callID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Call ID is required",
		})
	}

	err := c.services.DeclineCall(ctx, callID, authUserID)
	if err != nil {
		if strings.Contains(err.Error(), "call not found") {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Call not found",
			})
		}
		if strings.Contains(err.Error(), "only the callee can decline") {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to decline this call",
			})
		}
		if strings.Contains(err.Error(), "cannot be declined") {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: err.Error(),
			})
		}
		c.log.Error("controller: decline call failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Call declined successfully",
	})
}

// EndCall handles POST /calls/:callID/end
func (c *Controller) EndCall(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	callID := e.Param("callID")
	if callID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Call ID is required",
		})
	}

	err := c.services.EndCall(ctx, callID, authUserID)
	if err != nil {
		if strings.Contains(err.Error(), "call not found") {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Call not found",
			})
		}
		if strings.Contains(err.Error(), "only call participants can end") {
			return e.JSON(http.StatusForbidden, ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Not authorized to end this call",
			})
		}
		if strings.Contains(err.Error(), "cannot be ended") {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: err.Error(),
			})
		}
		c.log.Error("controller: end call failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Call ended successfully",
	})
}

// GetActiveCall handles GET /calls/active
func (c *Controller) GetActiveCall(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	activeCall, err := c.services.GetActiveCall(ctx, authUserID)
	if err != nil {
		c.log.Error("controller: get active call failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	if activeCall == nil {
		return e.JSON(http.StatusOK, echo.Map{
			"active_call": nil,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"active_call": activeCall,
	})
}

// GetCallHistory handles GET /calls/history
func (c *Controller) GetCallHistory(e echo.Context) error {
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

	calls, err := c.services.GetCallHistory(ctx, authUserID, limit, offset)
	if err != nil {
		if strings.Contains(err.Error(), "user not found") {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: get call history failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, calls)
}
