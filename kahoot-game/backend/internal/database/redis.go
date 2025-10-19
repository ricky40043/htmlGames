package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"kahoot-game/internal/config"

	"github.com/go-redis/redis/v8"
)

// NewRedisClient 創建新的 Redis 客戶端
func NewRedisClient(cfg *config.Config) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.GetRedisAddr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
		
		// 連線池設定
		PoolSize:     20,
		MinIdleConns: 5,
		MaxConnAge:   5 * time.Minute,
		
		// 超時設定
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		
		// 重試設定
		MaxRetries:      3,
		MinRetryBackoff: 8 * time.Millisecond,
		MaxRetryBackoff: 512 * time.Millisecond,
	})

	return rdb
}

// TestConnections 測試資料庫連線
func TestConnections(db interface{}, redisClient *redis.Client) error {
	// 測試 PostgreSQL 連線
	if postgresDB, ok := db.(*sql.DB); ok {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		
		if err := postgresDB.PingContext(ctx); err != nil {
			return fmt.Errorf("PostgreSQL 連線失敗: %w", err)
		}
	}

	// 測試 Redis 連線
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := redisClient.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("Redis 連線失敗: %w", err)
	}

	return nil
}

// Redis Key 常數定義
const (
	// 房間相關
	RoomPrefix        = "room:"           // room:{roomId}
	RoomPlayersPrefix = "room_players:"   // room_players:{roomId}
	
	// 玩家相關
	PlayerPrefix = "player:"              // player:{socketId}
	
	// 遊戲狀態相關
	GameStatePrefix = "game_state:"       // game_state:{roomId}
	
	// 答題記錄
	AnswersPrefix = "answers:"            // answers:{roomId}:{questionId}
	
	// 活躍房間列表
	ActiveRoomsKey = "active_rooms"
	
	// 過期時間
	RoomExpiration    = 24 * time.Hour    // 房間 24 小時後過期
	PlayerExpiration  = 2 * time.Hour     // 玩家 2 小時後過期
	AnswerExpiration  = 1 * time.Hour     // 答題記錄 1 小時後過期
)

// RedisKeys Redis 鍵值輔助函數
type RedisKeys struct{}

// NewRedisKeys 創建 Redis 鍵值輔助器
func NewRedisKeys() *RedisKeys {
	return &RedisKeys{}
}

// RoomKey 獲取房間鍵值
func (r *RedisKeys) RoomKey(roomID string) string {
	return RoomPrefix + roomID
}

// RoomPlayersKey 獲取房間玩家列表鍵值
func (r *RedisKeys) RoomPlayersKey(roomID string) string {
	return RoomPlayersPrefix + roomID
}

// PlayerKey 獲取玩家鍵值
func (r *RedisKeys) PlayerKey(socketID string) string {
	return PlayerPrefix + socketID
}

// GameStateKey 獲取遊戲狀態鍵值
func (r *RedisKeys) GameStateKey(roomID string) string {
	return GameStatePrefix + roomID
}

// AnswersKey 獲取答題記錄鍵值
func (r *RedisKeys) AnswersKey(roomID string, questionID int) string {
	return fmt.Sprintf("%s%s:%d", AnswersPrefix, roomID, questionID)
}

// 全域 Redis 鍵值輔助器實例
var Keys = NewRedisKeys()