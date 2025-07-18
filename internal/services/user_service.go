package services

import (
	"context"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/user"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *Services) SaveUser(ctx context.Context, name string, email string, username string, password string) (*ent.User, error) {
	hashedpassword, err := HashPassword(password)
	if err != nil {
		return nil, err
	}
	return s.ent.User.Create().
		SetName(name).
		SetEmail(email).
		SetUsername(username).
		SetPassword(hashedpassword).
		Save(ctx)

}

func (s *Services) FindUserByEmail(ctx context.Context, email string) (*ent.User, error) {
	return s.ent.User.Query().Where(user.EmailEQ(email)).First(ctx)
}

func (s *Services) FindUserByID(ctx context.Context, id string) (*ent.User, error) {
	return s.ent.User.Query().Where(user.IDEQ(id)).First(ctx)
}

func (s *Services) FindUserByUsername(ctx context.Context, username string) (*ent.User, error) {
	return s.ent.User.Query().Where(user.UsernameEQ(username)).First(ctx)
}
