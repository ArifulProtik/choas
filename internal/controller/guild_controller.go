package controller

import (
	"kakashi/chaos/internal/utility"
	"net/http"

	"github.com/labstack/echo/v4"
)

func (c *Controller) CreateGuild(e echo.Context) error {
	ctx := e.Request().Context()
	authUser_id := e.Get("user_id").(string)
	if authUser_id == "" {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrUnauthorized,
		})
	}
	type newguild struct {
		Name string `json:"name" validate:"required,min=2,max=55"`
	}
	input := new(newguild)

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
	guild, err := c.services.CreateGuild(ctx, input.Name, authUser_id)
	if err != nil {
		c.log.Error("controller: guild creation failed", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}
	return e.JSON(http.StatusCreated, guild)

}

func (c *Controller) CreateInvitation(e echo.Context) error { return nil }
