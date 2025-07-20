package main

import (
	"context"
	"errors"
	"kakashi/chaos/internal/controller"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/migrate"
	"kakashi/chaos/internal/services"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	_ "github.com/lib/pq" // postgres driver

	"github.com/Netflix/go-env"
)

type Config struct {
	ServerAddr     string `env:"SERVER_ADDR,default=:9999"`
	DatabaseDriver string `env:"DATABASE_DRIVER,default=postgres"`
	DatabaseDSN    string `env:"DATABASE_DSN"`
	JWTSecret      string `env:"JWT_SECRET"`
}
type BasicValidator struct {
	validator *validator.Validate
}

func (v *BasicValidator) Validate(i interface{}) error {
	return v.validator.Struct(i)
}

func main() {
	ctx := context.Background()
	var cfg Config
	if _, err := env.UnmarshalFromEnviron(&cfg); err != nil {
		log.Fatalf("main: failed to load config: %v", err)
	}
	entClient, err := ent.Open(cfg.DatabaseDriver, cfg.DatabaseDSN)
	if err != nil {
		log.Fatalf("main: failed to open database: %v", err)
	}
	if err := entClient.Schema.Create(ctx, migrate.WithDropIndex(true), migrate.WithDropColumn(true)); !errors.Is(err, nil) {
		log.Fatal("main: failed to create schema:", err)
	}
	router := echo.New()
	svcs := services.New(entClient, cfg.JWTSecret)
	router.Validator = &BasicValidator{validator: validator.New()}
	router.Use(middleware.CORS())
	AttachRoutes(router.Group("/api/v1"), controller.New(svcs))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	log.Println("main: starting server at :", cfg.ServerAddr)
	go func() {
		if err := router.Start(cfg.ServerAddr); err != nil && err != http.ErrServerClosed {
			router.Logger.Fatal("main: shutting down the server")
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server with a timeout of 10 seconds.
	<-ctx.Done()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := router.Shutdown(ctx); err != nil {
		router.Logger.Fatal(err)
	}
	log.Println("main:good bye")

}

func AttachRoutes(router *echo.Group, controller *controller.Controller) {
	router.POST("/auth/signup", controller.Signup)
	router.GET("/auth/checkusername/:username", controller.CheckAvailabilityOfUsername)
	router.POST("/auth/signin", controller.Signin)
	router.POST("/auth/signout", controller.Signout)
	router.Use(controller.IsAuthenticated)
	router.GET("/auth/me", controller.Me)
	router.POST("/guild", controller.CreateGuild)

	// Friend management routes
	router.POST("/friends/request", controller.SendFriendRequest)
	router.POST("/friends/accept", controller.AcceptFriendRequest)
	router.POST("/friends/decline", controller.DeclineFriendRequest)
	router.DELETE("/friends/:friendID", controller.RemoveFriend)
	router.GET("/friends", controller.GetFriends)
	router.GET("/friends/requests", controller.GetPendingRequests)
}
