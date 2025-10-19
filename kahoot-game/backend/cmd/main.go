package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"kahoot-game/internal/config"
	"kahoot-game/internal/handlers"
	"kahoot-game/internal/services"
	"kahoot-game/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 載入環境變數
	if err := godotenv.Load(); err != nil {
		log.Println("警告: 無法載入 .env 文件，使用系統環境變數")
	}

	// 載入配置
	cfg := config.Load()

	// 設置 Gin 模式
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 測試模式：跳過資料庫連線
	log.Println("⚠️ 測試模式：跳過資料庫連線")
	log.Println("✅ 將使用備用題目和記憶體存儲")

	// 初始化服務層（測試模式）
	gameService := services.NewGameService(nil, nil)
	roomService := services.NewRoomService(nil, gameService)
	questionService := services.NewQuestionService(nil)

	// 初始化 WebSocket Hub
	wsHub := websocket.NewHub(roomService, gameService)
	go wsHub.Run()

	// 初始化處理器
	gameHandler := handlers.NewGameHandler(gameService)
	roomHandler := handlers.NewRoomHandler(roomService)
	questionHandler := handlers.NewQuestionHandler(questionService)
	wsHandler := handlers.NewWebSocketHandler(wsHub)

	// 設置路由
	router := setupRoutes(cfg, gameHandler, roomHandler, questionHandler, wsHandler)

	// 創建 HTTP 服務器
	server := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: router,
	}

	// 在 goroutine 中啟動服務器
	go func() {
		log.Printf("🚀 服務器啟動在 http://%s:%s", cfg.Host, cfg.Port)
		log.Printf("📡 WebSocket 端點: ws://%s:%s/ws", cfg.Host, cfg.Port)
		log.Printf("🎮 API 文檔: http://%s:%s/api/health", cfg.Host, cfg.Port)
		
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ 服務器啟動失敗: %v", err)
		}
	}()

	// 等待中斷信號
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🔄 正在關閉服務器...")

	// 優雅關閉，超時 5 秒
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("❌ 服務器關閉失敗: %v", err)
	}

	log.Println("✅ 服務器已關閉")
}

func setupRoutes(cfg *config.Config, gameHandler *handlers.GameHandler, roomHandler *handlers.RoomHandler, questionHandler *handlers.QuestionHandler, wsHandler *handlers.WebSocketHandler) *gin.Engine {
	router := gin.Default()

	// CORS 中間件
	router.Use(corsMiddleware(cfg.CORSOrigins))

	// 健康檢查端點
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "kahoot-game-backend",
			"version":   "1.0.0",
			"timestamp": time.Now().UTC(),
		})
	})

	// API 路由群組
	api := router.Group("/api")
	{
		// 遊戲相關
		api.GET("/games", gameHandler.GetActiveGames)
		api.GET("/games/:gameId/stats", gameHandler.GetGameStats)

		// 房間相關
		api.POST("/rooms", roomHandler.CreateRoom)
		api.GET("/rooms/:roomId", roomHandler.GetRoom)
		api.DELETE("/rooms/:roomId", roomHandler.DeleteRoom)

		// 題目相關
		api.GET("/questions", questionHandler.GetQuestions)
		api.GET("/questions/random/:count", questionHandler.GetRandomQuestions)
		api.POST("/questions", questionHandler.CreateQuestion)
	}

	// WebSocket 端點
	router.GET("/ws", wsHandler.HandleWebSocket)
	router.GET("/ws/:roomId", wsHandler.HandleWebSocketWithRoom)

	// 靜態文件服務 (用於開發)
	if cfg.Environment == "development" {
		router.Static("/static", "./static")
	}

	return router
}

func corsMiddleware(origins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// 檢查是否為允許的 origin
		allowed := false
		for _, allowedOrigin := range origins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}