package handlers

import (
	"net/http"

	"kahoot-game/internal/models"
	"kahoot-game/internal/services"

	"github.com/gin-gonic/gin"
)

// RoomHandler 房間處理器
type RoomHandler struct {
	roomService *services.RoomService
}

// NewRoomHandler 創建房間處理器
func NewRoomHandler(roomService *services.RoomService) *RoomHandler {
	return &RoomHandler{
		roomService: roomService,
	}
}

// CreateRoom 創建房間
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	var req models.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "請求資料格式錯誤",
			"details": err.Error(),
		})
		return
	}

	room, err := h.roomService.CreateRoom(req.HostName, req.TotalQuestions, req.QuestionTimeLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "創建房間失敗",
			"details": err.Error(),
		})
		return
	}

	// 動態生成 joinUrl
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	
	// 獲取 Host，如果是 localhost:8080 則改為前端地址
	host := c.Request.Host
	if host == "localhost:8080" || host == "127.0.0.1:8080" {
		host = "localhost:5173"
	}
	
	joinUrl := scheme + "://" + host + "/join/" + room.ID
	qrCodeData := joinUrl // QR Code 也使用完整的 joinUrl
	
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": gin.H{
			"roomId":            room.ID,
			"hostName":          room.HostName,
			"totalQuestions":    room.TotalQuestions,
			"questionTimeLimit": room.QuestionTimeLimit,
			"qrCode":            "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + qrCodeData,
			"joinUrl":           joinUrl,
			"createdAt":         room.CreatedAt,
		},
	})
}

// GetRoom 獲取房間資訊
func (h *RoomHandler) GetRoom(c *gin.Context) {
	roomID := c.Param("roomId")

	room, err := h.roomService.GetRoom(roomID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "房間不存在",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    room,
	})
}

// DeleteRoom 刪除房間
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	roomID := c.Param("roomId")

	err := h.roomService.DeleteRoom(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "刪除房間失敗",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "房間已刪除",
	})
}
