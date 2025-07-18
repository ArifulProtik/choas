package controller

import (
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/utility"
	"net/http"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

func (c *Controller) Signup(e echo.Context) error {
	ctx := e.Request().Context()
	type newUser struct {
		Name            string `json:"name" validate:"required,min=2,max=55"`
		Email           string `json:"email" validate:"required,email"`
		Password        string `json:"password" validate:"required,min=8,max=100"`
		Username        string `json:"username" validate:"required,min=2,max=55"`
		ConfirmPassword string `json:"confirm_password" validate:"required,min=8,max=100,eqfield=Password"`
	}
	inputUser := new(newUser)
	if err := e.Bind(inputUser); err != nil {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: utility.ErrInvalidInput,
		})
	}
	if err := e.Validate(inputUser); err != nil {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
	}

	user, err := c.services.SaveUser(ctx, inputUser.Name, inputUser.Email, inputUser.Username, inputUser.Password)
	if err != nil {
		if ent.IsConstraintError(err) {
			return e.JSON(http.StatusConflict, ErrorResponse{
				Code:    http.StatusConflict,
				Message: "We already have an account with this email",
			})
		}
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusCreated, user)

}

func (c *Controller) CheckAvailabilityOfUsername(e echo.Context) error {
	ctx := e.Request().Context()
	username := e.Param("username")
	_, err := c.services.FindUserByUsername(ctx, username)
	if err == nil {
		return e.JSON(http.StatusConflict, ErrorResponse{
			Code:    http.StatusConflict,
			Message: "username is already taken",
		})
	}
	return e.JSON(http.StatusOK, echo.Map{"message": "username available"})
}

func (c *Controller) Signin(e echo.Context) error {
	ctx := e.Request().Context()
	type signinInput struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=8,max=100"`
	}
	input := new(signinInput)
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
	user, err := c.services.FindUserByEmail(ctx, input.Email)
	if err != nil {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrInvalidCredentials,
		})
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return e.JSON(http.StatusUnauthorized, ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: utility.ErrInvalidCredentials,
		})
	}

	token, err := c.services.SignAccessToken(user.ID)
	if err != nil {
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}
	err = c.services.CreateSession(ctx, user.ID, token, e.RealIP(), e.Request().UserAgent())
	if err != nil {
		c.log.Error("controller: session creation failed", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"user":  user,
		"token": token,
	})
}

func (c *Controller) Signout(e echo.Context) error {
	ctx := e.Request().Context()
	token, err := ExtractToken(e)
	if err != nil {
		return e.JSON(http.StatusBadRequest, ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
	}
	err = c.services.DeleteSessionByToken(ctx, token)
	if err != nil {
		c.log.Error("controller: session deletion failed", err.Error())
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}

	return e.JSON(http.StatusOK, echo.Map{
		"message": "signed out successfully",
	})
}

func (c *Controller) Me(e echo.Context) error {
	ctx := e.Request().Context()
	uid := e.Get("user_id").(string)
	user, err := c.services.FindUserByID(ctx, uid)
	if err != nil {
		return e.JSON(http.StatusInternalServerError, ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: utility.ErrInternalError,
		})
	}
	return e.JSON(http.StatusOK, user)
}
