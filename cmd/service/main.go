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

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq" // postgres driver

	"github.com/Netflix/go-env"
)

type Config struct {
	ServerAddr     string `env:"SERVER_ADDR,default=:9999"`
	DatabaseDriver string `env:"DATABASE_DRIVER,default=postgres"`
	DatabaseDSN    string `env:"DATABASE_DSN"`
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
	svcs := services.New(entClient)
	AttachRoutes(router.Group("/api/v1"), controller.New(svcs))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	log.Println("main: starting server at :", cfg.ServerAddr)
	go func() {
		if err := router.Start(cfg.ServerAddr); err != nil && err != http.ErrServerClosed {
			router.Logger.Fatal("shutting down the server")
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
}
