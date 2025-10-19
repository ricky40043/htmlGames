package handlers

import (
	"net/http"

	"kahoot-game/internal/websocket"

	"github.com/gin-gonic/gin"
)

// WebSocketHandler WebSocket 處理器
type WebSocketHandler struct {
	hub *websocket.Hub
}

// NewWebSocketHandler 創建 WebSocket 處理器
func NewWebSocketHandler(hub *websocket.Hub) *WebSocketHandler {
	return &WebSocketHandler{
		hub: hub,
	}
}

// HandleWebSocket 處理 WebSocket 連線
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	websocket.ServeWS(h.hub, c.Writer, c.Request)
}

// HandleWebSocketWithRoom 處理帶房間ID的 WebSocket 連線
func (h *WebSocketHandler) HandleWebSocketWithRoom(c *gin.Context) {
	roomID := c.Param("roomId")
	
	// 驗證房間是否存在
	// TODO: 可以添加房間驗證邏輯
	
	c.Header("X-Room-ID", roomID)
	websocket.ServeWS(h.hub, c.Writer, c.Request)
}

// GetHubStats 獲取 Hub 統計資訊
func (h *WebSocketHandler) GetHubStats(c *gin.Context) {
	stats := h.hub.GetStats()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}