package services

import (
	"context"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/session"
)

func (s *Services) CreateSession(ctx context.Context, userid string, token string, ip string, userAgent string) error {

	_, err := s.ent.Session.Create().
		SetToken(token).
		SetUserID(userid).
		SetIP(ip).
		SetUserAgent(userAgent).
		Save(ctx)
	if err != nil {
		return err
	}

	return nil
}

func (s *Services) DeleteSessionByToken(ctx context.Context, token string) error {
	_, err := s.ent.Session.Delete().Where(session.TokenEQ(token)).Exec(ctx)
	if err != nil {
		return err
	}

	return nil
}

func (s *Services) FindSessionByToken(ctx context.Context, token string) (*ent.Session, error) {
	session, err := s.ent.Session.Query().Where(session.TokenEQ(token)).WithUser().First(ctx)
	if err != nil {
		return nil, err
	}

	return session, nil
}
