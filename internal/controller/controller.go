package controller

import "kakashi/chaos/internal/services"

type Controller struct {
	services *services.Services
}

func New(services *services.Services) *Controller {
	return &Controller{
		services: services,
	}
}
