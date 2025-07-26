package services

import (
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ws"
)

type Services struct {
	ent          *ent.Client
	jwt_secret   string
	jwt_audience string
	WSHub        *ws.Hub
}

func New(ent *ent.Client, jwt_secret string, wsHub *ws.Hub) *Services {
	return &Services{
		ent:          ent,
		jwt_secret:   jwt_secret,
		jwt_audience: "chaos",
		WSHub:        wsHub,
	}
}
