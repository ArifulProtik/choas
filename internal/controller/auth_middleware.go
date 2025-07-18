package controller

import (
	"errors"
	"kakashi/chaos/internal/utility"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

func ExtractToken(r echo.Context) (string, error) {
	authHeader := r.Request().Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("no token found")
	}
	bearer := "Bearer "
	if !strings.HasPrefix(authHeader, bearer) {
		return "", errors.New("invalid token format. Expected Bearer <token>")
	}
	token := strings.TrimPrefix(authHeader, bearer)
	return token, nil
}

func (c *Controller) IsAuthenticated(next echo.HandlerFunc) echo.HandlerFunc {
	return func(e echo.Context) error {
		ctx := e.Request().Context()
		token, err := ExtractToken(e)
		if err != nil {
			return e.JSON(http.StatusUnauthorized, ErrorResponse{
				Message: err.Error(),
			})
		}
		id, err := c.services.Verifytoken(token)
		if err != nil {
			return e.JSON(http.StatusUnauthorized, ErrorResponse{
				Message: "Invalid token",
			})
		}
		session, err := c.services.FindSessionByToken(ctx, token)
		if err != nil {
			return e.JSON(http.StatusUnauthorized, ErrorResponse{
				Code:    http.StatusUnauthorized,
				Message: utility.ErrUnauthorized,
			})
		}
		if session.Edges.User.ID != id {
			return e.JSON(http.StatusUnauthorized, ErrorResponse{
				Message: utility.ErrUnauthorized,
			})
		}
		e.Set("user_id", session.Edges.User.ID)
		return next(e)

	}
}
