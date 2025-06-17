package controller

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func (c *Controller) Signup(e echo.Context) error {
	return e.JSON(http.StatusOK, "Ok")
}
