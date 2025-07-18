package services

import (
	"errors"
	"slices"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (s *Services) SignToken(claims jwt.RegisteredClaims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwt_secret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func (s *Services) SignAccessToken(subject string) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   subject,
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Audience:  jwt.ClaimStrings{s.jwt_audience},
	}
	return s.SignToken(claims)
}

func (s *Services) Verifytoken(token string) (string, error) {
	claims := jwt.RegisteredClaims{}
	decoded, err := jwt.ParseWithClaims(token, &claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.jwt_secret), nil
	})
	if err != nil {
		return "", err
	}
	if !decoded.Valid {
		return "", errors.New("invalid token")
	}
	if !slices.Contains(claims.Audience, s.jwt_audience) {
		return "", errors.New("invalid token with improper audience")
	}
	return claims.Subject, nil
}
