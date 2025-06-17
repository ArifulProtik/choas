package services

import "kakashi/chaos/internal/ent"

type Services struct {
	ent *ent.Client
}

func New(ent *ent.Client) *Services {
	return &Services{
		ent: ent,
	}
}
