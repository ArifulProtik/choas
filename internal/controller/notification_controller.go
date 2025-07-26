package controller

import (
	"kakashi/chaos/internal/utility"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// GetNotifications handles GET /notifications
func (c *Controller) GetNotifications(e echo.Context) error {
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

	notifications, err := c.services.GetUserNotifications(ctx, authUserID, limit, offset)
	if err != nil {
		if err.Error() == "user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: get notifications failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, notifications)
}

// MarkNotificationAsRead handles PUT /notifications/:notificationID/read
func (c *Controller) MarkNotificationAsRead(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	notificationID := e.Param("notificationID")
	if notificationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Notification ID is required",
		})
	}

	err := c.services.MarkNotificationAsRead(ctx, notificationID, authUserID)
	if err != nil {
		if err.Error() == "notification not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Notification not found",
			})
		}
		c.log.Error("controller: mark notification as read failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Notification marked as read successfully",
	})
}

// MarkAllNotificationsAsRead handles PUT /notifications/read-all
func (c *Controller) MarkAllNotificationsAsRead(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	err := c.services.MarkAllNotificationsAsRead(ctx, authUserID)
	if err != nil {
		if err.Error() == "user not found: not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "User not found",
			})
		}
		c.log.Error("controller: mark all notifications as read failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "All notifications marked as read successfully",
	})
}

// DeleteNotification handles DELETE /notifications/:notificationID
func (c *Controller) DeleteNotification(e echo.Context) error {
	ctx := e.Request().Context()
	authUserID := e.Get("user_id").(string)
	if authUserID == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}

	notificationID := e.Param("notificationID")
	if notificationID == "" {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Notification ID is required",
		})
	}

	err := c.services.DeleteNotification(ctx, notificationID, authUserID)
	if err != nil {
		if err.Error() == "notification not found" {
			return e.JSON(http.StatusNotFound, ErrorResponse{
				Code:    http.StatusNotFound,
				Message: "Notification not found",
			})
		}
		c.log.Error("controller: delete notification failed", "error", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "Notification deleted successfully",
	})
}
