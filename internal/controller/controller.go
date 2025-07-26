package controller

import (
	"kakashi/chaos/internal/services"
	"log/slog"
)

type Controller struct {
	services *services.Services
	log      *slog.Logger
}

func New(services *services.Services) *Controller {
	return &Controller{
		services: services,
		log:      slog.Default(),
	}
}

// GetServices returns the services instance
func (c *Controller) GetServices() *services.Services {
	return c.services
}

type ErrorResponse struct {
	Code    int         `json:"code"`
	Message interface{} `json:"message"`
}
