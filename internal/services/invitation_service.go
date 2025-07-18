package services

import (
	"context"
	"crypto/rand"
	"errors"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/invitation"
	"math/big"
)

func (s *Services) GenerateRandomString(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[num.Int64()]
	}
	return string(result), nil
}

func (s *Services) CreateInvitation(ctx context.Context, guildid string, userid string) (*ent.Invitation, error) {
	code, err := s.GenerateRandomString(6)
	if err != nil {
		return nil, err
	}
	return s.ent.Invitation.Create().
		SetGuildID(guildid).
		SetInvitedByID(userid).
		SetCode(code).
		Save(ctx)
}

func (s *Services) FindInvitationByCode(ctx context.Context, code string) (*ent.Guild, error) {
	guild, err := s.ent.Invitation.Query().Where(invitation.CodeEQ(code)).WithGuild().First(ctx)
	if err != nil {
		return nil, errors.New("invalid invitation")
	}
	return guild.Edges.Guild, nil
}

func (s *Services) DeleteInvitationByID(ctx context.Context, id string) error {
	_, err := s.ent.Invitation.Delete().Where(invitation.IDEQ(id)).Exec(ctx)
	if err != nil {
		return err
	}
	return nil
}
