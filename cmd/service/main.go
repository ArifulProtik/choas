package main

import (
	"context"
	"errors"
	"fmt"
	"kakashi/chaos/internal/controller"
	"kakashi/chaos/internal/ent"
	"kakashi/chaos/internal/ent/migrate"
	custommiddleware "kakashi/chaos/internal/middleware"
	"kakashi/chaos/internal/services"
	"kakashi/chaos/internal/ws"
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

	// Apply database optimizations
	if err := setupDatabaseOptimizations(ctx, entClient); err != nil {
		log.Printf("main: warning - failed to apply database optimizations: %v", err)
	}
	// Initialize WebSocket hub
	wsHub := ws.NewHub()
	go wsHub.Run()

	router := echo.New()
	svcs := services.New(entClient, cfg.JWTSecret, wsHub)
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
	// Create validation middleware
	validationMiddleware := custommiddleware.NewValidationMiddleware(controller.GetServices())

	router.POST("/auth/signup", controller.Signup)
	router.GET("/auth/checkusername/:username", controller.CheckAvailabilityOfUsername)
	router.POST("/auth/signin", controller.Signin)
	router.POST("/auth/signout", controller.Signout)
	router.Use(controller.IsAuthenticated)

	// Apply security middleware to authenticated routes
	router.Use(validationMiddleware.RateLimitGeneral())
	router.Use(validationMiddleware.ValidateBlockStatus())
	router.GET("/auth/me", controller.Me)
	router.POST("/guild", controller.CreateGuild)

	// Friend management routes
	friendRoutes := router.Group("/friends")
	friendRoutes.Use(validationMiddleware.RateLimitFriendRequests())
	friendRoutes.POST("/request", controller.SendFriendRequest)
	friendRoutes.POST("/accept", controller.AcceptFriendRequest)
	friendRoutes.POST("/decline", controller.DeclineFriendRequest)
	friendRoutes.DELETE("/:friendID", controller.RemoveFriend)
	friendRoutes.GET("", controller.GetFriends)
	friendRoutes.GET("/requests", controller.GetPendingRequests)
	friendRoutes.GET("/search", controller.SearchFriends)

	// Block management routes
	router.POST("/blocks", controller.BlockUser)
	router.DELETE("/blocks/:blockedUserID", controller.UnblockUser)
	router.GET("/blocks", controller.GetBlockedUsers)

	// User search routes
	router.GET("/users/search", controller.SearchUsers)

	// Messaging routes
	messagingRoutes := router.Group("")
	messagingRoutes.Use(validationMiddleware.RateLimitMessages())
	messagingRoutes.Use(validationMiddleware.ValidateFriendshipForMessaging())
	messagingRoutes.Use(validationMiddleware.ValidateConversationParticipant())

	messagingRoutes.POST("/conversations/:conversationID/messages", controller.SendMessage)
	messagingRoutes.GET("/conversations", controller.GetUserConversations)
	messagingRoutes.GET("/conversations/search", controller.SearchConversations)
	messagingRoutes.GET("/conversations/:conversationID", controller.GetConversationDetails)
	messagingRoutes.GET("/conversations/:conversationID/messages", controller.GetConversationMessages)
	messagingRoutes.PUT("/conversations/:conversationID/read", controller.MarkMessagesAsRead)
	messagingRoutes.PUT("/conversations/:conversationID/archive", controller.ArchiveConversation)
	messagingRoutes.PUT("/conversations/:conversationID/unarchive", controller.UnarchiveConversation)
	messagingRoutes.PUT("/conversations/:conversationID/mute", controller.MuteConversation)
	messagingRoutes.PUT("/conversations/:conversationID/unmute", controller.UnmuteConversation)
	messagingRoutes.DELETE("/messages/:messageID", controller.DeleteMessage)
	messagingRoutes.GET("/messages/search", controller.SearchMessages)

	// Notification routes
	router.GET("/notifications", controller.GetNotifications)
	router.PUT("/notifications/:notificationID/read", controller.MarkNotificationAsRead)
	router.PUT("/notifications/read-all", controller.MarkAllNotificationsAsRead)
	router.DELETE("/notifications/:notificationID", controller.DeleteNotification)

	// Call management routes
	callRoutes := router.Group("/calls")
	callRoutes.Use(validationMiddleware.RateLimitGeneral())
	callRoutes.POST("", controller.InitiateCall)
	callRoutes.POST("/:callID/accept", controller.AcceptCall)
	callRoutes.POST("/:callID/decline", controller.DeclineCall)
	callRoutes.POST("/:callID/end", controller.EndCall)
	callRoutes.GET("/active", controller.GetActiveCall)
	callRoutes.GET("/history", controller.GetCallHistory)

	// WebSocket route (authentication handled in the WebSocket service)
	router.GET("/ws", controller.HandleWebSocket)
}

// Thsi is a TODO:

// setupDatabaseOptimizations applies database performance optimizations
func setupDatabaseOptimizations(ctx context.Context, client *ent.Client) error {
	// Set up connection pooling
	if err := ent.SetupConnectionPooling(client); err != nil {
		return fmt.Errorf("failed to setup connection pooling: %w", err)
	}

	// Perform health check
	if err := ent.DatabaseHealthCheck(ctx, client); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	// Apply constraints (if any)
	if err := ent.ApplyDatabaseConstraints(ctx, client); err != nil {
		return fmt.Errorf("failed to apply database constraints: %w", err)
	}

	// Analyze table statistics for better query planning
	if err := ent.AnalyzeTableStatistics(ctx, client); err != nil {
		return fmt.Errorf("failed to analyze table statistics: %w", err)
	}

	log.Println("main: database optimizations applied successfully")
	return nil
}
