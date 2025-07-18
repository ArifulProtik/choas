package services

import "kakashi/chaos/internal/ent"

type Services struct {
	ent          *ent.Client
	jwt_secret   string
	jwt_audience string
}

func New(ent *ent.Client, jwt_secret string) *Services {
	return &Services{
		ent:          ent,
		jwt_secret:   jwt_secret,
		jwt_audience: "chaos",
	}
}
